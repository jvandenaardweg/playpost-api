import { createConnection } from 'typeorm';

import { connectionOptions } from './database/connection-options';
import { addAllGoogleVoices } from './synthesizers/google';
import { addAllAWSVoices } from './synthesizers/aws';

createConnection(connectionOptions('default')).then(async () => {
  try {
    await addAllGoogleVoices();
    await addAllAWSVoices();
  } finally {
    console.log('We are done checking for new voices. We close.');
    process.exit();
  }
});
