#include <jni.h>
#include <string>

// This bridge is deliberately non-functional until a licensed/compatible Wine + Box64
// build is placed in the ABI folders and WINFORGE_WINE_EXTERNAL is enabled.
static bool engine_available() {
#if WINFORGE_WINE_EXTERNAL
  return true;
#else
  return false;
#endif
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_winforge_runtime_WinForgeRuntimeModule_nativeEngineAvailable(JNIEnv*, jobject) {
  return engine_available();
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_winforge_runtime_WinForgeRuntimeModule_nativeWineVersion(JNIEnv* env, jobject) {
  return env->NewStringUTF(engine_available() ? "Wine (external build)" : "not bundled");
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_winforge_runtime_WinForgeRuntimeModule_nativeBox64Version(JNIEnv* env, jobject) {
  return env->NewStringUTF(engine_available() ? "Box64 (external build)" : "not bundled");
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_winforge_runtime_WinForgeRuntimeModule_nativeRunExe(JNIEnv*, jobject, jstring, jobjectArray, jstring) {
  // The actual Wine prefix/process lifecycle belongs here after linking Wine/Box64.
  return JNI_FALSE;
}
