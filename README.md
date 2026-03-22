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

These steps are for running Chef’d on **your own machine** (macOS, Windows, or Linux) and on a **physical iPhone/Android device** or **simulator/emulator**.

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later (`node -v`)
- [Git](https://git-scm.com/)
- For **iOS Simulator**: a Mac with [Xcode](https://developer.apple.com/xcode/) (Apple’s iOS Simulator is macOS-only)
- For **Android Emulator**: [Android Studio](https://developer.android.com/studio) with a virtual device, or a physical device with USB debugging
- Optional: [Expo Go](https://expo.dev/go) on your phone for the fastest try-out without building native code

### Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/Chefd.git
cd Chefd
npm install
```

Use your fork’s URL or the repo you were given. Then continue with the API key below (needed for Remy Rat) and start Metro.

### Remy Rat — Fetch AI (ASI:One) API key

**Remy Rat** is the in-app cooking assistant. It talks to **ASI:One** (Fetch AI). You need your **own API key** on every computer where you run the app with AI enabled.

#### How to get your API key

1. Open **[https://asi1.ai](https://asi1.ai)** and sign up or sign in.
2. Go to the **Developer** area of the dashboard.
3. Use **Create New** (or equivalent) to create an API key, give it a name, and **copy the key** when it is shown. Store it somewhere safe (you may not be able to see the full key again later).
4. Optional reference: [ASI:One Developer Quickstart](https://docs.asi1.ai/documentation/getting-started/quickstart) (same API as in that guide: `https://api.asi1.ai/v1/chat/completions`).

#### Add the key to this project (local setup)

Do **not** commit keys to Git. Pick one approach:

**Option A — `secrets` file (recommended for local dev)**  
1. Create a folder `secrets` in the project root (if it doesn’t exist).  
2. Create a file `secrets/asi-one.key` and put **only your API key** on the first line, then save.  
3. That path is **gitignored** (`secrets/*` in `.gitignore`), so it won’t be pushed to GitHub.  
4. The app loads it via `app.config.js` into `expo.extra.asiOneApiKey`.

**Option B — environment variable**  
1. In the project root, create a `.env` file (also gitignored).  
2. Add:
   ```bash
   EXPO_PUBLIC_ASI_ONE_API_KEY=your_key_here
   ```
3. Restart the dev server after any change.

**Option C — `app.json`** (less ideal; avoid if the repo is shared)  
You can set `expo.extra.asiOneApiKey` in `app.json` — only for private local experiments; never commit real keys to a public repo.

After adding the key, restart Metro. If the client doesn’t see the key, try:

```bash
npx expo start -c
```

**Note:** Values prefixed with `EXPO_PUBLIC_` are included in the client bundle. For production, a small backend that holds the key is safer; for development on your own machine, `secrets/asi-one.key` is the usual approach.

### Start the development server

From the project root:

```bash
npx expo start
```

Then choose how to open the app on **iOS** or **Android** below.

### Running on iOS

**Option A — Expo Go on a physical iPhone (simplest)**  
1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store.  
2. Run `npx expo start` on your computer (same Wi‑Fi as the phone helps).  
3. Scan the QR code from the terminal or Dev Tools with the Camera app; open in Expo Go.

**Option B — iOS Simulator (macOS + Xcode)**  
1. Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store and open it once to finish setup.  
2. Install a simulator runtime: **Xcode → Settings → Platforms** (or **Components** in older Xcode).  
3. From the project folder, run `npx expo start`, then press **`i`**, or run `npx expo start --ios`.

**Option C — Native development build (Simulator or device)**  
```bash
npx expo run:ios
```
Builds and installs the dev client. Requires Xcode and CocoaPods on macOS.

### Running on Android

**Option A — Expo Go on a physical Android phone (simplest)**  
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store.  
2. Run `npx expo start` on your computer.  
3. Scan the QR code with Expo Go (or use **adb** / same network per Expo’s prompts).

**Option B — Android Emulator**  
1. Install [Android Studio](https://developer.android.com/studio).  
2. Open **Device Manager**, create a virtual device, and start it.  
3. Run `npx expo start`, then press **`a`**, or run `npx expo start --android`.

**Option C — Native development build (emulator or USB device)**  
```bash
npx expo run:android
```
On a physical device, enable **Developer options** and **USB debugging**. Ensure `ANDROID_HOME` is set if the CLI asks for it.

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
