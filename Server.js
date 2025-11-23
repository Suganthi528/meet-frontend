const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const recordingsDir = path.join(__dirname, "recordings");
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir);

let meetingHistory = [];
let recordingHistory = [];

// Upload recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload-recording", upload.single("file"), (req, res) => {
  recordingHistory.push({
    fileName: req.file.filename,
    path: `/recordings/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
  });
  res.json({ message: "Recording uploaded", file: req.file.filename });
});

app.get("/recordings", (req, res) => res.json(recordingHistory));
app.get("/meetings", (req, res) => res.json(meetingHistory));
app.use("/recordings", express.static(recordingsDir));

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userName) => {
    socket.join(roomId);
    meetingHistory.push({ roomId, user: userName, joinedAt: new Date().toISOString() });
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: data.from, signal: data.signal });
  });

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

server.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
