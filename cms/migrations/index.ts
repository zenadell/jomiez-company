import * as migration_20260929_204052_initial from './20260929_204052_initial';
import * as migration_20260929_222020_page_placement from './20260929_222020_page_placement';

export const migrations = [
  {
    up: migration_20260929_204052_initial.up,
    down: migration_20260929_204052_initial.down,
    name: '20260929_204052_initial',
  },
  {
    up: migration_20260929_222020_page_placement.up,
    down: migration_20260929_222020_page_placement.down,
    name: '20260929_222020_page_placement'
  },
];
