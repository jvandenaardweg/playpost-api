import { Request, Response } from 'express';

// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

export const findAllFavorites = async (req: Request, res: Response) => {
  return res.json({ message: 'get the favorites from user ID: X' });
};

export const createFavorite = async (req: Request, res: Response) => {
  const { id } = req.body;

  return res.json({ message: `add article ${id} to favorites for user ID: X` });
};

export const deleteFavorite = async (req: Request, res: Response) => {
  return res.json({ message: 'delete article from favorites for user ID: X' });
};
