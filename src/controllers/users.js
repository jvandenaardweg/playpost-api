const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../generated/prisma-client');

const { JWT_SECRET } = process.env;

const MESSAGE_USER_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_USER_PASSWORD_INVALID = 'Password or e-mail address is incorrect.';
const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';

const postUsers = async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: MESSAGE_USER_EMAIL_PASSWORD_REQUIRED });
  }

  const user = await prisma.user({ email });

  if (user) return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await prisma.createUser({
    email,
    password: hashedPassword
  });

  // Send a token within a successful signup, so we can log the user in right away
  const token = jwt.sign({ id: createdUser.id, email: createdUser.email }, JWT_SECRET);

  return res.json({ token });
};

const deleteUsers = async (req, res) => {
  // TODO: get auth user id
  const { email, password } = req.body;

  const user = await prisma.user({ email });

  if (!user) return res.status(404).json({ message: MESSAGE_USER_NOT_FOUND });

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) return res.status(400).json({ message: MESSAGE_USER_PASSWORD_INVALID });

  await prisma.deleteUser({ email });

  return res.json({ message: MESSAGE_USER_DELETED });
};

module.exports = {
  postUsers,
  deleteUsers
};
