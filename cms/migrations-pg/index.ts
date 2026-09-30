import * as migration_20260930_094958_initial from './20260930_094958_initial';

export const migrations = [
  {
    up: migration_20260930_094958_initial.up,
    down: migration_20260930_094958_initial.down,
    name: '20260930_094958_initial'
  },
];
