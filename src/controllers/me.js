const bcrypt = require('bcryptjs');
const { prisma } = require('../../generated/prisma-client');

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is (already) deleted.';
const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';
const MESSAGE_ME_PASSWORD_REQUIRED = 'Password is required.';
const MESSAGE_ME_NOT_DELETED = 'Your account is not deleted. Probably because it is already deleted.';
const MESSAGE_ME_DELETED = 'Your account is deleted. This cannot be undone.';

const getMe = async (req, res) => {
  const { id } = req.user;

  const fragment = `
    fragment GetUserWithoutPassword on User {
      id
      email
      createdAt
      updatedAt
      activatedAt
      authenticatedAt
    }
  `;

  const user = await prisma.user({ id }).$fragment(fragment);

  if (!user) return res.status(404).json({ message: MESSAGE_ME_NOT_FOUND });

  return res.json({ ...user });
};

const patchMeEmail = async (req, res) => {
  const { email } = req.body;
  const { id } = req.user;

  if (!email) return res.status(400).json({ message: MESSAGE_ME_EMAIL_REQUIRED });

  const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;

  const updatedUser = await prisma
    .updateUser({
      data: {
        email,
      },
      where: {
        id
      },
    })
    .$fragment(fragment);

  if (!updatedUser) return res.json({ message: MESSAGE_ME_NOT_UPDATED });

  return res.json({ ...updatedUser });
};

const patchMePassword = async (req, res) => {
  const { password } = req.body;
  const { id } = req.user;

  if (!password) return res.status(400).json({ message: MESSAGE_ME_PASSWORD_REQUIRED });

  const fragment = `
    fragment PatchUserWithoutPassword on User {
      id
      email
      updatedAt
    }
  `;

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await prisma
    .updateUser({
      data: {
        password: hashedPassword,
      },
      where: {
        id
      },
    })
    .$fragment(fragment);

  if (!updatedUser) return res.json({ message: MESSAGE_ME_NOT_UPDATED });

  return res.json({ ...updatedUser });
};

const deleteMe = async (req, res) => {
  const { id } = req.user;

  const deletedUser = await prisma.deleteUser({ id });

  if (!deletedUser) return res.status(403).json({ message: MESSAGE_ME_NOT_DELETED });

  return res.json({ message: MESSAGE_ME_DELETED });
};

module.exports = {
  getMe,
  patchMeEmail,
  patchMePassword,
  deleteMe
};
