// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Metro does not resolve three.js's package.json "exports" the same way Node does.
// Point the bare specifier at the prebuilt ESM bundle (path must not use `exports`; Node 20+ enforces them).
const threeBundle = path.join(__dirname, 'node_modules', 'three', 'build', 'three.module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { filePath: threeBundle, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
