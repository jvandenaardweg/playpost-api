import { ConnectionOptions } from 'typeorm';

import { User } from './entities/user';
import { Article } from './entities/article';
import { PlaylistItem } from './entities/playlist-item';
import { Audiofile } from './entities/audiofile';
import { Voice } from './entities/voice';
import { Language } from './entities/language';
import { UserVoiceSetting } from './entities/user-voice-setting';
import { UserSubscription } from './entities/user-subscription';
import { Subscription } from './entities/subscription';

export const connectionOptions = (name = 'default'): ConnectionOptions => {
  return {
    name,
    type: 'postgres',
    url: process.env.DATABASE_URL,
    extra: {
      ssl: (process.env.NODE_ENV === 'production') ? true : false // For Heroku
    },
    cache: {
      type: 'ioredis',
      options: process.env.REDIS_URL
    },
    logging: (process.env.NODE_ENV === 'production') ? ['error'] : ['error'], // Complete logging in dev, only errors in production
    synchronize: (process.env.NODE_ENV === 'production') ? false : true, // Sync changes directly when in dev
    entities: [
      User,
      PlaylistItem,
      Article,
      Audiofile,
      Voice,
      Language,
      UserVoiceSetting,
      UserSubscription,
      Subscription
    ],
    migrationsRun: true, // Run migrations on start. So when we deploy to production, migrations run automatically.
    dropSchema: false,
    maxQueryExecutionTime: 1000
  };
};
