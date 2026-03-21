# Chef'd

A social recipe ranking app — like Beli, but for recipes instead of restaurants.

## Features

- **Feed** — See what recipes your friends are rating, with scores, notes, and favorite parts
- **Your Lists** — Organize recipes into personal collections (Favorites, Date Night, Want to Try)
- **Discover** — Search and filter recipes by cuisine, category, or ingredients
- **Leaderboard** — **Recipes** tab: top-rated dishes by cuisine. **Cooks** tab: community ranking from SQLite (score from reviews + recipes you add)
- **Profile** — Your SQLite-backed stats (rank, recipes, reviews, avg score, followers/following) and **Log out**
- **Auth** — First launch shows **Sign in** / **Sign up** (email + password, stored hashed locally) or **Continue with Google** (optional OAuth)
- **Recipe Details** — Full recipe view with ingredients, instructions, and friend ratings

## Tech Stack

- React Native 0.81 with Expo SDK 54
- TypeScript
- Expo Router v5 (file-based navigation)
- React 19
- @expo/vector-icons (Ionicons)
- **expo-sqlite** — local `users` table (username, ranking score, leaderboard rank, followers/following counts, recipe/review counts, average review score, Google link, etc.). Session user id is also stored in AsyncStorage so you stay logged in across restarts.
- **expo-auth-session** — Google Sign-In (configure client IDs below)

### Accounts & data

- Passwords are hashed with **expo-crypto** (SHA-256 + salt); they never leave the device in plain text.
- **Your recipes** are still stored per-user in AsyncStorage (`@chefd_user_recipes_<userId>`).
- Writing a **review** or adding a **recipe** updates your SQLite profile (ranking score, counts, rolling average “make again” score).

### Google Sign-In setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an OAuth **Web client ID** (and optional iOS / Android client IDs for native builds).
2. Add them to `app.json` under `expo.extra`:

```json
"extra": {
  "googleWebClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  "googleIosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
  "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com"
}
```

Or set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in a `.env` file (Expo loads it for the client). Restart Metro after changing.

Without client IDs, the auth screen explains that Google isn’t configured yet; **email sign-up / sign-in still works**.

**Full walkthrough:** see **`docs/GOOGLE_SIGNIN.md`**. Quick version: create a **Web** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add the redirect URI Expo expects (see Expo’s [Google authentication](https://docs.expo.dev/guides/google-authentication/) guide), then paste the client ID into `app.json` → `expo.extra.googleWebClientId` or into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (copy `.env.example`), and restart Metro with `npx expo start -c`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Expo Go](https://expo.dev/go) app on your phone (or an emulator/simulator)

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npx expo start
```

### Running on iOS

**Option A: Expo Go (quickest)**
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store
2. Run `npx expo start` in the project root
3. Scan the QR code with your iPhone camera — it will open in Expo Go

**Option B: iOS Simulator (requires macOS + Xcode)**
1. Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store
2. Open Xcode and install an iOS Simulator via **Xcode → Settings → Platforms**
3. Run `npx expo start` then press `i` to open in the iOS Simulator

**Option C: Development build**
```bash
npx expo run:ios
```
This builds a native dev client on your simulator or connected device.

### Running on Android

**Option A: Expo Go (quickest)**
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Google Play Store
2. Run `npx expo start` in the project root
3. Scan the QR code with the Expo Go app

**Option B: Android Emulator**
1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → **More Actions → Virtual Device Manager** → create an emulator
3. Start the emulator, then run `npx expo start` and press `a`

**Option C: Development build**
```bash
npx expo run:android
```
This builds a native dev client on your emulator or connected USB device. Make sure USB debugging is enabled.

## Project Structure

```
app/
  index.tsx         # Redirect: auth vs main tabs
  auth/             # Sign in / sign up / Google
  (tabs)/           # Tab screens (Feed, Lists, Leaderboard, Profile)
  recipe/[id].tsx   # Recipe detail screen
  recipe/new.tsx    # Add recipe (bumps your recipe count in SQLite)
  list/[id].tsx     # List detail screen
components/         # Reusable UI components
contexts/           # AuthContext, RecipeContext
database/           # SQLite init & user helpers (db.ts)
lib/                # Password hash, JWT payload parse (Google)
types/              # TypeScript types (including StoredUser for DB)
```
