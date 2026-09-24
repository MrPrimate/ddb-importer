import { SYSTEM_ICON_PRESETS } from "./systemIconPresets";

/** Bright enough to read on maps; acid and poison remain visually distinct. */
const DAMAGE_COLORS: Readonly<Record<string, string>> = {
  acid: "#80ff00",
  bludgeoning: "#c99b6b",
  cold: "#80ddff",
  fire: "#ff4500",
  force: "#b878ff",
  lightning: "#40bfff",
  necrotic: "#70b060",
  piercing: "#c0d0e0",
  poison: "#b060ff",
  psychic: "#ff50bb",
  radiant: "#ffe060",
  slashing: "#ef6060",
  thunder: "#909fff",
};

const STATUS_COLORS: Readonly<Record<string, string>> = {
  bleeding: "#ed4055",
  blinded: "#a090c0",
  bloodied: "#e04444",
  burning: "#ff6500",
  burrowing: "#bf9860",
  charmed: "#ff70c0",
  concentrating: "#70a0ff",
  coverHalf: "#9caebf",
  coverThreeQuarters: "#8098b0",
  coverTotal: "#607c98",
  cursed: "#bb60df",
  dead: "#a0a0ad",
  deafened: "#b8a0df",
  dehydration: "#dfb060",
  diseased: "#a0b850",
  dodging: "#50d0b0",
  encumbered: "#cfad70",
  ethereal: "#90dddf",
  exceedingCarryingCapacity: "#df8050",
  exhaustion: "#b09c70",
  falling: "#ffb050",
  flying: "#80d0ff",
  frightened: "#ca70ff",
  grappled: "#e0a060",
  heavilyEncumbered: "#d89860",
  hiding: "#8898c0",
  hovering: "#90dfe0",
  incapacitated: "#dfa080",
  invisible: "#a0e0ef",
  malnutrition: "#cfb878",
  marked: "#ff6070",
  paralyzed: "#ffdc60",
  petrified: "#b0b8c0",
  poisoned: "#b060ff",
  prone: "#dfa060",
  restrained: "#d0a060",
  silenced: "#b090df",
  sleeping: "#90a0df",
  stable: "#70d090",
  stunned: "#ffe060",
  suffocation: "#80a0cf",
  surprised: "#ffc060",
  transformed: "#60dfb0",
  unconscious: "#9090cf",
};

/** Read at use time: the system config is populated after module evaluation. No artwork is copied. */
export function systemIcons(
  source = (globalThis as unknown as { CONFIG?: { DND5E?: ISystemIconSources } }).CONFIG?.DND5E,
): ISystemIcon[] {
  if (!source) return [];
  const entries: ISystemIcon[] = [];
  const add = (category: ISystemIcon["category"], definitions: Record<string, ISystemIconDefinition>) => {
    for (const [id, definition] of Object.entries(definitions).sort(([a], [b]) => a.localeCompare(b))) {
      const path = definition.img || definition.icon;
      if (!path) continue;
      entries.push({
        id,
        category,
        path,
        name: definition.name || definition.label || id,
        color: (category === "damage" ? DAMAGE_COLORS : STATUS_COLORS)[id] ?? "#a0b0df",
      });
    }
  };
  add("damage", source.damageTypes ?? {});
  add("status", {
    ...source.conditionTypes,
    ...source.statusEffects,
    ...source.encumbrance?.effects,
    ...(source.bloodied ? { bloodied: source.bloodied } : {}),
  });
  return entries;
}

/** Retain shipped ids even when a future system removes or hides a configured status. */
export function stableSystemIcons({ includeAdditional = false } = {}): ISystemIcon[] {
  const icons = new Map(
    SYSTEM_ICON_PRESETS.map((icon) => [
      `${icon.category}-${icon.id}`,
      {
        ...icon,
        color: (icon.category === "damage" ? DAMAGE_COLORS : STATUS_COLORS)[icon.id],
      },
    ]),
  );
  for (const icon of systemIcons()) {
    const key = `${icon.category}-${icon.id}`;
    const preset = icons.get(key);
    if (!preset && !includeAdditional) continue;
    icons.set(key, { ...preset, ...icon, fallbackName: preset?.name === icon.name ? preset.fallbackName : icon.name });
  }
  return [...icons.values()];
}
