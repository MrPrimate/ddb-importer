import { logger, utils } from "../../../lib/_module";
import { decryptAndQuery } from "../../../lib/SqliteCipher";
import { bookLorePatch, splitBookMonsterSections } from "../../../parser/monster/bookLore";
import BookData from "./BookData";

// DDB's entity type id for monsters, as on the API's `entityTypeId`
const MONSTER_ENTITY_TYPE_ID = 779871897;

const MONSTER_SECTIONS_QUERY = `SELECT EntityID as entityId, CAST(Text AS TEXT) as text FROM HTMLDescription
  WHERE EntityTypeID = ${MONSTER_ENTITY_TYPE_ID} ORDER BY EntityID, DisplayOrder`;

// one load per book until the cache is cleared (DDBMonsterFactory clears it once a munch has
// applied the lore), shared by concurrent calls; a book the account cannot open caches as empty
// so the same munch does not retry the download
const bookCache = new Map<number, Promise<Map<number, IBookMonsterSections>>>();

/**
 * Downloads and decrypts a book, and reads the page sections of every monster in it.
 * @param sourceId the DDB source (book) id
 * @returns the sections by DDB monster id; empty when the book cannot be opened
 */
async function loadBook(sourceId: number): Promise<Map<number, IBookMonsterSections>> {
  const result = new Map<number, IBookMonsterSections>();
  let book: AcquiredBook | null = null;
  try {
    book = await BookData.acquire(sourceId);
    const rows = (await decryptAndQuery(book.db3Bytes, book.key, MONSTER_SECTIONS_QUERY)) as unknown as { entityId: number; text: string | null }[];
    const parts = new Map<number, string[]>();
    for (const row of rows) {
      const list = parts.get(row.entityId) ?? [];
      list.push(row.text ?? "");
      parts.set(row.entityId, list);
    }
    for (const [id, texts] of parts) {
      result.set(id, splitBookMonsterSections(texts));
    }
    logger.info(`Book monster lore: read ${result.size} monsters from ${book.bookCode} (source ${sourceId})`);
  } catch (error) {
    logger.warn(`Book monster lore: could not read source ${sourceId}, its monsters keep the API text`, error);
  } finally {
    await book?.zip.close();
  }
  return result;
}

function getBook(sourceId: number): Promise<Map<number, IBookMonsterSections>> {
  let entry = bookCache.get(sourceId);
  if (!entry) {
    entry = loadBook(sourceId);
    bookCache.set(sourceId, entry);
  }
  return entry;
}

/** Drops the loaded books' sections to free their memory; the next import downloads them again. */
export function clearBookMonsterLoreCache(): void {
  bookCache.clear();
}

/**
 * Adds the lore that the monster API leaves out, read from each monster's book. A book is only
 * downloaded when at least one of its monsters in the batch has no `characteristicsDescription`;
 * books whose monsters all carry API text (most third-party books) are never fetched.
 * @param monsters monsters as fetched from the API
 * @param notifier optional progress message callback
 * @returns the monsters, patched copies where the book added text
 */
export async function applyBookMonsterLore(
  monsters: IDDBMonsterSourceData[],
  notifier?: (message: string) => void,
): Promise<IDDBMonsterSourceData[]> {
  const sourceIds = [...new Set(monsters
    .filter((monster) => !monster.isHomebrew && utils.stripHtml(monster.characteristicsDescription ?? "").trim() === "")
    .map((monster) => monster.sourceId)
    .filter((id): id is number => typeof id === "number" && id > 0))];
  if (sourceIds.length === 0) return monsters;

  const books = new Map<number, Map<number, IBookMonsterSections>>();
  for (const sourceId of sourceIds) {
    notifier?.(`Reading monster lore from book ${sourceId}...`);
    books.set(sourceId, await getBook(sourceId));
  }
  notifier?.("");

  let patched = 0;
  const result = monsters.map((monster) => {
    const sections = monster.sourceId ? books.get(monster.sourceId)?.get(monster.id) : undefined;
    const patch = sections ? bookLorePatch(monster, sections) : null;
    if (!patch) return monster;
    patched++;
    // copies, so the fetched objects (which the proxy cache may share) stay untouched
    return { ...monster, ...patch };
  });
  logger.info(`Book monster lore: added book text to ${patched} of ${monsters.length} monsters`);
  return result;
}
