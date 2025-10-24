import React, { useState } from "react";
import VideoRoom from "./VideoRoom";
import RecordingHistory from "./RecordingHistory";

function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      {!joined ? (
        <>
          <h2>🌐 Google Meet Clone (React + WebRTC)</h2>
          <input placeholder="Enter Your Name" value={userName} onChange={e => setUserName(e.target.value)} />
          <input placeholder="Enter Meeting ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
          <button onClick={() => setJoined(true)}>Join Meeting</button>
        </>
      ) : (
        <>
          <VideoRoom roomId={roomId} userName={userName} />
          <RecordingHistory />
        </>
      )}
    </div>
  );
}

export default App;
