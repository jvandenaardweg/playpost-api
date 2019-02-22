// const { prisma } = require('../../generated/prisma-client');

// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

const getFavorites = async (req, res) => {
  // TODO: get auth user id
  return res.json({ message: 'get the favorites from user ID: X' });
};

const postFavorites = async (req, res) => {
  // TODO: get auth user id
  const { id } = req.body;

  return res.json({ message: `add article ${id} to favorites for user ID: X` });
};

const deleteFavorites = async (req, res) => {
  // TODO: get auth user id
  return res.json({ message: 'delete article from favorites for user ID: X' });
};

module.exports = {
  getFavorites,
  postFavorites,
  deleteFavorites
};
