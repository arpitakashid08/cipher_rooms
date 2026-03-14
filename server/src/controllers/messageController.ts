import { Request, Response } from 'express';
import Message from '../models/Message';

export const getMessagesByRoom = async (req: Request, res: Response): Promise<any> => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });
      
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
};

export const createMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { roomId, text, fileUrl } = req.body;
    const senderId = (req as any).user.id;

    const message = new Message({
      roomId,
      senderId,
      text,
      fileUrl
    });

    await message.save();
    
    // In a real app we'll broadcast via Socket.io from here or directly in the socket handler
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating message' });
  }
};
