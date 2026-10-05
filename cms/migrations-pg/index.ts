import * as migration_20260930_094958_initial from './20260930_094958_initial';
import * as migration_20261005_080208_voice from './20261005_080208_voice';
import * as migration_20261005_115109_sight from './20261005_115109_sight';

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
    name: '20261005_115109_sight'
  },
];
