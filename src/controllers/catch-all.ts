import { Request, Response } from 'express';

export const catchAll = async (req: Request, res: Response) => {
  return res.status(404).json({ message: `No route found for ${req.method} ${req.url}` });
};
