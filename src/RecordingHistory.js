import React, { useEffect, useState } from "react";

export default function RecordingHistory() {
  const [recordings, setRecordings] = useState([]);

  const fetchRecordings = async () => {
    const res = await fetch("http://localhost:5000/recordings");
    const data = await res.json();
    setRecordings(data);
  };

  useEffect(() => fetchRecordings(), []);

  return (
    <div>
      <h3>🎞️ Recording History</h3>
      <button onClick={fetchRecordings}>Refresh</button>
      <ul>
        {recordings.map(r => (
          <li key={r.fileName}>
            <a href={`http://localhost:5000${r.path}`} target="_blank" rel="noopener noreferrer">
              {r.fileName} ({new Date(r.uploadedAt).toLocaleString()})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
