export type CheatId =
  | 'happilymarried'
  | 'nefesal'
  | 'sakinol'
  | 'iddqd'
  | 'gulumse'
  | 'sabir999'
  | 'hizliates'
  | 'kosgelin'
  | 'dugunvakti'
  | 'konserde'
  | 'denizfeneri'
  | 'bali'
  | 'dubai'
  | 'baloncu'
  | 'help';

export type CheatCategory = 'anxiety' | 'combat' | 'level' | 'map' | 'meta';

export interface CheatDefinition {
  id: CheatId;
  code: string;
  description: string;
  category: CheatCategory;
  toggle?: boolean;
}

export const CHEAT_REGISTRY: readonly CheatDefinition[] = [
  {
    id: 'happilymarried',
    code: 'happilymarried',
    description: 'Düğün epiloguna ışınlan',
    category: 'map',
  },
  {
    id: 'nefesal',
    code: 'nefesal',
    description: 'Anksiyeteyi %0’a indir',
    category: 'anxiety',
  },
  {
    id: 'sakinol',
    code: 'sakinol',
    description: 'Anksiyete artmaz; kaybetme devre dışı',
    category: 'anxiety',
  },
  {
    id: 'iddqd',
    code: 'iddqd',
    description: 'God mode: anksiyete kilitli + temas/flaş/düşme hasarı yok',
    category: 'anxiety',
  },
  {
    id: 'gulumse',
    code: 'gulumse',
    description: 'Ekrandaki tüm düşmanları öldür',
    category: 'combat',
  },
  {
    id: 'sabir999',
    code: 'sabir999',
    description: 'Silah hasarı ×10',
    category: 'combat',
    toggle: true,
  },
  {
    id: 'hizliates',
    code: 'hizliates',
    description: 'Silah bekleme süresi yok',
    category: 'combat',
    toggle: true,
  },
  {
    id: 'kosgelin',
    code: 'kosgelin',
    description: '60 saniye süper hız',
    category: 'combat',
  },
  {
    id: 'dugunvakti',
    code: 'dugunvakti',
    description: 'Aktif bölümü atla',
    category: 'level',
  },
  {
    id: 'konserde',
    code: 'konserde',
    description: 'Müzik Salonu, level 1',
    category: 'map',
  },
  {
    id: 'denizfeneri',
    code: 'denizfeneri',
    description: 'Deniz Feneri, level 1',
    category: 'map',
  },
  {
    id: 'bali',
    code: 'bali',
    description: 'Bali Adası, level 1',
    category: 'map',
  },
  {
    id: 'dubai',
    code: 'dubai',
    description: 'Dubai Lüks Villa, keşif',
    category: 'map',
  },
  {
    id: 'baloncu',
    code: 'baloncu',
    description: 'Tüm balonları patlat',
    category: 'combat',
  },
  {
    id: 'help',
    code: 'help',
    description: 'Tüm cheat kodlarını listeler',
    category: 'meta',
  },
] as const;

const CHEAT_BY_CODE = new Map(
  CHEAT_REGISTRY.map((cheat) => [cheat.code, cheat.id] as const),
);

export function resolveCheat(command: string): CheatId | null {
  const key = command.trim().toLowerCase();
  if (!key) return null;
  return CHEAT_BY_CODE.get(key) ?? null;
}

/** Full cheat list for the in-console help editor. */
export function getCheatHelpEditorText(): string {
  const lines = [
    'cheat_codes.txt',
    '────────────────────────────',
    'Konsol: " tuşu · Enter çalıştır · Esc kapat',
    '',
  ];

  for (const cheat of CHEAT_REGISTRY) {
    if (cheat.id === 'help') continue;
    const toggle = cheat.toggle ? '  [toggle]' : '';
    const pad = cheat.code.padEnd(16, ' ');
    lines.push(`${pad}${cheat.description}${toggle}`);
  }

  lines.push('');
  lines.push('help              Bu listeyi aç / kapat');
  return lines.join('\n');
}
