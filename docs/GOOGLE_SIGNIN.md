# Google Sign-In setup (Expo)

The **Continue with Google** button only works after you add OAuth client IDs from Google Cloud. Until then, use **email + password** — that works without any Google setup.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select or create a project.
2. **APIs & Services** → **OAuth consent screen** → choose *External* (for testing), fill app name, your email, add test users if in *Testing* mode.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.

### Web client (required for most Expo flows)

- Application type: **Web application**
- **Authorized redirect URIs** — add **both**:
  - `https://auth.expo.io/@YOUR_EXPO_USERNAME/YOUR_APP_SLUG`  
    Replace with your Expo account username and the `slug` from `app.json` (e.g. `chefd`).  
    Find the exact URL: run the app once and check the Metro logs, or use [Expo’s Google auth guide](https://docs.expo.dev/guides/google-authentication/) for the current redirect format.
  - `http://localhost:8081` (optional, for web dev)

Copy the **Client ID** (ends with `.apps.googleusercontent.com`). This is your **`googleWebClientId`**.

### Android (Expo Go or dev build)

- Application type: **Android**
- Package name:
  - **Expo Go**: `host.exp.exponent`
  - **Your dev build**: `com.chefd.app` (match `app.json` → `android.package`)
- **SHA-1 certificate fingerprint**:
  - Expo Go: use the [Expo development certificate SHA-1](https://docs.expo.dev/guides/google-authentication/#android) from Expo docs, or run:
    ```bash
    npx expo fetch:android:hashes
    ```
  - Your own keystore: use the SHA-1 from that keystore.

Copy the **Android client ID** → **`googleAndroidClientId`**.

### iOS (physical device / TestFlight)

- Application type: **iOS**
- Bundle ID: `com.chefd.app` (match `app.json` → `ios.bundleIdentifier`)

Copy the **iOS client ID** → **`googleIosClientId`**.

## 2. Put IDs in the app

**Option A — `app.json`** (restart Metro after saving):

```json
"extra": {
  "googleWebClientId": "xxxx.apps.googleusercontent.com",
  "googleIosClientId": "yyyy.apps.googleusercontent.com",
  "googleAndroidClientId": "zzzz.apps.googleusercontent.com"
}
```

You can leave iOS/Android empty at first and only set **`googleWebClientId`**; add the others if Google still errors on a device.

**Option B — environment variables** (Expo loads `EXPO_PUBLIC_*` automatically):

Create a `.env` in the project root:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=yyyy.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=zzzz.apps.googleusercontent.com
```

Restart with a clean cache: `npx expo start -c`

## 3. Typo check

Use **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** (underscores), not `EXPO-PUBLIC-...`.

## 4. Still stuck?

- [Expo: Google authentication](https://docs.expo.dev/guides/google-authentication/) (official, updated for your SDK)
- Ensure the **OAuth consent screen** is configured and (if in testing) your Google account is a **test user**
