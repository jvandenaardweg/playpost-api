require('dotenv').config();
import { createConnection, getConnection, Connection } from 'typeorm';
import { connectionOptions } from './connection-options';

import { articles } from './seeds/article';
import { users } from './seeds/user';
import { playlists } from './seeds/playlist';

/**
 * Seeds the database with example users used for development.
 */
const seedUsers = async (databaseConnection: Connection) => {
  const promises = users.map((user: any) => {
    return databaseConnection.createQueryBuilder().insert().into('user').values(user).execute();
  });
  return Promise.all(promises);
};

/**
 * Seeds the database with example articles used for development.
 */
const seedArticles = async (databaseConnection: Connection) => {
  const promises = articles.map((article: any) => {
    return databaseConnection.createQueryBuilder().insert().into('article').values(article).execute();
  });
  return Promise.all(promises);
};

/**
 * Seeds the database with example playlists used for development.
 */
const seedPlaylists = async (databaseConnection: Connection) => {
  const promises = playlists.map((playlist: any) => {
    return databaseConnection.createQueryBuilder().insert().into('playlist').values(playlist).execute();
  });
  return Promise.all(promises);
};

(async() => {
  const databaseConnection: Connection = await createConnection(connectionOptions);

  // Run the seeders
  await seedUsers(databaseConnection);

  // await seedArticles(databaseConnection);
  // await seedPlaylists(databaseConnection);
})();
