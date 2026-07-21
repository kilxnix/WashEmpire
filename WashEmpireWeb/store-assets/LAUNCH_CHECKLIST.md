# Wash Empire — Launch Checklist

## Track A: Web launch on itch.io (possible TODAY)

The repo contains a ready `wash-empire-itch.zip` (rebuilt from the current `dist/`).

1. Create the game page at https://itch.io/game/new
2. Kind of project: **HTML** · Pricing: **$1 or more** (or free with suggested $1)
3. Upload `wash-empire-itch.zip`, check **"This file will be played in the browser"**
4. Viewport: 1280×720, enable fullscreen button, enable mobile-friendly if desired
5. Add the feature graphic + screenshots from `store-assets/`
6. Description: paste from `store-assets/LISTING.md`
7. Publish. Done today.

## Track B: Google Play (fastest realistic path ≈ 2–3 weeks for a new account)

Reality check first: **new personal Play developer accounts must run a closed test
with at least 12 testers for 14 days before they can publish to production.**
Start the clock now:

1. **Account**: Play Console developer account ($25 one-time) — https://play.google.com/console
2. **Keystore** (one time, on your machine — back it up somewhere safe):
   ```
   cd WashEmpireWeb/android
   keytool -genkey -v -keystore wash-empire-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Then create `android/keystore.properties`:
   ```
   storeFile=../wash-empire-upload.keystore
   storePassword=YOUR_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_PASSWORD
   ```
   (Both files are gitignored. Losing the keystore = losing the app. Back it up.)
3. **Install Android Studio** (brings the Android SDK) if not present
4. **Build the signed AAB**:
   ```
   cd WashEmpireWeb
   npm run build && npx cap sync android
   cd android && gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`
5. **Test on a real device first** (`gradlew assembleRelease` for an installable APK):
   touch feel, performance, suspend/resume + offline earnings, sound
6. **Play Console setup**:
   - App content: privacy policy URL (host `PRIVACY.md` publicly first)
   - Data safety: "No data collected" (true for the paid build)
   - Ads declaration: see AdMob note below
   - Content rating questionnaire (should come out Everyone)
   - Pricing: Paid, $0.99
   - Store listing: text from `LISTING.md`, graphics from `store-assets/`
7. **Closed testing**: upload AAB, add 12+ testers, run 14 days
8. **Production release**

### AdMob note (do before the Play submission)
The paid build never calls ads, but the AdMob SDK and its manifest APPLICATION_ID
still ship in the APK, which complicates the Data safety / Ads declarations.
Before submitting: remove `@capacitor-community/admob` from package.json, make the
AdMob import in `src/services/ads.ts` dynamic, delete the
`com.google.android.gms.ads.APPLICATION_ID` meta-data from AndroidManifest.xml,
then `npx cap sync android`. Then the "no ads / no data" declarations are cleanly true.

## Track C: iOS (separate project — requires a Mac)

Not started. Needs: a Mac with Xcode (or a cloud Mac CI), `npm i @capacitor/ios &&
npx cap add ios`, iOS icon/splash set (same dial artwork), Apple Developer account
($99/yr), App Store review. Plan it after Android ships.

## Version bumping for updates
`android/app/build.gradle`: increment `versionCode` (integer, every upload) and
`versionName` (display string).
