import { ConnectionOptions } from 'typeorm';

import { User } from './entities/user';
import { Article } from './entities/article';
import { Playlist } from './entities/playlist';
import { PlaylistItem } from './entities/playlist-item';
import { Audiofile } from './entities/audiofile';

export const connectionOptions = (name = 'default'): ConnectionOptions => {
  return {
    name,
    type: 'postgres',
    url: process.env.DATABASE_URL,
    extra: {
      ssl: (process.env.NODE_ENV === 'production') ? true : false // For Heroku
    },
    logging: (process.env.NODE_ENV === 'production') ? ['error'] : true, // Complete logging in dev, only errors in production
    synchronize: (process.env.NODE_ENV === 'production') ? false : true, // Sync changes directly when in dev
    entities: [
      User,
      Playlist,
      PlaylistItem,
      Article,
      Audiofile
    ],
    migrationsRun: true, // Run migrations on start. So when we deploy to production, migrations run automatically.
    dropSchema: false,
    maxQueryExecutionTime: 1000
  };
};
