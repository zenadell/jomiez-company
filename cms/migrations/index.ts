import * as migration_20260929_204052_initial from './20260929_204052_initial';
import * as migration_20260929_222020_page_placement from './20260929_222020_page_placement';
import * as migration_20260930_093734_agent from './20260930_093734_agent';
import * as migration_20261005_080151_voice from './20261005_080151_voice';
import * as migration_20261005_115100_sight from './20261005_115100_sight';
import * as migration_20261005_135316_cloudinary_fields from './20261005_135316_cloudinary_fields';
import * as migration_20261005_165403_agent_providers from './20261005_165403_agent_providers';
import * as migration_20261006_002151_outreach from './20261006_002151_outreach';
import * as migration_20261006_113115_gmail_script from './20261006_113115_gmail_script';
import * as migration_20261006_185708_access_keys from './20261006_185708_access_keys';

export const migrations = [
  {
    up: migration_20260929_204052_initial.up,
    down: migration_20260929_204052_initial.down,
    name: '20260929_204052_initial',
  },
  {
    up: migration_20260929_222020_page_placement.up,
    down: migration_20260929_222020_page_placement.down,
    name: '20260929_222020_page_placement',
  },
  {
    up: migration_20260930_093734_agent.up,
    down: migration_20260930_093734_agent.down,
    name: '20260930_093734_agent',
  },
  {
    up: migration_20261005_080151_voice.up,
    down: migration_20261005_080151_voice.down,
    name: '20261005_080151_voice',
  },
  {
    up: migration_20261005_115100_sight.up,
    down: migration_20261005_115100_sight.down,
    name: '20261005_115100_sight',
  },
  {
    up: migration_20261005_135316_cloudinary_fields.up,
    down: migration_20261005_135316_cloudinary_fields.down,
    name: '20261005_135316_cloudinary_fields',
  },
  {
    up: migration_20261005_165403_agent_providers.up,
    down: migration_20261005_165403_agent_providers.down,
    name: '20261005_165403_agent_providers',
  },
  {
    up: migration_20261006_002151_outreach.up,
    down: migration_20261006_002151_outreach.down,
    name: '20261006_002151_outreach',
  },
  {
    up: migration_20261006_113115_gmail_script.up,
    down: migration_20261006_113115_gmail_script.down,
    name: '20261006_113115_gmail_script',
  },
  {
    up: migration_20261006_185708_access_keys.up,
    down: migration_20261006_185708_access_keys.down,
    name: '20261006_185708_access_keys'
  },
];
