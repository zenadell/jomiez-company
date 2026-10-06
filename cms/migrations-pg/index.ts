import * as migration_20260930_094958_initial from './20260930_094958_initial';
import * as migration_20261005_080208_voice from './20261005_080208_voice';
import * as migration_20261005_115109_sight from './20261005_115109_sight';
import * as migration_20261005_135321_cloudinary_fields from './20261005_135321_cloudinary_fields';
import * as migration_20261005_165409_agent_providers from './20261005_165409_agent_providers';
import * as migration_20261006_002154_outreach from './20261006_002154_outreach';
import * as migration_20261006_113120_gmail_script from './20261006_113120_gmail_script';

export const migrations = [
  {
    up: migration_20260930_094958_initial.up,
    down: migration_20260930_094958_initial.down,
    name: '20260930_094958_initial',
  },
  {
    up: migration_20261005_080208_voice.up,
    down: migration_20261005_080208_voice.down,
    name: '20261005_080208_voice',
  },
  {
    up: migration_20261005_115109_sight.up,
    down: migration_20261005_115109_sight.down,
    name: '20261005_115109_sight',
  },
  {
    up: migration_20261005_135321_cloudinary_fields.up,
    down: migration_20261005_135321_cloudinary_fields.down,
    name: '20261005_135321_cloudinary_fields',
  },
  {
    up: migration_20261005_165409_agent_providers.up,
    down: migration_20261005_165409_agent_providers.down,
    name: '20261005_165409_agent_providers',
  },
  {
    up: migration_20261006_002154_outreach.up,
    down: migration_20261006_002154_outreach.down,
    name: '20261006_002154_outreach',
  },
  {
    up: migration_20261006_113120_gmail_script.up,
    down: migration_20261006_113120_gmail_script.down,
    name: '20261006_113120_gmail_script'
  },
];
