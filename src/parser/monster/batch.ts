/**
 * The monsters of the munch in progress, by name. A monster that summons another is often parsed
 * before the creature it calls has reached the compendium; a munched monster's compendium id is
 * built from its name and D&D Beyond id, so knowing the batch is enough to link it ahead of time.
 * Leaf module: the monster factory writes it and the summon linker reads it.
 */

interface IBatchMonster {
  id: number;
  name: string;
  isLegacy: boolean;
}

const batch = new Map<string, IBatchMonster[]>();
const batchById = new Map<number, IBatchMonster>();

export function setMonsterBatch(monsters: { id: number; name: string; isLegacy?: boolean }[]): void {
  batch.clear();
  batchById.clear();
  for (const monster of monsters) {
    batchById.set(Number(monster.id), { id: monster.id, name: monster.name, isLegacy: Boolean(monster.isLegacy) });
    const key = `${monster.name ?? ""}`.toLowerCase();
    if (!key) continue;
    const entries = batch.get(key) ?? [];
    entries.push({ id: monster.id, name: monster.name, isLegacy: Boolean(monster.isLegacy) });
    batch.set(key, entries);
  }
}

/** The batch's monster of this name, preferring the printing that matches the summoner's rules. */
export function findInMonsterBatch(name: string, is2024: boolean): IBatchMonster | null {
  const entries = batch.get(name.toLowerCase()) ?? [];
  return entries.find((entry) => entry.isLegacy !== is2024) ?? entries[0] ?? null;
}

/** The batch's monster with this D&D Beyond id, for a creature the text links to directly. */
export function findInMonsterBatchById(id: number): IBatchMonster | null {
  return batchById.get(Number(id)) ?? null;
}
