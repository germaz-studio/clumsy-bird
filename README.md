Clumsy Bird (Android Port by Germaz Studio)
==============================================

Android port of **Clumsy Bird**, developed and adapted by **Oskar Gerlicz-Kowalczuk** under **Germaz Studio**, targeted for distribution on **F-Droid**.

---

## 🏆 Credits & Legal Information

* **Original Game & Concept:** [Ellison Leão](https://github.com/ellisonleao)
* **Original Repository:** https://github.com/ellisonleao/clumsy-bird
* **Android Port & Mobile UX:** **Oskar Gerlicz-Kowalczuk** ([Germaz Studio](https://github.com/germaz-studio))
* **License:** **GNU General Public License v3.0 (GPL-3.0)** — full license terms available in `LICENSE.md`.
* **Privacy Policy:** Fully offline, zero telemetry, zero analytics, zero permissions required.

---

## 📱 Mobile Enhancements

1. **Splash Screen / Intro:**
   * Minimalist Adult Swim style `[germaz studio]` intro screen.
   * Full credit preserved for the original creator (*Ellison Leão*).
   * Open Source GPLv3 license notice.
2. **Touch & Mobile Controls:**
   * One-touch anywhere on the screen to flap wings.
   * On-screen touch mute/unmute toggle (`🔊` / `🔇`) replacing desktop-only 'M' key.
   * Auto-scaling landscape viewport (`sensorLandscape`).
3. **Native Android Wrapper (F-Droid Compliant):**
   * Clean Java wrapper with zero Kotlin runtime footprint (optimized for low-RAM builds).
   * Hardware accelerated WebView (`android:hardwareAccelerated="true"`).
   * Secure local asset streaming via AndroidX `WebViewAssetLoader` (no CORS or Web Audio autoplay restrictions).
   * 100% Free and Open Source toolchain compliance.

---

## 🛠️ Build Instructions

Configured for low-memory environments (e.g. 4GB RAM without swap) via `-Xmx512m` single-use daemon:

```bash
cd android
JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./gradlew assembleDebug --no-daemon
```

Output APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Trademark & Branding Notice
The names "germaz", "germaz studio", and the `[germaz studio]` logo/splash assets are proprietary marks of Oskar Gerlicz-Kowalczuk / Germaz Studio. The open-source license governing the code does not grant rights to use these brand assets or trademarks.
