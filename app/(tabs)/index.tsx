import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { pickAndInspectExe, runExe, type ExeInspection } from "@/lib/native-runtime";

type IconName = keyof typeof MaterialIcons.glyphMap;
type Tab = "environments" | "templates" | "files" | "settings";
type RuntimeStatus = "ready" | "stopped" | "running";

type Environment = {
  id: string;
  name: string;
  status: RuntimeStatus;
  vendor: string;
  model: string;
  generation: string;
  ram: string;
  disk: string;
  cores: number;
  accent: string;
};

type DeviceTemplate = {
  id: string;
  vendor: string;
  name: string;
  generation: string;
  cpu: string;
  gpu: string;
  ram: string;
  disk: string;
  color: string;
};

const COLORS = {
  background: "#08111F",
  surface: "#0F1D30",
  surfaceRaised: "#142640",
  surfaceSoft: "#102238",
  border: "#203957",
  text: "#F4F8FF",
  muted: "#8FA5BF",
  dim: "#5E7896",
  cyan: "#63E6FF",
  cyanSoft: "#163D52",
  green: "#67E3A6",
  greenSoft: "#123A34",
  orange: "#FFB86B",
  orangeSoft: "#3A2B1B",
  red: "#FF7885",
  purple: "#B6A4FF",
};

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "environments", label: "البيئات", icon: "dns" },
  { id: "templates", label: "القوالب", icon: "developer-board" },
  { id: "files", label: "الملفات", icon: "folder-open" },
  { id: "settings", label: "الإعدادات", icon: "tune" },
];

const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    id: "msi-creator",
    vendor: "MSI",
    name: "Creator Z16",
    generation: "Intel Gen 13",
    cpu: "Core i7-13700H",
    gpu: "RTX 4060 · 8 GB",
    ram: "16 GB",
    disk: "256 GB",
    color: "#F66D85",
  },
  {
    id: "hp-elite",
    vendor: "HP",
    name: "EliteBook Studio",
    generation: "Intel Gen 12",
    cpu: "Core i5-1240P",
    gpu: "Iris Xe",
    ram: "8 GB",
    disk: "128 GB",
    color: "#63E6FF",
  },
  {
    id: "lenovo-think",
    vendor: "Lenovo",
    name: "ThinkPad X1",
    generation: "AMD Ryzen 7000",
    cpu: "Ryzen 7 7840U",
    gpu: "Radeon 780M",
    ram: "16 GB",
    disk: "256 GB",
    color: "#FFB86B",
  },
  {
    id: "dell-xps",
    vendor: "Dell",
    name: "XPS Developer",
    generation: "Intel Gen 11",
    cpu: "Core i7-11800H",
    gpu: "RTX 3050 Ti",
    ram: "12 GB",
    disk: "192 GB",
    color: "#B6A4FF",
  },
];

const INITIAL_ENVIRONMENTS: Environment[] = [
  {
    id: "qa-11",
    name: "Windows 11 · QA Lab",
    status: "ready",
    vendor: "MSI",
    model: "Creator Z16",
    generation: "Intel Gen 13",
    ram: "8 GB",
    disk: "120 GB",
    cores: 4,
    accent: COLORS.cyan,
  },
  {
    id: "legacy-10",
    name: "Windows 10 · Legacy",
    status: "stopped",
    vendor: "HP",
    model: "EliteBook Studio",
    generation: "Intel Gen 12",
    ram: "4 GB",
    disk: "64 GB",
    cores: 2,
    accent: COLORS.purple,
  },
];

const FILES = [
  { icon: "album" as IconName, name: "Windows_11_23H2.iso", type: "ISO image", size: "6.4 GB", color: COLORS.cyan },
  { icon: "insert-drive-file" as IconName, name: "setup-utility.exe", type: "Windows app", size: "42 MB", color: COLORS.orange },
  { icon: "restore" as IconName, name: "QA Lab · clean boot", type: "Snapshot", size: "8.1 GB", color: COLORS.green },
  { icon: "insert-drive-file" as IconName, name: "legacy-tool.exe", type: "Windows app", size: "18 MB", color: COLORS.purple },
];

function Icon({ name, color = COLORS.muted, size = 20 }: { name: IconName; color?: string; size?: number }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

function Pill({ label, color, soft }: { label: string; color: string; soft: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function ResourceBar({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return (
    <View style={styles.resourceBlock}>
      <View style={styles.resourceHeader}>
        <Text style={styles.resourceDetail}>{detail}</Text>
        <Text style={styles.resourceLabel}>{label}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function EnvironmentCard({
  environment,
  selected,
  onSelect,
  onToggle,
}: {
  environment: Environment;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const running = environment.status === "running";
  const ready = environment.status === "ready";
  return (
    <Pressable onPress={onSelect} style={[styles.envCard, selected && styles.envCardSelected]}>
      <View style={styles.envCardTop}>
        <View style={styles.envTitleWrap}>
          <View style={[styles.envIcon, { backgroundColor: `${environment.accent}18` }]}>
            <Icon name="desktop-windows" color={environment.accent} size={22} />
          </View>
          <View>
            <Text style={styles.envName}>{environment.name}</Text>
            <Text style={styles.envSubtitle}>{environment.vendor} · {environment.model}</Text>
          </View>
        </View>
        <Pill
          label={running ? "قيد التشغيل" : ready ? "جاهزة" : "متوقفة"}
          color={running || ready ? COLORS.green : COLORS.dim}
          soft={running || ready ? COLORS.greenSoft : COLORS.surfaceSoft}
        />
      </View>
      <View style={styles.specRow}>
        <View style={styles.spec}><Icon name="memory" size={15} color={COLORS.dim} /><Text style={styles.specText}>{environment.ram} RAM</Text></View>
        <View style={styles.spec}><Icon name="storage" size={15} color={COLORS.dim} /><Text style={styles.specText}>{environment.disk}</Text></View>
        <View style={styles.spec}><Icon name="view-module" size={15} color={COLORS.dim} /><Text style={styles.specText}>{environment.cores} Cores</Text></View>
        <Text style={styles.generation}>{environment.generation}</Text>
      </View>
      {selected && (
        <View style={styles.cardFooter}>
          <Text style={styles.lastUsed}>{running ? "المحرك متصل · الجلسة نشطة" : "لم تُشغّل في هذه الجلسة"}</Text>
          <Pressable onPress={onToggle} style={[styles.runButton, running && styles.stopButton]}>
            <Icon name={running ? "stop" : "play-arrow"} size={17} color={running ? COLORS.red : COLORS.background} />
            <Text style={[styles.runButtonText, running && { color: COLORS.red }]}>{running ? "إيقاف" : "تشغيل"}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function Header({ onNew }: { onNew: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logo}><View style={styles.logoPane} /><View style={[styles.logoPane, styles.logoPaneAccent]} /></View>
        <View>
          <Text style={styles.brandName}>WINFORGE</Text>
          <Text style={styles.brandCaption}>Windows Runtime</Text>
        </View>
      </View>
      <Pressable onPress={onNew} style={styles.addButton}>
        <Icon name="add" color={COLORS.background} size={22} />
      </Pressable>
    </View>
  );
}

function EngineBanner() {
  return (
    <View style={styles.engineBanner}>
      <View style={styles.engineIcon}><Icon name="memory" color={COLORS.cyan} size={21} /></View>
      <View style={styles.engineCopy}>
        <View style={styles.engineTitleRow}><Text style={styles.engineTitle}>Native Engine</Text><Pill label="جاهز للربط" color={COLORS.orange} soft={COLORS.orangeSoft} /></View>
        <Text style={styles.engineBody}>إدارة البيئات جاهزة. أضف Wine/Box64 أو محرك افتراضية لتشغيل Windows فعليًا.</Text>
      </View>
      <Icon name="chevron-left" color={COLORS.dim} size={20} />
    </View>
  );
}

function Dashboard({ environments, selectedId, onSelect, onToggle, onNew }: { environments: Environment[]; selectedId: string; onSelect: (id: string) => void; onToggle: (id: string) => void; onNew: () => void }) {
  const selected = environments.find((item) => item.id === selectedId) ?? environments[0];
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header onNew={onNew} />
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.eyebrow}>CONTROL CENTER / 01</Text>
          <Text style={styles.pageTitle}>بيئتك تحت السيطرة</Text>
        </View>
        <View style={styles.onlineDot}><View style={styles.onlineDotInner} /><Text style={styles.onlineText}>محلي</Text></View>
      </View>
      <EngineBanner />
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>البيئة النشطة</Text><Text style={styles.sectionMeta}>{environments.length} بيئات</Text></View>
      {selected && <View style={styles.activeCard}>
        <View style={styles.activeTop}><View><Text style={styles.activeLabel}>SELECTED RUNTIME</Text><Text style={styles.activeName}>{selected.name}</Text><Text style={styles.activeSub}>{selected.vendor} {selected.model} · {selected.generation}</Text></View><View style={styles.activeCircle}><Icon name="desktop-windows" color={selected.accent} size={27} /></View></View>
        <View style={styles.resourceGrid}><ResourceBar label="الذاكرة" value={selected.status === "running" ? 62 : 38} detail={`${selected.status === "running" ? "5.0" : "3.0"} / ${selected.ram}`} color={COLORS.cyan} /><ResourceBar label="التخزين" value={34} detail={`41 / ${selected.disk}`} color={COLORS.purple} /></View>
        <View style={styles.activeBottom}><View style={styles.activeStatus}><View style={[styles.statusDot, { backgroundColor: selected.status === "running" ? COLORS.green : COLORS.orange }]} /><Text style={styles.activeStatusText}>{selected.status === "running" ? "الجلسة قيد التشغيل" : "جاهزة لبدء الاختبار"}</Text></View><Pressable onPress={() => onToggle(selected.id)} style={[styles.primaryButton, selected.status === "running" && styles.secondaryButton]}><Icon name={selected.status === "running" ? "stop" : "play-arrow"} color={selected.status === "running" ? COLORS.red : COLORS.background} size={18} /><Text style={[styles.primaryButtonText, selected.status === "running" && { color: COLORS.red }]}>{selected.status === "running" ? "إيقاف البيئة" : "تشغيل البيئة"}</Text></Pressable></View>
      </View>}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>كل البيئات</Text><Pressable onPress={onNew}><Text style={styles.linkText}>+ بيئة جديدة</Text></Pressable></View>
      {environments.map((environment) => <EnvironmentCard key={environment.id} environment={environment} selected={environment.id === selectedId} onSelect={() => onSelect(environment.id)} onToggle={() => onToggle(environment.id)} />)}
      <Text style={styles.footerNote}>اضبط العتاد قبل التشغيل · لا يتم تشغيل EXE دون محرك Native</Text>
    </ScrollView>
  );
}

function TemplateCard({ template, onUse }: { template: DeviceTemplate; onUse: () => void }) {
  return <Pressable onPress={onUse} style={styles.templateCard}><View style={styles.templateTop}><View style={[styles.vendorBadge, { borderColor: `${template.color}70` }]}><Text style={[styles.vendorText, { color: template.color }]}>{template.vendor}</Text></View><Icon name="more-horiz" color={COLORS.dim} size={20} /></View><Text style={styles.templateName}>{template.name}</Text><Text style={styles.templateGeneration}>{template.generation}</Text><View style={styles.templateSpecs}><Text style={styles.templateSpec}>{template.cpu}</Text><Text style={styles.templateSpec}>{template.gpu}</Text></View><View style={styles.templateBottom}><Text style={styles.templateMemory}>{template.ram} · {template.disk}</Text><Text style={[styles.useTemplate, { color: template.color }]}>استخدم القالب</Text></View></Pressable>;
}

function TemplatesScreen({ onUse }: { onUse: (template: DeviceTemplate) => void }) {
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><Header onNew={() => onUse(DEVICE_TEMPLATES[0])} /><View style={styles.greetingRow}><View><Text style={styles.eyebrow}>HARDWARE PROFILES / 02</Text><Text style={styles.pageTitle}>قوالب الأجهزة</Text></View><View style={styles.countBadge}><Text style={styles.countText}>{DEVICE_TEMPLATES.length}</Text></View></View><Text style={styles.pageDescription}>اختر ملف جهاز حديثًا كبداية، ثم عدّل الموارد حسب بيئة الاختبار.</Text><View style={styles.templateList}>{DEVICE_TEMPLATES.map((template) => <TemplateCard key={template.id} template={template} onUse={() => onUse(template)} />)}</View><View style={styles.infoCard}><Icon name="info-outline" color={COLORS.cyan} size={20} /><Text style={styles.infoText}>ملفات الشركة والطراز محاكاة للتهيئة فقط، ولا تغيّر نوع العتاد الفعلي للمضيف.</Text></View></ScrollView>;
}

function FilesScreen() {
  const [exe, setExe] = useState<ExeInspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importExe = async () => {
    setError(null);
    setRunMessage(null);
    setBusy(true);
    try {
      setExe(await pickAndInspectExe());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر قراءة الملف");
    } finally {
      setBusy(false);
    }
  };
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><Header onNew={() => {}} /><View style={styles.greetingRow}><View><Text style={styles.eyebrow}>ASSET VAULT / 03</Text><Text style={styles.pageTitle}>مخزن الملفات</Text></View><Pressable onPress={importExe} style={styles.iconButton}><Icon name="file-upload" color={COLORS.cyan} size={20} /></Pressable></View><View style={styles.storageSummary}><View><Text style={styles.summaryLabel}>مساحة التخزين المستخدمة</Text><Text style={styles.summaryValue}>14.6 <Text style={styles.summaryUnit}>GB</Text></Text></View><View style={styles.storageRing}><Text style={styles.ringText}>24%</Text></View></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>آخر الملفات</Text><Text style={styles.sectionMeta}>{FILES.length + (exe ? 1 : 0)} عناصر</Text></View><View style={styles.fileList}>{FILES.map((file) => <View key={file.name} style={styles.fileRow}><View style={[styles.fileIcon, { backgroundColor: `${file.color}18` }]}><Icon name={file.icon} color={file.color} size={20} /></View><View style={styles.fileCopy}><Text style={styles.fileName}>{file.name}</Text><Text style={styles.fileType}>{file.type} · {file.size}</Text></View><Icon name="chevron-left" color={COLORS.dim} size={20} /></View>)}{exe && <View style={styles.fileRow}><View style={[styles.fileIcon, { backgroundColor: `${COLORS.orange}18` }]}><Icon name="verified" color={COLORS.orange} size={20} /></View><View style={styles.fileCopy}><Text style={styles.fileName}>{exe.name}</Text><Text style={styles.fileType}>{exe.machine} · {exe.architecture} · {(exe.size / 1024 / 1024).toFixed(1)} MB</Text></View><Icon name="chevron-left" color={COLORS.dim} size={20} /></View>}</View>{exe && <View style={[styles.exeReport, { borderColor: exe.isPe ? COLORS.green : COLORS.red }]}><View style={styles.exeReportHeader}><Text style={styles.exeReportTitle}>تحليل PE / EXE</Text><View style={[styles.reportBadge, { backgroundColor: exe.canRun ? COLORS.greenSoft : COLORS.orangeSoft }]}><Text style={[styles.reportBadgeText, { color: exe.canRun ? COLORS.green : COLORS.orange }]}>{exe.canRun ? "قابل للمحرك" : "للقراءة فقط"}</Text></View></View><Text style={styles.exeReportMessage}>{exe.message}</Text><View style={styles.exeMetaRow}><Text style={styles.exeMeta}>Subsystem: {exe.subsystem}</Text><Text style={styles.exeMeta}>Entry: {exe.entryPoint ?? "—"}</Text></View><Pressable onPress={async () => setRunMessage((await runExe(exe.uri)).message)} style={styles.runExeButton}><Icon name="play-arrow" color={COLORS.background} size={17} /><Text style={styles.runExeText}>محاولة التشغيل عبر Wine</Text></Pressable>{runMessage && <Text style={styles.runMessage}>{runMessage}</Text>}</View>}{error && <View style={styles.errorBanner}><Icon name="error-outline" color={COLORS.red} size={18} /><Text style={styles.errorText}>{error}</Text></View>}<View style={styles.uploadCard}><Icon name="cloud-upload" color={COLORS.cyan} size={25} /><Text style={styles.uploadTitle}>أضف ISO أو EXE</Text><Text style={styles.uploadBody}>{busy ? "جارٍ قراءة ترويسة PE…" : "اختر ملف EXE لفحص MZ/PE والمعمارية قبل تشغيله."}</Text><Pressable onPress={importExe} style={styles.outlineButton}><Text style={styles.outlineButtonText}>{busy ? "جارٍ التحليل" : "استيراد EXE"}</Text></Pressable></View></ScrollView>;
}

function SettingsScreen() {
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><Header onNew={() => {}} /><View style={styles.greetingRow}><View><Text style={styles.eyebrow}>SYSTEM CONFIG / 04</Text><Text style={styles.pageTitle}>الإعدادات</Text></View></View><View style={styles.settingsGroup}><Text style={styles.groupLabel}>المحرك</Text><View style={styles.settingRow}><View style={styles.settingIcon}><Icon name="developer-mode" color={COLORS.orange} size={20} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>Native Runtime Bridge</Text><Text style={styles.settingSubtitle}>لم يتم ربط Wine / Box64 بعد</Text></View><Pill label="قيد التطوير" color={COLORS.orange} soft={COLORS.orangeSoft} /></View></View><View style={styles.settingsGroup}><Text style={styles.groupLabel}>الواجهة</Text><View style={styles.settingRow}><View style={styles.settingIcon}><Icon name="language" color={COLORS.cyan} size={20} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>لغة التطبيق</Text><Text style={styles.settingSubtitle}>العربية · RTL</Text></View><Icon name="chevron-left" color={COLORS.dim} size={20} /></View><View style={styles.settingRow}><View style={styles.settingIcon}><Icon name="dark-mode" color={COLORS.purple} size={20} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>المظهر</Text><Text style={styles.settingSubtitle}>لوحة التحكم الداكنة</Text></View><View style={styles.toggleOn}><View style={styles.toggleKnob} /></View></View></View><View style={styles.aboutCard}><View style={styles.aboutLogo}><View style={styles.logoPane} /><View style={[styles.logoPane, styles.logoPaneAccent]} /></View><Text style={styles.aboutTitle}>WinForge</Text><Text style={styles.aboutVersion}>Windows Runtime · v0.1 preview</Text><Text style={styles.aboutBody}>مدير بيئات Windows قابل للتوسع. هذه النسخة تضع أساس الإعداد والموارد قبل دمج المحرك الأصلي.</Text></View></ScrollView>;
}

function CreateEnvironmentModal({ visible, onClose, onCreate, initialTemplate }: { visible: boolean; onClose: () => void; onCreate: (environment: Environment) => void; initialTemplate?: DeviceTemplate }) {
  const [name, setName] = useState(initialTemplate ? `${initialTemplate.vendor} · ${initialTemplate.name}` : "");
  const [ram, setRam] = useState("4 GB");
  const [disk, setDisk] = useState("64 GB");
  const [cores, setCores] = useState(2);
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? DEVICE_TEMPLATES[0].id);
  const template = DEVICE_TEMPLATES.find((item) => item.id === templateId) ?? DEVICE_TEMPLATES[0];
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ id: `env-${Date.now()}`, name: name.trim(), status: "stopped", vendor: template.vendor, model: template.name, generation: template.generation, ram, disk, cores, accent: template.color });
    setName("");
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHandle} /><View style={styles.modalHeader}><Text style={styles.modalTitle}>إنشاء بيئة جديدة</Text><Pressable onPress={onClose}><Icon name="close" color={COLORS.muted} size={22} /></Pressable></View><Text style={styles.inputLabel}>اسم البيئة</Text><TextInput value={name} onChangeText={setName} placeholder="مثال: Windows QA" placeholderTextColor={COLORS.dim} style={styles.input} textAlign="right" /><Text style={styles.inputLabel}>ملف الجهاز</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{DEVICE_TEMPLATES.map((item) => <Pressable key={item.id} onPress={() => setTemplateId(item.id)} style={[styles.choiceChip, item.id === templateId && { borderColor: item.color, backgroundColor: `${item.color}16` }]}><Text style={[styles.choiceChipText, item.id === templateId && { color: item.color }]}>{item.vendor} · {item.generation.replace("Intel ", "")}</Text></Pressable>)}</ScrollView><Text style={styles.inputLabel}>الذاكرة</Text><View style={styles.choiceRow}>{["2 GB", "4 GB", "8 GB", "16 GB"].map((item) => <Pressable key={item} onPress={() => setRam(item)} style={[styles.resourceChoice, ram === item && styles.resourceChoiceActive]}><Text style={[styles.resourceChoiceText, ram === item && styles.resourceChoiceTextActive]}>{item}</Text></Pressable>)}</View><Text style={styles.inputLabel}>التخزين</Text><View style={styles.choiceRow}>{["32 GB", "64 GB", "128 GB"].map((item) => <Pressable key={item} onPress={() => setDisk(item)} style={[styles.resourceChoice, disk === item && styles.resourceChoiceActive]}><Text style={[styles.resourceChoiceText, disk === item && styles.resourceChoiceTextActive]}>{item}</Text></Pressable>)}</View><View style={styles.coresRow}><Text style={styles.inputLabel}>أنوية المعالج</Text><View style={styles.stepper}><Pressable onPress={() => setCores((value) => Math.min(8, value + 1))} style={styles.stepButton}><Icon name="add" color={COLORS.cyan} size={18} /></Pressable><Text style={styles.stepValue}>{cores}</Text><Pressable onPress={() => setCores((value) => Math.max(1, value - 1))} style={styles.stepButton}><Icon name="remove" color={COLORS.cyan} size={18} /></Pressable></View></View><Pressable onPress={submit} style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}><Icon name="add-circle-outline" color={name.trim() ? COLORS.background : COLORS.dim} size={20} /><Text style={[styles.createButtonText, !name.trim() && { color: COLORS.dim }]}>إنشاء البيئة</Text></Pressable></View></View></Modal>;
}

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>("environments");
  const [environments, setEnvironments] = useState(INITIAL_ENVIRONMENTS);
  const [selectedId, setSelectedId] = useState(INITIAL_ENVIRONMENTS[0].id);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialTemplate, setInitialTemplate] = useState<DeviceTemplate | undefined>();
  const toggleEnvironment = (id: string) => setEnvironments((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "running" ? "ready" : "running" } : item));
  const openCreate = (template?: DeviceTemplate) => { setInitialTemplate(template); setModalVisible(true); };
  const addEnvironment = (environment: Environment) => { setEnvironments((items) => [environment, ...items]); setSelectedId(environment.id); setModalVisible(false); };
  return <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-[#08111F]" safeAreaClassName="bg-[#08111F]"><StatusBar barStyle="light-content" /><View style={styles.app}>
    {tab === "environments" && <Dashboard environments={environments} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleEnvironment} onNew={() => openCreate()} />}
    {tab === "templates" && <TemplatesScreen onUse={openCreate} />}
    {tab === "files" && <FilesScreen />}
    {tab === "settings" && <SettingsScreen />}
    <View style={styles.bottomNav}>{TABS.map((item) => <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.navItem, tab === item.id && styles.navItemActive]}><Icon name={item.icon} color={tab === item.id ? COLORS.cyan : COLORS.dim} size={21} /><Text style={[styles.navLabel, tab === item.id && styles.navLabelActive]}>{item.label}</Text></Pressable>)}</View>
    <CreateEnvironmentModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreate={addEnvironment} initialTemplate={initialTemplate} />
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 112 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  brandRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.cyan, padding: 9, flexDirection: "row", flexWrap: "wrap", gap: 3, transform: [{ rotate: "-4deg" }] },
  logoPane: { width: 8, height: 8, borderRadius: 2, backgroundColor: COLORS.background },
  logoPaneAccent: { backgroundColor: "#DDFBFF" },
  brandName: { color: COLORS.text, fontSize: 17, letterSpacing: 2.6, fontWeight: "800", textAlign: "right" },
  brandCaption: { color: COLORS.dim, fontSize: 10, letterSpacing: 1.1, marginTop: 2, textAlign: "right" },
  addButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.cyan, alignItems: "center", justifyContent: "center" },
  greetingRow: { flexDirection: "row-reverse", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: COLORS.cyan, fontSize: 10, letterSpacing: 1.3, fontWeight: "700", textAlign: "right", marginBottom: 8 },
  pageTitle: { color: COLORS.text, fontSize: 28, fontWeight: "800", textAlign: "right", letterSpacing: -0.5 },
  pageDescription: { color: COLORS.muted, fontSize: 14, lineHeight: 22, textAlign: "right", marginTop: -8, marginBottom: 20 },
  onlineDot: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingBottom: 4 },
  onlineDotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  onlineText: { color: COLORS.green, fontSize: 11, fontWeight: "700" },
  countBadge: { minWidth: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cyanSoft },
  countText: { color: COLORS.cyan, fontWeight: "800", fontSize: 14 },
  engineBanner: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 26, gap: 11 },
  engineIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: COLORS.cyanSoft, alignItems: "center", justifyContent: "center" },
  engineCopy: { flex: 1, gap: 5 },
  engineTitleRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "flex-start", gap: 8 },
  engineTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800", textAlign: "right" },
  engineBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "right" },
  pill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: "800" },
  sectionHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", textAlign: "right" },
  sectionMeta: { color: COLORS.dim, fontSize: 11, textAlign: "right" },
  linkText: { color: COLORS.cyan, fontSize: 12, fontWeight: "700" },
  activeCard: { backgroundColor: COLORS.surfaceRaised, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: "#285071", marginBottom: 26 },
  activeTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  activeLabel: { color: COLORS.cyan, fontSize: 9, letterSpacing: 1.4, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  activeName: { color: COLORS.text, fontSize: 19, fontWeight: "800", textAlign: "right" },
  activeSub: { color: COLORS.muted, fontSize: 11, marginTop: 4, textAlign: "right" },
  activeCircle: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.cyanSoft, alignItems: "center", justifyContent: "center" },
  resourceGrid: { flexDirection: "row-reverse", gap: 18, marginTop: 24 },
  resourceBlock: { flex: 1 },
  resourceHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resourceLabel: { color: COLORS.muted, fontSize: 11, textAlign: "right" },
  resourceDetail: { color: COLORS.text, fontSize: 10, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: "#223A57", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 4 },
  activeBottom: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 21, paddingTop: 14, borderTopColor: COLORS.border, borderTopWidth: 1 },
  activeStatus: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  activeStatusText: { color: COLORS.muted, fontSize: 10, textAlign: "right" },
  primaryButton: { flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: COLORS.cyan, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10 },
  secondaryButton: { backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: `${COLORS.red}60` },
  primaryButtonText: { color: COLORS.background, fontSize: 11, fontWeight: "800" },
  envCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10 },
  envCardSelected: { borderColor: "#315A78" },
  envCardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  envTitleWrap: { flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 },
  envIcon: { width: 37, height: 37, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  envName: { color: COLORS.text, fontSize: 13, fontWeight: "800", textAlign: "right" },
  envSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 3, textAlign: "right" },
  specRow: { flexDirection: "row-reverse", alignItems: "center", gap: 11, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  spec: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  specText: { color: COLORS.muted, fontSize: 10 },
  generation: { marginLeft: "auto", color: COLORS.dim, fontSize: 10 },
  cardFooter: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  lastUsed: { color: COLORS.dim, fontSize: 10, textAlign: "right" },
  runButton: { flexDirection: "row-reverse", gap: 5, alignItems: "center", backgroundColor: COLORS.cyan, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  stopButton: { backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: `${COLORS.red}70` },
  runButtonText: { color: COLORS.background, fontSize: 10, fontWeight: "800" },
  footerNote: { color: COLORS.dim, fontSize: 10, textAlign: "center", marginTop: 18, marginBottom: 6 },
  templateList: { gap: 10 },
  templateCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 15 },
  templateTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vendorBadge: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  vendorText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  templateName: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 12, textAlign: "right" },
  templateGeneration: { color: COLORS.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  templateSpecs: { flexDirection: "row-reverse", gap: 7, marginTop: 15 },
  templateSpec: { color: COLORS.muted, backgroundColor: COLORS.surfaceSoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6, fontSize: 10, flex: 1, textAlign: "center" },
  templateBottom: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  templateMemory: { color: COLORS.dim, fontSize: 10 },
  useTemplate: { fontSize: 10, fontWeight: "800" },
  infoCard: { flexDirection: "row-reverse", gap: 10, alignItems: "flex-start", backgroundColor: COLORS.cyanSoft, borderRadius: 14, padding: 13, marginTop: 18 },
  infoText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "right" },
  storageSummary: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.surfaceRaised, borderRadius: 20, padding: 18, marginBottom: 26 },
  summaryLabel: { color: COLORS.muted, fontSize: 11, textAlign: "right" },
  summaryValue: { color: COLORS.text, fontSize: 31, fontWeight: "800", marginTop: 4, textAlign: "right" },
  summaryUnit: { color: COLORS.cyan, fontSize: 13, fontWeight: "700" },
  storageRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: COLORS.cyan, borderRightColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  ringText: { color: COLORS.cyan, fontSize: 14, fontWeight: "800" },
  iconButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.cyanSoft, alignItems: "center", justifyContent: "center" },
  fileList: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14 },
  fileRow: { flexDirection: "row-reverse", alignItems: "center", gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  fileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fileCopy: { flex: 1 },
  fileName: { color: COLORS.text, fontSize: 12, fontWeight: "700", textAlign: "right" },
  fileType: { color: COLORS.dim, fontSize: 10, marginTop: 3, textAlign: "right" },
  uploadCard: { alignItems: "center", backgroundColor: COLORS.surfaceSoft, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed", padding: 20, marginTop: 18 },
  uploadTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginTop: 9 },
  uploadBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 5 },
  outlineButton: { borderWidth: 1, borderColor: COLORS.cyan, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, marginTop: 15 },
  outlineButtonText: { color: COLORS.cyan, fontSize: 11, fontWeight: "800" },
  exeReport: { backgroundColor: COLORS.surface, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  exeReportHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  exeReportTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800", textAlign: "right" },
  reportBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  reportBadgeText: { fontSize: 9, fontWeight: "800" },
  exeReportMessage: { color: COLORS.muted, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 11 },
  exeMetaRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  exeMeta: { color: COLORS.dim, fontSize: 10 },
  runExeButton: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.cyan, borderRadius: 10, paddingVertical: 10, marginTop: 14 },
  runExeText: { color: COLORS.background, fontSize: 11, fontWeight: "800" },
  runMessage: { color: COLORS.orange, fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 9 },
  errorBanner: { flexDirection: "row-reverse", alignItems: "center", gap: 8, backgroundColor: `${COLORS.red}14`, borderWidth: 1, borderColor: `${COLORS.red}50`, borderRadius: 12, padding: 11, marginTop: 14 },
  errorText: { flex: 1, color: COLORS.red, fontSize: 11, textAlign: "right" },
  settingsGroup: { marginBottom: 24 },
  groupLabel: { color: COLORS.cyan, fontSize: 10, letterSpacing: 1.2, fontWeight: "800", textAlign: "right", marginBottom: 9 },
  settingRow: { flexDirection: "row-reverse", alignItems: "center", gap: 11, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 14, paddingHorizontal: 12 },
  settingIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.surfaceSoft, alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1 },
  settingTitle: { color: COLORS.text, fontSize: 12, fontWeight: "700", textAlign: "right" },
  settingSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4, textAlign: "right" },
  toggleOn: { width: 40, height: 23, borderRadius: 12, backgroundColor: COLORS.cyanSoft, padding: 3, alignItems: "flex-start" },
  toggleKnob: { width: 17, height: 17, borderRadius: 9, backgroundColor: COLORS.cyan },
  aboutCard: { alignItems: "center", backgroundColor: COLORS.surfaceRaised, borderRadius: 20, padding: 22 },
  aboutLogo: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.cyan, padding: 10, flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 10 },
  aboutTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", letterSpacing: 1.5 },
  aboutVersion: { color: COLORS.cyan, fontSize: 10, marginTop: 5 },
  aboutBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 12 },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 74, backgroundColor: "#0B1829", borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 10 },
  navItem: { alignItems: "center", justifyContent: "center", gap: 4, minWidth: 64, height: 54, borderRadius: 13 },
  navItemActive: { backgroundColor: COLORS.cyanSoft },
  navLabel: { color: COLORS.dim, fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: COLORS.cyan },
  modalBackdrop: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surfaceRaised, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, borderWidth: 1, borderColor: COLORS.border },
  modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: COLORS.dim, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800", textAlign: "right" },
  inputLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", textAlign: "right", marginBottom: 8, marginTop: 11 },
  input: { backgroundColor: COLORS.surfaceSoft, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, color: COLORS.text, height: 45, paddingHorizontal: 13, fontSize: 13 },
  chipRow: { flexDirection: "row-reverse", gap: 7, paddingVertical: 1 },
  choiceChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9 },
  choiceChipText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  choiceRow: { flexDirection: "row-reverse", gap: 7 },
  resourceChoice: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, paddingVertical: 10, alignItems: "center" },
  resourceChoiceActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanSoft },
  resourceChoiceText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  resourceChoiceTextActive: { color: COLORS.cyan },
  coresRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  stepper: { flexDirection: "row-reverse", alignItems: "center", gap: 13, backgroundColor: COLORS.surfaceSoft, borderRadius: 10, padding: 4 },
  stepButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.cyanSoft, alignItems: "center", justifyContent: "center" },
  stepValue: { color: COLORS.text, fontSize: 14, fontWeight: "800", minWidth: 15, textAlign: "center" },
  createButton: { height: 48, backgroundColor: COLORS.cyan, borderRadius: 13, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22 },
  createButtonDisabled: { backgroundColor: COLORS.surfaceSoft },
  createButtonText: { color: COLORS.background, fontSize: 13, fontWeight: "800" },
});
