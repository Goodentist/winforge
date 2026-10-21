import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

export type NativeEngineStatus = {
  available: boolean;
  wineVersion?: string;
  box64Version?: string;
  message: string;
};

export type ExeInspection = {
  name: string;
  uri: string;
  size: number;
  architecture: "x86" | "x64" | "arm64" | "unknown";
  subsystem: "GUI" | "console" | "unknown";
  isPe: boolean;
  machine: string;
  entryPoint?: string;
  canRun: boolean;
  message: string;
};

type NativeRuntimeBridge = {
  getStatus?: () => Promise<NativeEngineStatus>;
  runExe?: (uri: string, args?: string[]) => Promise<{ started: boolean; message: string }>;
};

const bridge = requireOptionalNativeModule<NativeRuntimeBridge>("WinForgeRuntime");

export function getNativeEngineStatus(): NativeEngineStatus {
  if (Platform.OS !== "android" || !bridge) {
    return {
      available: false,
      message: "محرك Android Native غير مضمّن في Expo Go؛ يلزم بناء APK مخصص مع NDK.",
    };
  }
  return {
    available: false,
    message: "تم العثور على الجسر، لكن يجب تضمين مكتبات Wine وBox64 الأصلية أولًا.",
  };
}

export async function pickAndInspectExe(): Promise<ExeInspection | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/vnd.microsoft.portable-executable", "application/octet-stream", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const lowerName = asset.name.toLowerCase();
  if (!lowerName.endsWith(".exe")) {
    throw new Error("الملف المحدد ليس EXE. اختر ملفًا ينتهي بالامتداد .exe");
  }

  const bytes = new Uint8Array(await new File(asset.uri).arrayBuffer());
  return inspectPortableExecutable(asset.name, asset.uri, asset.size ?? bytes.byteLength, bytes);
}

function u16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function u32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function hex(value: number) {
  return `0x${value.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function inspectPortableExecutable(name: string, uri: string, size: number, bytes: Uint8Array): ExeInspection {
  if (bytes.length < 64 || bytes[0] !== 0x4d || bytes[1] !== 0x5a) {
    return { name, uri, size, architecture: "unknown", subsystem: "unknown", isPe: false, machine: "Unknown", canRun: false, message: "لا يحتوي الملف على ترويسة DOS صالحة." };
  }
  const peOffset = u32(bytes, 0x3c);
  if (peOffset + 26 > bytes.length || u32(bytes, peOffset) !== 0x00004550) {
    return { name, uri, size, architecture: "unknown", subsystem: "unknown", isPe: false, machine: "Unknown", canRun: false, message: "توقيع PE غير موجود أو الملف تالف." };
  }

  const machine = u16(bytes, peOffset + 4);
  const optionalHeaderSize = u16(bytes, peOffset + 20);
  const optionalHeader = peOffset + 24;
  const subsystemOffset = optionalHeader + 68;
  const entryOffset = optionalHeader + 16;
  const magic = optionalHeader + 2 <= bytes.length ? u16(bytes, optionalHeader) : 0;
  const architecture = machine === 0x8664 ? "x64" : machine === 0xaa64 ? "arm64" : machine === 0x14c ? "x86" : "unknown";
  const subsystemValue = subsystemOffset + 2 <= bytes.length ? u16(bytes, subsystemOffset) : 0;
  const subsystem = subsystemValue === 2 ? "GUI" : subsystemValue === 3 ? "console" : "unknown";
  const canRun = architecture === "x86" || architecture === "x64";

  return {
    name,
    uri,
    size,
    architecture,
    subsystem,
    isPe: true,
    machine: machine === 0x8664 ? "AMD64" : machine === 0xaa64 ? "ARM64" : machine === 0x14c ? "I386" : `0x${machine.toString(16).toUpperCase()}`,
    entryPoint: entryOffset + 4 <= bytes.length ? hex(u32(bytes, entryOffset)) : undefined,
    canRun,
    message: canRun
      ? `PE صالح · ${architecture} · ${subsystem}`
      : `PE صالح لكنه مبني لمعمارية ${architecture} غير المدعومة حاليًا`,
  };
}

export async function runExe(uri: string, args: string[] = []) {
  if (!bridge?.runExe) {
    return { started: false, message: "لم يبدأ التشغيل: جسر Wine/Box64 غير مضمّن في هذا البناء." };
  }
  return bridge.runExe(uri, args);
}
