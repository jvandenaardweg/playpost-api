import { ConnectionOptions } from 'typeorm';

import { Article } from './database/entities/article';
import { Audiofile } from './database/entities/audiofile';
import { Country } from './database/entities/country';
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
import { MicrosoftVoices1565167596757 } from './database/migrations/1565167596757-MicrosoftVoices';
import { VoicesLabelUniqueness1565168191744 } from './database/migrations/1565168191744-VoicesLabelUniqueness';
import { Country1565878550451 } from './database/migrations/1565878550451-Country';
import { LanguageCountries1565882851553 } from './database/migrations/1565882851553-LanguageCountries';
import { VoiceCountry1565887701525 } from './database/migrations/1565887701525-VoiceCountry';


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
  logging: ['error', 'warn'],
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
    InAppSubscription,
    Country
  ],
  migrations: [
    // In order of execution is important, oldest first
    ArticleCompatible1564467937421,
    VoiceQuality1564674653133,
    MicrosoftVoices1565167596757,
    VoicesLabelUniqueness1565168191744,
    Country1565878550451,
    LanguageCountries1565882851553,
    VoiceCountry1565887701525
  ],
  migrationsRun: true, // Run migrations on start.
  dropSchema: false,
  maxQueryExecutionTime: 1000,
};

export default config;
