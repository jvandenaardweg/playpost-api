require('dotenv').config();
import { createConnection, Connection } from 'typeorm';
import { connectionOptions } from './connection-options';

import { articles } from './seeds/article';
import { users } from './seeds/user';

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

(async() => {
  const databaseConnection: Connection = await createConnection(connectionOptions());

  // Run the seeders
  await seedUsers(databaseConnection);

  // await seedArticles(databaseConnection);
  // await seedPlaylists(databaseConnection);
})();
