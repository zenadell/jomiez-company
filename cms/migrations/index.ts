import * as migration_20260929_204052_initial from './20260929_204052_initial';
import * as migration_20260929_222020_page_placement from './20260929_222020_page_placement';
import * as migration_20260930_093734_agent from './20260930_093734_agent';
import * as migration_20261005_080151_voice from './20261005_080151_voice';
import * as migration_20261005_115100_sight from './20261005_115100_sight';
import * as migration_20261005_135316_cloudinary_fields from './20261005_135316_cloudinary_fields';

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
    name: '20261005_135316_cloudinary_fields'
  },
];
