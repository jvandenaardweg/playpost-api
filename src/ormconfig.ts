import { ConnectionOptions } from 'typeorm';

import { ApiKey } from './database/entities/api-key';
import { Article } from './database/entities/article';
import { Audiofile } from './database/entities/audiofile';
import { Country } from './database/entities/country';
import { InAppSubscription } from './database/entities/in-app-subscription';
import { Language } from './database/entities/language';
import { PlaylistItem } from './database/entities/playlist-item';
import { User } from './database/entities/user';
import { UserInAppSubscriptionApple } from './database/entities/user-in-app-subscription-apple';
import { UserVoiceSetting } from './database/entities/user-voice-setting';
import { Voice } from './database/entities/voice';

// Migrations
import { Publisher } from './database/entities/publisher';
import { UserInAppSubscriptionGoogle } from './database/entities/user-in-app-subscriptions-google';
import { ArticleCompatible1564467937421 } from './database/migrations/1564467937421-ArticleCompatible';
import { VoiceQuality1564674653133 } from './database/migrations/1564674653133-VoiceQuality';
import { MicrosoftVoices1565167596757 } from './database/migrations/1565167596757-MicrosoftVoices';
import { VoicesLabelUniqueness1565168191744 } from './database/migrations/1565168191744-VoicesLabelUniqueness';
import { Country1565878550451 } from './database/migrations/1565878550451-Country';
import { LanguageCountries1565882851553 } from './database/migrations/1565882851553-LanguageCountries';
import { VoiceCountry1565887701525 } from './database/migrations/1565887701525-VoiceCountry';
import { ApiKeys1567094182609 } from './database/migrations/1567094182609-ApiKeys';
import { Indexes1567101511834 } from './database/migrations/1567101511834-Indexes';
import { HadTrial1567145416715 } from './database/migrations/1567145416715-HadTrial';
import { UserInAppSubscriptionsGoogle1567410354988 } from './database/migrations/1567410354988-UserInAppSubscriptionsGoogle';
import { UserInAppSubscriptionGoogleNulls1567410626330 } from './database/migrations/1567410626330-UserInAppSubscriptionGoogleNulls';
import { UserInAppSubscriptionGoogleEnvironment1567410969557 } from './database/migrations/1567410969557-UserInAppSubscriptionGoogleEnvironment';
import { UserInAppSubscriptionsExpiresIndex1567537078927 } from './database/migrations/1567537078927-UserInAppSubscriptionsExpiresIndex';
import { UserInAppSubscriptionsStatusIndex1567537213827 } from './database/migrations/1567537213827-UserInAppSubscriptionsStatusIndex';
import { ApiKeyAllowedDomain1567661196464 } from './database/migrations/1567661196464-ApiKeyAllowedDomain';
import { VoicesSubscriptionLanguageDefault1568386709347 } from './database/migrations/1568386709347-VoicesSubscriptionLanguageDefault';
import { RemoveArticleText1568723124112 } from './database/migrations/1568723124112-RemoveArticleText';
import { RemoveUnusedVoiceProperties1568723707634 } from './database/migrations/1568723707634-RemoveUnusedVoiceProperties';
import { InAppSubscriptionsUpgradeFrom1568799387018 } from './database/migrations/1568799387018-InAppSubscriptionsUpgradeFrom';
import { Publisher1575731651969 } from './database/migrations/1575731651969-Publisher';
import { PublisherArticles1575734771138 } from './database/migrations/1575734771138-PublisherArticles';
import { PublisherChanges1576010672013 } from './database/migrations/1576010672013-PublisherChanges';
import { UserActivationToken1576045108205 } from './database/migrations/1576045108205-UserActivationToken';
import { UserResetPasswordToken1576133792281 } from './database/migrations/1576133792281-UserResetPasswordToken';

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
    UserInAppSubscriptionApple,
    InAppSubscription,
    Country,
    ApiKey,
    UserInAppSubscriptionGoogle,
    Publisher
  ],
  migrations: [
    // In order of execution is important, oldest first
    ArticleCompatible1564467937421,
    VoiceQuality1564674653133,
    MicrosoftVoices1565167596757,
    VoicesLabelUniqueness1565168191744,
    Country1565878550451,
    LanguageCountries1565882851553,
    VoiceCountry1565887701525,
    ApiKeys1567094182609,
    Indexes1567101511834,
    HadTrial1567145416715,
    UserInAppSubscriptionsGoogle1567410354988,
    UserInAppSubscriptionGoogleNulls1567410626330,
    UserInAppSubscriptionGoogleEnvironment1567410969557,
    UserInAppSubscriptionsExpiresIndex1567537078927,
    UserInAppSubscriptionsStatusIndex1567537213827,
    ApiKeyAllowedDomain1567661196464,
    VoicesSubscriptionLanguageDefault1568386709347,
    RemoveArticleText1568723124112,
    RemoveUnusedVoiceProperties1568723707634,
    InAppSubscriptionsUpgradeFrom1568799387018,
    Publisher1575731651969,
    PublisherArticles1575734771138,
    PublisherChanges1576010672013,
    UserActivationToken1576045108205,
    UserResetPasswordToken1576133792281
  ],
  migrationsRun: true, // Run migrations on start.
  dropSchema: false,
  maxQueryExecutionTime: 1000,
};

export default config;
