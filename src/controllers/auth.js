const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../generated/prisma-client');

const { JWT_SECRET } = process.env;

const MESSAGE_AUTH_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_AUTH_USER_NOT_FOUND = 'No user found or password is incorrect.';
const MESSAGE_AUTH_PASSWORD_INCORRECT = 'Password is incorrect.';

const postAuth = async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: MESSAGE_AUTH_EMAIL_PASSWORD_REQUIRED });
  }

  const user = await prisma.user({ email });

  if (!user) return res.status(403).json({ message: MESSAGE_AUTH_USER_NOT_FOUND });

  const isValidPassword = await bcrypt.compare(password, user.password);

  // TODO: Log tries for security
  if (!isValidPassword) return res.status(403).json({ message: MESSAGE_AUTH_PASSWORD_INCORRECT });

  // We use the e-mail in the token as an extra way to get some easy context during debugging
  // For example, we can use the email in Sentry to maybe contact the user
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

  return res.json({ token });
};

module.exports = {
  postAuth
};
