# WinForge Runtime Native

هذه الوحدة هي جسر Android Native بين JavaScript ومحرك Wine/Box64. المشروع يضم واجهة JNI وCMake، لكنه لا يضم Wine أو Box64 binaries لأنهما مشاريع كبيرة وتحتاج بناء ABI لكل من `arm64-v8a` و`x86_64`، ومراجعة تراخيص ومكونات Wine/Box64 وDXVK.

## تفعيل المحرك الفعلي

1. ثبّت Android SDK وNDK، ثم استخدم Android Studio أو `./gradlew assembleRelease` بعد توليد مشروع Android عبر `npx expo prebuild`.
2. ابنِ Wine وBox64 لكل ABI مستهدف مع نفس NDK وAPI level.
3. ضع مكتبات المحرك في مجلدات ABI داخل الوحدة، ثم عدّل `WINFORGE_WINE_EXTERNAL=1` واربط المكتبات في `CMakeLists.txt`.
4. اربط دورة حياة Wine prefix، مسارات DLL، Box64 loader، وDXVK داخل `nativeRunExe`.
5. استخدم Development Build أو APK مستقل؛ Expo Go لا يحمل وحدات Native مخصصة.

القارئ الموجود في `lib/native-runtime.ts` يعمل قبل ربط المحرك: يختار EXE، يتحقق من ترويسة `MZ/PE`، يستخرج المعمارية وSubsystem وEntry Point، ويرفض الملفات غير الصالحة أو المعماريات غير المدعومة.
