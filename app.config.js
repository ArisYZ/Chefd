const fs = require('fs');
const path = require('path');

/**
 * Loads ASI:One API key from a gitignored file (see `secrets/asi-one.key`).
 * Falls back to EXPO_PUBLIC_ASI_ONE_API_KEY when the file is missing (e.g. CI).
 */
module.exports = () => {
  const appJson = require('./app.json');
  let asiOneApiKey = '';
  try {
    asiOneApiKey = fs
      .readFileSync(path.join(__dirname, 'secrets', 'asi-one.key'), 'utf8')
      .trim();
  } catch {
    asiOneApiKey = process.env.EXPO_PUBLIC_ASI_ONE_API_KEY || '';
  }
  return {
    expo: {
      ...appJson.expo,
      extra: {
        ...(appJson.expo.extra || {}),
        asiOneApiKey,
      },
    },
  };
};
