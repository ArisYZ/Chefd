import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Removes every AsyncStorage key used by Chefd (prefix `@chefd`).
 * Clears recipe JSON overrides, per-user recipes/reviews, bookmarks, follows, likes, session, etc.
 */
export async function clearChefdAsyncStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const chefd = keys.filter((k) => k.startsWith('@chefd'));
  if (chefd.length > 0) {
    await AsyncStorage.multiRemove(chefd);
  }
}
