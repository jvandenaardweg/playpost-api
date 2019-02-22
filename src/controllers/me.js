const { prisma } = require('../../generated/prisma-client');

const MESSAGE_ME_NOT_FOUND = 'Your account is not found. This could happen when your account is deleted.';
const MESSAGE_ME_NOT_UPDATED = 'Your account is not updated.';
const MESSAGE_ME_EMAIL_REQUIRED = 'E-mail address is required.';

const getMe = async (req, res) => {
  // TODO: get auth user id
  const exampleUserId = 'cjse81h67005t0754uiuiwb12';

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

  const user = await prisma.user({ id: exampleUserId }).$fragment(fragment);

  if (!user) return res.status(404).json({ message: MESSAGE_ME_NOT_FOUND });

  return res.json({ ...user });
};

const putMe = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: MESSAGE_ME_EMAIL_REQUIRED });

  // TODO: get auth user id
  const exampleUserId = 'cjse81h67005t0754uiuiwb12';

  const fragment = `
  fragment PutUserWithoutPassword on User {
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
        id: exampleUserId,
      },
    })
    .$fragment(fragment);

  if (!updatedUser) return res.json({ message: MESSAGE_ME_NOT_UPDATED });

  return res.json({ ...updatedUser });
};

const deleteMe = async (req, res) => {
  // TODO: get auth user id
  return res.json({ message: 'delete myself' });
};

module.exports = {
  getMe,
  putMe,
  deleteMe
};
