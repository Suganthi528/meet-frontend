import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import "./VideoRoom.css";

const socket = io("http://127.0.0.1"); // your backend

function VideoRoom() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [recordingHistory, setRecordingHistory] = useState([]);
  const [quality, setQuality] = useState("HD");

  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // ✅ Load meeting & recording history on page load
  useEffect(() => {
    const savedMeetings = JSON.parse(localStorage.getItem("meetingHistory")) || [];
    const savedRecordings = JSON.parse(localStorage.getItem("recordingHistory")) || [];
    setMeetingHistory(savedMeetings);
    setRecordingHistory(savedRecordings);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ✅ update meeting & recording history to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem("meetingHistory", JSON.stringify(meetingHistory));
  }, [meetingHistory]);

  useEffect(() => {
    localStorage.setItem("recordingHistory", JSON.stringify(recordingHistory));
  }, [recordingHistory]);

  const createPeer = (userToSignal, callerID, stream, initiator = true) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
      const incomingStream = event.streams[0];
      setRemoteStreams((prev) =>
        !prev.find((s) => s.id === incomingStream.id)
          ? [...prev, incomingStream]
          : prev
      );
    };

    peer.onicecandidate = (event) => {
      if (event.candidate)
        socket.emit("signal", { to: userToSignal, from: callerID, signal: event.candidate });
    };

    if (initiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("signal", { to: userToSignal, from: callerID, signal: peer.localDescription });
        } catch (error) {
          console.error("Negotiation error:", error);
        }
      };
    }

    return peer;
  };

  useEffect(() => {
    if (!joined) return;

    const handleAllUsers = (users) => {
      users.forEach((userId) => {
        if (!peersRef.current[userId]) {
          const peer = createPeer(userId, socket.id, localStream, true);
          peersRef.current[userId] = peer;
        }
      });
    };

    const handleUserJoined = (userId) => {
      if (!peersRef.current[userId]) {
        const peer = createPeer(userId, socket.id, localStream, true);
        peersRef.current[userId] = peer;
      }
    };

    const handleUserLeft = (userId) => {
      setRemoteStreams((prev) => prev.filter((s) => s.id !== userId));
      const peer = peersRef.current[userId];
      if (peer) {
        peer.close();
        delete peersRef.current[userId];
      }
    };

    const handleSignal = async ({ from, signal }) => {
      let peer = peersRef.current[from];
      if (!peer) {
        peer = createPeer(from, socket.id, localStream, false);
        peersRef.current[from] = peer;
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
        console.error("Signal error:", error);
      }
    };

    const handleParticipantList = (list) => {
      setParticipants(list);
    };

    socket.on("all-users", handleAllUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("signal", handleSignal);
    socket.on("participant-list", handleParticipantList);

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("signal");
      socket.off("participant-list");
    };
  }, [joined, localStream]);

  const startMedia = async () => {
    try {
      const constraints = {
        video: { width: quality === "HD" ? 1280 : 640, height: quality === "HD" ? 720 : 360 },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      startRecording(stream);
    } catch (error) {
      alert("Camera/Mic not accessible");
      console.error(error);
    }
  };

  const startRecording = (stream) => {
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoURL(url);
      const newRec = { url, roomId, userName, date: new Date().toLocaleString() };
      setRecordingHistory((prev) => [newRec, ...prev]);
    };
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive")
      mediaRecorderRef.current.stop();
  };

  const handleLeave = () => {
    stopRecording();
    const newMeeting = { roomId, userName, date: new Date().toLocaleString() };
    setMeetingHistory((prev) => [newMeeting, ...prev]);
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    Object.values(peersRef.current).forEach((p) => p.close());
    peersRef.current = {};
    setJoined(false);
    setRemoteStreams([]);
    socket.emit("leave-room", roomId);
  };

  // 🗑 Delete handlers
  const deleteMeeting = (index) => {
    const updated = meetingHistory.filter((_, i) => i !== index);
    setMeetingHistory(updated);
    localStorage.setItem("meetingHistory", JSON.stringify(updated));
  };

  const deleteRecording = (index) => {
    const updated = recordingHistory.filter((_, i) => i !== index);
    setRecordingHistory(updated);
    localStorage.setItem("recordingHistory", JSON.stringify(updated));
  };

  // ---------------- UI -----------------
  if (!joined) {
    return (
      <div className="join-container">
        <h1 className="title">🎥 Cartoon Meet</h1>
        <input
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="input-box"
        />
        <input
          placeholder="Enter Room ID (or create one)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="input-box"
        />
        <div className="button-group">
          <button
            className="btn create"
            onClick={async () => {
              const newRoom = uuidv4();
              setRoomId(newRoom);
              await startMedia();
              setJoined(true);
              socket.emit("join-room", newRoom, userName);
            }}
          >
            ➕ Create Room
          </button>
          <button
            className="btn join"
            onClick={async () => {
              if (!userName || !roomId) return alert("Enter name & Room ID");
              await startMedia();
              setJoined(true);
              socket.emit("join-room", roomId, userName);
            }}
          >
            🔗 Join Room
          </button>
        </div>

        <div className="history-section">
          {meetingHistory.length > 0 && (
            <div className="history-box">
              <h3>📜 Meeting History</h3>
              <ul>
                {meetingHistory.map((m, i) => (
                  <li key={i}>
                    {m.roomId} - {m.userName} ({m.date}){" "}
                    <button onClick={() => deleteMeeting(i)}>🗑</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recordingHistory.length > 0 && (
            <div className="history-box">
              <h3>🎬 Recording History</h3>
              <ul>
                {recordingHistory.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      Video
                    </a>{" "}
                    ({r.date}){" "}
                    <button onClick={() => deleteRecording(i)}>🗑</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-container">
      <h2>Meeting ID: {roomId}</h2>
      <div className="video-grid">
        <video ref={localVideoRef} autoPlay muted playsInline width="300" />
        {remoteStreams.map((s, i) => (
          <video key={i} ref={(el) => el && (el.srcObject = s)} autoPlay playsInline width="300" />
        ))}
      </div>

      <div className="controls">
        <button onClick={handleLeave}>🚪 Leave</button>
      </div>

      <div className="side-panel">
        <div className="participant-list">
          <h3>👥 Participants</h3>
          <ul>
            {participants.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>

        <div className="history-box">
          <h3>📜 Meeting History</h3>
          <ul>
            {meetingHistory.map((m, i) => (
              <li key={i}>
                {m.roomId} - {m.userName} ({m.date}){" "}
                <button onClick={() => deleteMeeting(i)}>🗑</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="history-box">
          <h3>🎬 Recording History</h3>
          <ul>
            {recordingHistory.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  Video
                </a>{" "}
                ({r.date}){" "}
                <button onClick={() => deleteRecording(i)}>🗑</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VideoRoom;
