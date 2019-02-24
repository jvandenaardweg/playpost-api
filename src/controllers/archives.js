
// const { prisma } = require('../../generated/prisma-client');

// const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
// const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
// const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

const getArchives = async (req, res) => {
  // TODO: get auth user id
  return res.json({ message: 'get the archive from user ID: X' });
};

const postArchives = async (req, res) => {
  // TODO: get auth user id
  const { id } = req.body;

  return res.json({ message: `add article ${id} to archive for user ID: X` });
};

const deleteArchives = async (req, res) => {
  // TODO: get auth user id
  return res.json({ message: 'delete article from archive for user ID: X' });
};

module.exports = {
  getArchives,
  postArchives,
  deleteArchives
};
