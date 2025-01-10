const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const chokidar = require('chokidar');
const path = require('path');

const config = {
  watchFolders: [path.resolve(__dirname)],
  maxWorkers: 1,
  watch: (dir) => chokidar.watch(dir, { usePolling: true }),
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
