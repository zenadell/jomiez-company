import * as migration_20260929_204052_initial from './20260929_204052_initial';

export const migrations = [
  {
    up: migration_20260929_204052_initial.up,
    down: migration_20260929_204052_initial.down,
    name: '20260929_204052_initial'
  },
];
