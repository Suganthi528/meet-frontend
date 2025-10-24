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

  // Captions
  const startCaptions = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setCaptions([text]);
    };
    recognition.start();
  };

  // Recording
  const startRecording = async (stream) => {
    const mediaRecorder = new MediaRecorder(stream);
    recordedChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const file = new File([blob], `${roomId}-${Date.now()}.webm`);
      const formData = new FormData();
      formData.append("file", file);
      await fetch("http://localhost:5000/upload-recording", { method: "POST", body: formData });
    };
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  // WebRTC
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;
      startRecording(stream);
      startCaptions();

      socket.emit("join-room", roomId, userName);

      socket.on("user-joined", (id) => {
        const peer = createPeer(id, socket.id, stream, true);
        peersRef.current[id] = peer;
      });

      socket.on("signal", async ({ from, signal }) => {
        let peer = peersRef.current[from];
        if (!peer) {
          const newPeer = createPeer(from, socket.id, stream, false);
          peersRef.current[from] = newPeer;
          peer = newPeer;
        }

        if (signal.type === "offer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("signal", { to: from, from: socket.id, signal: peer.localDescription });
        } else if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      });
    });

    return () => stopRecording();
  }, []);

  const createPeer = (otherUser, callerID, stream, initiator = true) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      setRemoteStreams(prev => {
        if (!prev.find(s => s.id === event.streams[0].id)) return [...prev, event.streams[0]];
        return prev;
      });
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) socket.emit("signal", { to: otherUser, from: callerID, signal: event.candidate });
    };

    if (initiator) {
      peer.onnegotiationneeded = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("signal", { to: otherUser, from: callerID, signal: peer.localDescription });
      };
    }
    return peer;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Meeting ID: {roomId}</h2>
      <video ref={localVideoRef} autoPlay playsInline muted width="300" />
      <div>
        {remoteStreams.map((stream, idx) => (
          <video
            key={idx}
            ref={(el) => (remoteVideosRef.current[stream.id] = el)}
            autoPlay
            playsInline
            width="300"
            onLoadedMetadata={() => remoteVideosRef.current[stream.id].srcObject = stream}
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
