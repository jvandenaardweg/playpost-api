import { ConnectionOptions } from 'typeorm';

import ormConfig from '../ormconfig';

export const connectionOptions = (name = 'default'): ConnectionOptions => ormConfig;
