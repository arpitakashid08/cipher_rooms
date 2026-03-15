import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import connectDB from './database';
import authRoutes from './routes/auth';
import roomRoutes from './routes/roomRoutes';
import messageRoutes from './routes/messageRoutes';
import aiRoutes from './routes/aiRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
import Message from './models/Message';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// Database Connection
connectDB();

// Socket.io Implementation
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data: { roomId: string; senderId: string; text: string; senderName: string }) => {
    try {
      // Create message in DB
      const message = new Message({
        roomId: data.roomId,
        senderId: data.senderId,
        text: data.text
      });
      await message.save();

      // Broadcast to room
      io.to(data.roomId).emit('receive_message', {
        ...message.toObject(),
        senderId: { _id: data.senderId, name: data.senderName }
      });
    } catch (error) {
      console.error('Socket Send Message Error:', error);
    }
  });

  socket.on('typing', (data: { roomId: string, userName: string }) => {
    socket.to(data.roomId).emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
