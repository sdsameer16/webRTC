require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error', err));

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// Authenticate socket handshake using JWT in handshake.auth.token
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Missing token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id, socket.user && socket.user.username);
  // Admins join 'admin' room for global notifications
  if (socket.user.role === 'admin') socket.join('admin');

  // Utility: add user personal room
  socket.join('user:' + socket.user.id);

  // Caretaker starts broadcasting -> joins caretaker chat room
  socket.on('start-broadcast', async () => {
    if (socket.user.role !== 'caretaker') return;
    const caretakerId = socket.user.id;
    socket.join('caretaker:' + caretakerId);
    socket.join('chat:' + caretakerId);
    // notify admins
    io.to('admin').emit('broadcast-started', { caretakerId, username: socket.user.username });
    console.log(`Caretaker ${caretakerId} started broadcast`);
  });

  // Parent requests to watch a caretaker
  // payload: { caretakerId }
  socket.on('watch', async (payload) => {
    try {
      const { caretakerId } = payload;
      // authorization: parent must be assigned to this caretaker, or admin can watch any
      if (socket.user.role === 'parent') {
        const me = await User.findById(socket.user.id).lean();
        if (!me) { socket.emit('watch-error', { message: 'User not found' }); return; }
        if (!me.assignedCaretaker || String(me.assignedCaretaker) !== String(caretakerId)) {
          socket.emit('watch-error', { message: 'You are not assigned to that caretaker' });
          return;
        }
      }
      // find caretaker socket id
      let caretakerSocketId = null;
      for (const [id, s] of io.of('/').sockets) {
        if (s.user && String(s.user.id) === String(caretakerId)) { caretakerSocketId = id; break; }
      }
      if (!caretakerSocketId) {
        socket.emit('watch-error', { message: 'Caretaker not online' });
        return;
      }
      // join the chat room so chat messages are broadcast to all watchers + caretaker
      socket.join('chat:' + caretakerId);
      // notify caretaker that a viewer joined (caretaker should create a PeerConnection and send offer)
      io.to(caretakerSocketId).emit('viewer-join', { viewerId: socket.id, viewerUser: socket.user });
      socket.emit('watch-ok', { message: 'Request sent to caretaker' });
      console.log('Viewer', socket.user.username, 'requested watch caretaker', caretakerId);
    } catch (err) {
      console.error(err);
      socket.emit('watch-error', { message: 'Server error' });
    }
  });

  // Signaling pass-through
  // caretaker -> emits offer to target viewer
  // payload { target, sdp }
  socket.on('offer', ({ target, sdp }) => {
    if (!target || !sdp) return;
    io.to(target).emit('offer', { sdp, from: socket.id });
  });

  // parent -> emits answer to caretaker
  socket.on('answer', ({ target, sdp }) => {
    if (!target || !sdp) return;
    io.to(target).emit('answer', { sdp, from: socket.id });
  });

  // either side sends ICE candidate -> forwarded
  socket.on('ice-candidate', ({ target, candidate }) => {
    if (!target || !candidate) return;
    io.to(target).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Chat: { caretakerId, childId, childName, message }
  socket.on('chat-message', (payload) => {
    const { caretakerId, childId, childName, message } = payload;
    if (!caretakerId || !message) return;
    const out = {
      from: {
        id: socket.user.id,
        username: socket.user.username,
        role: socket.user.role
      },
      childId,
      childName,
      message,
      time: new Date().toISOString()
    };
    // broadcast to chat room
    io.to('chat:' + caretakerId).emit('chat-message', out);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
