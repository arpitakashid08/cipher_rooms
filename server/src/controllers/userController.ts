import { Request, Response } from 'express';
import User from '../models/User';

export const getUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await User.find().select('name email role');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
};
