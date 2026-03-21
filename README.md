# Chef'd

A social recipe ranking app — like Beli, but for recipes instead of restaurants.

## Features

- **Feed** — See what recipes your friends are rating, with scores, notes, and favorite parts
- **Your Lists** — Organize recipes into personal collections (Favorites, Date Night, Want to Try)
- **Discover** — Search and filter recipes by cuisine, category, or ingredients
- **Leaderboard** — Top-rated recipes ranked by the community, filterable by cuisine
- **Profile** — View your stats, top-rated recipes, and manage your account
- **Recipe Details** — Full recipe view with ingredients, instructions, and friend ratings

## Tech Stack

- React Native 0.81 with Expo SDK 54
- TypeScript
- Expo Router v5 (file-based navigation)
- React 19
- @expo/vector-icons (Ionicons)

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
  (tabs)/           # Tab screens (Feed, Lists, Search, Leaderboard, Profile)
  recipe/[id].tsx   # Recipe detail screen
  list/[id].tsx     # List detail screen
components/         # Reusable UI components
constants/          # Colors, spacing, mock data
types/              # TypeScript type definitions
```
