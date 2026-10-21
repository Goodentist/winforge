package com.winforge.runtime

import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class WinForgeRuntimeModule : Module() {
  companion object {
    init {
      try { System.loadLibrary("winforge_runtime") } catch (_: UnsatisfiedLinkError) { }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("WinForgeRuntime")

    AsyncFunction("getStatus") {
      mapOf(
        "available" to nativeEngineAvailable(),
        "wineVersion" to nativeWineVersion(),
        "box64Version" to nativeBox64Version(),
        "message" to if (nativeEngineAvailable()) "Wine/Box64 Native جاهز" else "مكتبات Wine/Box64 غير مضمّنة في هذا البناء"
      )
    }

    AsyncFunction("runExe") { uri: String, args: List<String> ->
      val context = requireNotNull(appContext.reactContext)
      val source = Uri.parse(uri)
      val file = if (source.scheme == "file") File(source.path ?: "") else null
      if (file == null || !file.exists()) {
        return@AsyncFunction mapOf("started" to false, "message" to "تعذر الوصول إلى ملف EXE")
      }
      if (!nativeEngineAvailable()) {
        return@AsyncFunction mapOf("started" to false, "message" to "محرك Wine/Box64 غير مضمّن؛ ابنِ APK مع مصادر المحرك أولًا")
      }
      val started = nativeRunExe(file.absolutePath, args.toTypedArray(), context.cacheDir.absolutePath)
      mapOf("started" to started, "message" to if (started) "بدأ تشغيل EXE داخل Wine" else "فشل تشغيل EXE")
    }
  }

  private external fun nativeEngineAvailable(): Boolean
  private external fun nativeWineVersion(): String
  private external fun nativeBox64Version(): String
  private external fun nativeRunExe(path: String, args: Array<String>, cacheDir: String): Boolean
}
