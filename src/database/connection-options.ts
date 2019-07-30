import { ConnectionOptions } from 'typeorm';

import { Article } from './entities/article';
import { Audiofile } from './entities/audiofile';
import { InAppSubscription } from './entities/in-app-subscription';
import { Language } from './entities/language';
import { PlaylistItem } from './entities/playlist-item';
import { User } from './entities/user';
import { UserInAppSubscription } from './entities/user-in-app-subscription';
import { UserVoiceSetting } from './entities/user-voice-setting';
import { Voice } from './entities/voice';
import { ArticleCompatible1564467937421 } from './migrations/1564467937421-ArticleCompatible';

export const connectionOptions = (name = 'default'): ConnectionOptions => {
  return {
    name,
    type: 'postgres',
    url: process.env.DATABASE_URL,
    extra: {
      ssl: process.env.NODE_ENV === 'production' ? true : false
    },
    cache: {
      type: 'ioredis',
      options: process.env.REDIS_URL
    },
    logging: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : true, // Complete logging in dev, only errors in production
    synchronize: false,
    entities: [
      User,
      PlaylistItem,
      Article,
      Audiofile,
      Voice,
      Language,
      UserVoiceSetting,
      UserInAppSubscription,
      InAppSubscription
    ],
    migrations: [
      // In order of execution is important, oldest first
      ArticleCompatible1564467937421
    ],
    migrationsRun: true, // Run migrations on start.
    dropSchema: false,
    maxQueryExecutionTime: 1000
  };
};
