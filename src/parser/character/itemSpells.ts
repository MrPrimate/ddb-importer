/**
 * Spells granted by magic items are cast through a `cast` activity on the item that points
 * at the spell document in the spells compendium (dnd5e materialises the character's copy
 * from that link). The inventory parse can only build the link when the compendium holds the
 * spell, so before the items are parsed this step finds every item spell the character
 * carries that the compendium lacks and either munches it there (a GM can write compendia)
 * or stops the import with the list of spells and source books the GM needs to munch.
 */

import type { NotifierV1Props } from "../../apps/DDBAppV2";
import { CompendiumHelper, DDBItemImporter, DDBSources, logger } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import DDBItem from "../item/DDBItem";

type TItemSpellsNotifier = (note: any, opts?: NotifierV1Props) => void;

function definitionIdOf(spell: I5eSpellItem): number | null {
  const id = spell.flags?.ddbimporter?.definitionId;
  return typeof id === "number" ? id : null;
}

/** Item spells whose definition has no document in the spells compendium, one per definition. */
export function findMissingItemSpells(itemSpells: I5eSpellItem[], spellCompendium: { index?: Iterable<any> } | null | undefined): I5eSpellItem[] {
  const indexed = new Set<number>();
  for (const entry of spellCompendium?.index ?? []) {
    const id = foundry.utils.getProperty(entry, "flags.ddbimporter.definitionId");
    if (typeof id === "number") indexed.add(id);
  }
  const missing = new Map<number, I5eSpellItem>();
  for (const spell of itemSpells) {
    const id = definitionIdOf(spell);
    if (id === null || indexed.has(id) || missing.has(id)) continue;
    missing.set(id, spell);
  }
  return [...missing.values()];
}

/** The spells and the books a GM has to munch, for the import dialog. */
export function describeMissingItemSpells(missing: I5eSpellItem[]): string {
  const books = new Set<string>();
  const lines = missing.map((spell) => {
    const book = DDBSources.getDocumentSourceBookName(spell);
    books.add(book);
    const item = spell.flags?.ddbimporter?.dndbeyond?.lookupName;
    return `${spell.flags?.ddbimporter?.originalName ?? spell.name}${item ? ` (${item})` : ""} from ${book}`;
  });
  return `The spells compendium is missing ${missing.length} spell(s) this character's items cast: ${lines.join("; ")}. `
    + `Ask the GM to munch spells from: ${[...books].sort().join(", ")}.`;
}

/**
 * The raw DDB entries behind the missing item spells, so the compendium receives the same
 * generic spell documents the spell muncher would write rather than item-flavoured copies.
 */
function rawEntriesFor(ddb: IDDBData, missing: I5eSpellItem[]): IDDBSpellEntry[] {
  const wanted = new Set(missing.map(definitionIdOf));
  const entries = new Map<number, IDDBSpellEntry>();
  for (const entry of [...(ddb.character.spells.item ?? []), ...((ddb as any).unequippedItemSpells ?? [])]) {
    const id = entry.definition?.id;
    if (id === undefined || !wanted.has(id) || entries.has(id)) continue;
    entries.set(id, entry);
  }
  return [...entries.values()];
}

/**
 * Munch the missing item spells into the spells compendium the way the spell muncher does
 * (generic parse, folders, index refresh). Throws when the write cannot happen.
 */
async function munchMissingItemSpells(ddb: IDDBData, missing: I5eSpellItem[], {
  notifier = null,
  generateSummons = null,
}: { notifier?: TItemSpellsNotifier | null; generateSummons?: boolean | null } = {}): Promise<void> {
  const entries = rawEntriesFor(ddb, missing);
  if (notifier) notifier(`Adding ${entries.length} missing item spell(s) to the spells compendium`, { nameField: true });
  const documents = await GenericSpellFactory.getSpells(entries, null, generateSummons);
  const handler = new DDBItemImporter("spells", documents, {
    matchFlags: ["is2014", "is2024"],
    notifier: notifier ?? undefined,
  });
  await handler.init();
  await handler.iconAdditions();
  await handler.compendiumFolders.loadCompendium("spells", true);
  await handler.compendiumFolders.createSpellFoldersForDocuments({ documents: handler.documents });
  await handler.updateCompendium(false);
  // the cast lookup reads definitionId off the cached index, which the write does not refresh
  await DDBItem.prepareSpellCompendiumIndex();
}

/**
 * Make sure every item spell the character carries exists in the spells compendium before
 * the inventory parse links them. A GM munches the missing ones on the spot; anyone else is
 * told which books the GM must munch, because the import would otherwise silently lose the
 * item's spells.
 */
export async function ensureItemSpellsInCompendium(ddb: IDDBData, itemSpells: I5eSpellItem[], {
  notifier = null,
  generateSummons = null,
}: { notifier?: TItemSpellsNotifier | null; generateSummons?: boolean | null } = {}): Promise<void> {
  if (itemSpells.length === 0) return;
  const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);
  if (!spellCompendium) {
    throw new Error("No spells compendium is configured, so this character's item spells cannot be linked. Check the compendium settings.");
  }
  await DDBItem.prepareSpellCompendiumIndex();
  const missing = findMissingItemSpells(itemSpells, spellCompendium);
  if (missing.length === 0) return;

  const description = describeMissingItemSpells(missing);
  if (!game.user?.isGM) throw new Error(description);

  logger.info(`Munching ${missing.length} item spell(s) missing from the spells compendium`, { missing: missing.map((s) => s.name) });
  await munchMissingItemSpells(ddb, missing, { notifier, generateSummons });

  const stillMissing = findMissingItemSpells(itemSpells, CompendiumHelper.getCompendiumType("spells", false));
  if (stillMissing.length > 0) {
    throw new Error(`${describeMissingItemSpells(stillMissing)} (The automatic munch did not add them; munch spells from the Muncher and import again.)`);
  }
}
