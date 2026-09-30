import * as migration_20260929_204052_initial from './20260929_204052_initial';
import * as migration_20260929_222020_page_placement from './20260929_222020_page_placement';
import * as migration_20260930_093734_agent from './20260930_093734_agent';

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
    name: '20260930_093734_agent'
  },
];
