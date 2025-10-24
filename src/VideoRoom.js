import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function VideoRoom({ roomId, userName }) {
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peersRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [captions, setCaptions] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);

  // Recording
  const startRecording = (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const file = new File([blob], `${roomId}-${Date.now()}.webm`);
          const formData = new FormData();
          formData.append("file", file);
          await fetch("http://localhost:5000/upload-recording", { method: "POST", body: formData });
        } catch (error) {
          console.error("Error uploading recording:", error);
        }
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  // WebRTC
  useEffect(() => {
    let localStream = null;
    let recognition = null;
    let mounted = true;

    const createPeer = (otherUser, callerID, stream, initiator = true) => {
      const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.ontrack = (event) => {
        if (mounted) {
          setRemoteStreams(prev => {
            if (!prev.find(s => s.id === event.streams[0].id)) return [...prev, event.streams[0]];
            return prev;
          });
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", { to: otherUser, from: callerID, signal: event.candidate });
        }
      };

      if (initiator) {
        peer.onnegotiationneeded = async () => {
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("signal", { to: otherUser, from: callerID, signal: peer.localDescription });
          } catch (error) {
            console.error("Error creating offer:", error);
          }
        };
      }
      return peer;
    };

    const handleUserJoined = (id) => {
      if (localStream && mounted) {
        const peer = createPeer(id, socket.id, localStream, true);
        peersRef.current[id] = peer;
      }
    };

    const handleSignal = async ({ from, signal }) => {
      if (!localStream || !mounted) return;

      let peer = peersRef.current[from];
      if (!peer) {
        const newPeer = createPeer(from, socket.id, localStream, false);
        peersRef.current[from] = newPeer;
        peer = newPeer;
      }

      try {
        if (signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("signal", { to: from, from: socket.id, signal: peer.localDescription });
        } else if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (error) {
        console.error("Error handling signal:", error);
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = stream;
        
        // Check if ref is still mounted before accessing
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        startRecording(stream);
        
        // Start captions with reference tracking
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.lang = "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (e) => {
            if (mounted) {
              const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
              setCaptions([text]);
            }
          };
          try {
            recognition.start();
          } catch (error) {
            console.error("Error starting speech recognition:", error);
          }
        }

        socket.emit("join-room", roomId, userName);
        socket.on("user-joined", handleUserJoined);
        socket.on("signal", handleSignal);
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    // Proper cleanup function
    return () => {
      mounted = false;

      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error("Error stopping recording:", error);
        }
      }
      
      // Stop speech recognition
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
      
      // Stop all tracks in local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error("Error stopping track:", error);
          }
        });
      }
      
      // Close all peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (peer && typeof peer.close === 'function') {
          try {
            peer.close();
          } catch (error) {
            console.error("Error closing peer:", error);
          }
        }
      });
      peersRef.current = {};
      
      // Remove socket listeners
      socket.off("user-joined", handleUserJoined);
      socket.off("signal", handleSignal);
    };
  }, [roomId, userName]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Meeting ID: {roomId}</h2>
      <video ref={localVideoRef} autoPlay playsInline muted width="300" />
      <div>
        {remoteStreams.map((stream, idx) => (
          <video
            key={idx}
            ref={(el) => {
              if (el) {
                remoteVideosRef.current[stream.id] = el;
                el.srcObject = stream;
              }
            }}
            autoPlay
            playsInline
            width="300"
          />
        ))}
      </div>
      <div style={{ background: "black", color: "white", marginTop: "10px", padding: "10px" }}>
        <strong>Captions:</strong> {captions.join(" ")}
      </div>
    </div>
  );
}

export default VideoRoom;
