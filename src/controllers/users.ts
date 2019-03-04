import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { User } from '../database/entities/user';
import { validateInput } from '../validators/entity';
import { hashPassword, routeIsProtected } from './auth';
import { Playlist } from '../database/entities/playlist';

const MESSAGE_USER_EMAIL_PASSWORD_REQUIRED = 'No e-mail and or password given.';
const MESSAGE_USER_EMAIL_EXISTS = 'E-mail address already exists.';
const MESSAGE_USER_NOT_FOUND = 'No user found';
const MESSAGE_USER_DELETED = 'User is deleted! This cannot be undone.';
const MESSAGE_USER_NOT_ALLOWED = 'You are not allowed to do this.';

export const createUser = [
  // routeIsProtected,
  // [
  //   check('email').isEmail(),
  //   check('password').exists()
  // ],
  async (req: Request, res: Response) => {

  // const errors: ValidationError[] = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(422).json({ errors: errors.array() });
  // }
  // TODO: validate email, password
    const { email, password } = req.body;
    const userRepository = getRepository(User);
    const playlistRepository = getRepository(Playlist);
    // const playlistRepository = getRepository(Playlist);

    if (!email && !password) {
      return res.status(400).json({ message: MESSAGE_USER_EMAIL_PASSWORD_REQUIRED });
    }

    const existingUser = await userRepository.findOne({ email });

    if (existingUser) return res.status(400).json({ message: MESSAGE_USER_EMAIL_EXISTS });

    const hashedPassword = await hashPassword(password);

    const userToCreate = { email, password: hashedPassword };

    // Validate the input
    const validationResult = await validateInput(User, userToCreate);
    if (validationResult.errors.length) return res.status(400).json(validationResult);

    // Use a transaction to create the user and the default playlist
    const createdUser = await getConnection().transaction(async (transactionalEntityManager) => {
      // Create the user
      const newUserToSave = await userRepository.create(userToCreate);
      const createdUser = await transactionalEntityManager.save(newUserToSave);

      // Create de default playlist
      const defaultPlaylistToCreate = await playlistRepository.create({
        name: 'Default',
        user: {
          id: createdUser.id
        }
      });

      await transactionalEntityManager.save(defaultPlaylistToCreate);

      return createdUser;

    });

    // Get the created user and return it
    const user = await userRepository.findOne(createdUser.id);

    return res.json(user);
  }
];

export const deleteUser = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const { userId } = req.params;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: MESSAGE_USER_NOT_ALLOWED });

    const validationResult = await validateInput(User, { id: userId });
    if (validationResult.errors.length) return res.status(400).json(validationResult);

    const userToDelete = await userRepository.findOne(userId);

    if (!userToDelete) return res.status(400).json({ message: MESSAGE_USER_NOT_FOUND });

    await userRepository.remove(userToDelete);

    return res.json({ message: MESSAGE_USER_DELETED });
  }
];

export const findAllUsers = [
  routeIsProtected,
  async (req: Request, res: Response) => {
    const userEmail = req.user.email;
    const userRepository = getRepository(User);

    if (userEmail !== 'jordyvandenaardweg@gmail.com') return res.status(403).json({ message: 'You dont have access to this endpoint.' });

    const users = await userRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });

    return res.json(users);
  }
];
