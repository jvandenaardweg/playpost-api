import { ConnectionOptions } from 'typeorm';

import { Article } from './database/entities/article';
import { Audiofile } from './database/entities/audiofile';
import { InAppSubscription } from './database/entities/in-app-subscription';
import { Language } from './database/entities/language';
import { PlaylistItem } from './database/entities/playlist-item';
import { User } from './database/entities/user';
import { UserInAppSubscription } from './database/entities/user-in-app-subscription';
import { UserVoiceSetting } from './database/entities/user-voice-setting';
import { Voice } from './database/entities/voice';

// Migrations
import { ArticleCompatible1564467937421 } from './database/migrations/1564467937421-ArticleCompatible';
import { VoiceQuality1564674653133 } from './database/migrations/1564674653133-VoiceQuality';

const config: ConnectionOptions = {
  name: 'default',
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    ssl: process.env.NODE_ENV === 'production' ? true : false
  },
  cache: {
    type: 'ioredis',
    options: process.env.REDIS_URL
  },
  logging: true,
  synchronize: false, // Keep this on false, use migrations
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
    ArticleCompatible1564467937421,
    VoiceQuality1564674653133
  ],
  migrationsRun: true, // Run migrations on start.
  dropSchema: false,
  maxQueryExecutionTime: 1000,
};

export default config;
