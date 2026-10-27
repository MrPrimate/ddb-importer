import { logger, FileHelper, MuncherSettings } from "../lib/_module";
import { restoreParkedUuids } from "../muncher/adventure/MetaRegions";
import { behaviorUuid, walkSceneUuids } from "../lib/SceneUuids";

interface IExportNotePin {
  index: number;
  pageId: string | null;
  texture: NoteDocument["texture"];
  label: string | undefined;
  flags: { ddb: I5eJournalPageFlags };
  levels: string[];
  iconSize: NoteDocument["iconSize"];
  textColor: NoteDocument["textColor"];
  textAnchor: NoteDocument["textAnchor"];
  x: number;
  y: number;
}

interface IExportNoteGroup {
  label: string | undefined;
  texture: NoteDocument["texture"];
  flags: { ddb: I5eJournalPageFlags | { noLink: boolean } };
  levels: string[];
  index: number;
  iconSize: NoteDocument["iconSize"];
  textColor: NoteDocument["textColor"];
  textAnchor: NoteDocument["textAnchor"];
  positions: { x: number; y: number }[];
}

// unlinked user-placed notes have no journal, so no index to group or sort on
type TExportNoteUnlinked = Omit<IExportNoteGroup, "index">;


/**
 * Extracts all notes that have been placed by ddb-importer
 * Creates the expected data structure for the database by
 * getting the real label from the appropriate Journal Entry
 * @param {Scene} scene The scene to extract the notes from
 * @param {string} bookCode The bookCode to filter the journal entries by
 * @returns {object[]} An array of extracted notes, each containing the keys:
 *  - label: The label of the note
 *  - flags: The flags of the note
 *  - texture: The texture of the note
 *  - positions: An array of positions the note has been placed at
 *  - iconSize: The size of the icon
 *  - iconTint: The tint of the icon
 *  - textColor: The color of the text
 *  - textAnchor: The anchor of the text
 */
function getNotes(scene: Scene, bookCode: string) {
  // get all notes in the Journal related to this scene
  const relatedJournalEntries = game.journal.filter((journal) =>
    !!journal.flags.ddb?.bookCode && journal.flags.ddb.bookCode === bookCode,
  );

  // get all notes placed on the map
  const journalNotes = scene.notes!
    // the user might have placed a note, unless it is based on an imported Journal Entry, we will not carry
    // that one over
    .filter((note: NoteDocument) => relatedJournalEntries.some((journal) => journal.id === note.entryId))
    .map((note: NoteDocument): IExportNotePin => {
      const journal = relatedJournalEntries.find((journal) => journal.id === note.entryId);
      // the preceding filter only keeps notes whose entryId matches a related journal
      if (!journal) throw new Error(`No journal entry found for note ${note.id}`);
      const page = note.pageId
        ? journal.pages?.find((page: JournalEntryPage) => page._id === note.pageId)
        : journal;
      if (!page) throw new Error(`No journal page found for note ${note.id} (pageId ${note.pageId})`);
      const index = parseInt(journal.flags.ddb?.ddbId ?? "");
      // removed un-needed userdata
      const pageFlags = page.flags.ddb;
      const noteFlags = note.flags.ddb;
      const flags: I5eJournalPageFlags = foundry.utils.duplicate(pageFlags);
      foundry.utils.mergeObject(flags, noteFlags, { overwrite: true, insertKeys: true, insertValues: true });
      if (flags?.userData) delete flags.userData;
      const label = flags?.labelName && flags.labelName.trim() !== ""
        ? flags.labelName
        : noteFlags?.slugLink && noteFlags.slugLink.trim() !== ""
          ? note.text
          : page.name;

      logger.warn("note details", {
        note,
        page,
        icon: note.texture.src,
        journal,
        flags,
        pageFlags,
        noteFlags,
        label,
      });

      return {
        index,
        pageId: page._id,
        texture: exportNoteTexture(note),
        label,
        flags: {
          ddb: exportNoteFlags(flags as Record<string, any>),
        },
        levels: Array.from(note.levels ?? []),
        iconSize: note.iconSize,
        textColor: note.textColor,
        textAnchor: note.textAnchor,
        x: note.x,
        y: note.y,
      };
    })
    .reduce((notes: (IExportNoteGroup & { pageId?: string | null })[], note: IExportNotePin) => {
      const idx = notes.find((n) => n.index === note.index && n.pageId === note.pageId && note.label === n.label);
      if (idx) {
        idx.positions.push({ x: note.x, y: note.y });
      } else {
        const n = {
          label: note.label,
          texture: note.texture,
          flags: note.flags,
          levels: note.levels,
          index: note.index,
          iconSize: note.iconSize,
          textColor: note.textColor,
          textAnchor: note.textAnchor,
          positions: [{ x: note.x, y: note.y }],
        };
        notes.push(n);
      }
      return notes;
    }, [])
    .sort((a: IExportNoteGroup, b: IExportNoteGroup) => {
      return a.index - b.index;
    });

  const unLinkedNotes: TExportNoteUnlinked[] = scene.notes!
    .filter((note: NoteDocument) => !note.entryId)
    .map((note: NoteDocument): TExportNoteUnlinked => ({
      label: note.text,
      texture: exportNoteTexture(note),
      flags: { ddb: {
        noLink: true,
      } },
      levels: Array.from(note.levels ?? []),
      iconSize: note.iconSize,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
      positions: [{ x: note.x, y: note.y }],
    }));

  const notes = [...journalNotes, ...unLinkedNotes]
    .map((note: TExportNoteUnlinked) => ({
      label: note.label,
      flags: note.flags,
      levels: note.levels,
      texture: note.texture,
      positions: note.positions,
      iconSize: note.iconSize,
      textColor: note.textColor,
      textAnchor: note.textAnchor,
    }));

  return notes;
}

/**
 * Regions placed while playing (dnd5e activity templates, token-attached auras) belong to the session,
 * not the map, and must not be exported into meta-data.
 */
function isRuntimeRegion(region: any): boolean {
  return !!foundry.utils.getProperty(region, "flags.dnd5e.activity") || !!region?.attachment?.token;
}

function exportRegions(scene: Scene): any[] {
  return ((scene._source.regions ?? []) as any[])
    .filter((region) => !isRuntimeRegion(region))
    .map((region) => {
      const copy = foundry.utils.deepClone(region);
      // per-world data (users, timestamps) and import-side bookkeeping mean nothing in another world
      delete copy._stats;
      delete copy.ownership;
      if (copy.flags?.ddbimporter) {
        delete copy.flags.ddbimporter.copiedFrom;
        delete copy.flags.ddbimporter.source;
        delete copy.flags.ddbimporter.metaRegionId;
        if (Object.keys(copy.flags.ddbimporter).length === 0) delete copy.flags.ddbimporter;
      }
      for (const behavior of copy.behaviors ?? []) {
        delete behavior._stats;
        // a destination the import could not place is parked off the system data; the meta file keeps it
        restoreParkedUuids(behavior);
        if (behavior.flags?.ddbimporter) {
          delete behavior.flags.ddbimporter.unresolvedUuids;
          delete behavior.flags.ddbimporter.resolvedUuids;
          delete behavior.flags.ddbimporter.disabledUnresolved;
          if (Object.keys(behavior.flags.ddbimporter).length === 0) delete behavior.flags.ddbimporter;
        }
      }
      return copy;
    });
}

/**
 * The region UUIDs a behaviour's system data points at, in absolute form: `origin` is the behaviour's
 * UUID, which the relative UUIDs Foundry stores for same-scene targets are read against.
 */
function collectRegionUuids(system: any, origin: string | null): { uuid: string; parsed: IMetaSceneUuid }[] {
  const out: { uuid: string; parsed: IMetaSceneUuid }[] = [];
  walkSceneUuids(foundry.utils.deepClone(system ?? {}), (uuid, parsed) => {
    if (parsed.type === "Region") out.push({ uuid, parsed });
    return uuid;
  }, { origin });
  return out;
}

function sceneLink(target: Scene, regionId?: string): IMetaRegionLink | null {
  const ddb = (target.flags as any)?.ddb ?? {};
  if (!ddb.bookCode || (!ddb.contentChunkId && ddb.ddbId == null)) return null;
  return {
    bookCode: ddb.bookCode,
    contentChunkId: ddb.contentChunkId ?? null,
    ddbId: ddb.ddbId ?? null,
    regionId: regionId ?? null,
    sceneName: target.name ?? null,
  };
}

/**
 * Links from this scene's regions and stairways to other scenes, keyed by the author-world UUID (region
 * targets) or scene id (stairways), so the importer can find the matching world scene by its DDB ids.
 * Also lists the targets that cannot be followed: ones that resolve nowhere in this world, and scenes
 * without DDB ids to match on.
 */
export function collectSceneLinks(scene: Scene): { links: Record<string, IMetaRegionLink>; problems: string[] } {
  const links: Record<string, IMetaRegionLink> = {};
  const problems: string[] = [];

  // destinations the import parked keep the link they arrived with, so a re-import can still place them
  const parkedLinks = new Map<string, IMetaRegionLink>();
  for (const region of (scene._source.regions ?? []) as any[]) {
    for (const behavior of region.behaviors ?? []) {
      const parked = (foundry.utils.getProperty(behavior, "flags.ddbimporter.unresolvedUuids") ?? []) as IMetaUnresolvedUuid[];
      for (const entry of Array.isArray(parked) ? parked : []) {
        if (entry.link) parkedLinks.set(entry.uuid, entry.link);
      }
    }
  }

  for (const region of exportRegions(scene)) {
    for (const behavior of region.behaviors ?? []) {
      const origin = scene.id && region._id && behavior._id ? behaviorUuid(scene.id, region._id, behavior._id) : null;
      for (const { uuid, parsed: { sceneId, id: regionId } } of collectRegionUuids(behavior.system, origin)) {
        const label = `${region.name || "Region"} / ${behavior.name || behavior.type}`;
        if (!fromUuidSync(uuid)) {
          const parkedLink = parkedLinks.get(uuid);
          if (parkedLink) {
            links[uuid] = parkedLink;
            problems.push(`${label}: ${uuid} was never placed in this world (kept its link to "${parkedLink.sceneName ?? parkedLink.contentChunkId ?? parkedLink.ddbId}")`);
          } else {
            problems.push(`${label}: ${uuid} does not exist in this world`);
          }
          continue;
        }
        if (sceneId === scene.id) continue;
        const target = game.scenes?.get(sceneId) as Scene | undefined;
        const link = target ? sceneLink(target, regionId) : null;
        if (link) links[uuid] = link;
        else problems.push(`${label}: target scene "${target?.name ?? sceneId}" has no DDB ids to match on`);
      }
    }
  }

  const stairways = (scene.flags as any)?.stairways;
  const stairs: any[] = Array.isArray(stairways) ? stairways : (stairways?.data ?? []);
  for (const stair of stairs) {
    const sceneId = stair?.scene;
    if (!sceneId || sceneId === scene.id || links[sceneId]) continue;
    const target = game.scenes?.get(sceneId) as Scene | undefined;
    const link = target ? sceneLink(target) : null;
    if (link) links[sceneId] = link;
    else problems.push(`Stairway "${stair.name ?? ""}": target scene "${target?.name ?? sceneId}" ${target ? "has no DDB ids to match on" : "does not exist in this world"}`);
  }

  return { links, problems };
}

/** Ask before exporting a scene whose region or stairway links cannot be followed. */
export async function confirmSceneLinks(scene: Scene): Promise<boolean> {
  const { problems } = collectSceneLinks(scene);
  const identity = exportSceneDdbId(scene);
  if (identity.problem) problems.unshift(identity.problem);
  if (problems.length === 0) return true;
  logger.warn(`Scene "${scene.name}" export: ${problems.length} link(s) cannot be followed`, problems);
  const list = problems.map((p) => `<li>${foundry.utils.escapeHTML(p)}</li>`).join("");
  return !!(await foundry.applications.api.DialogV2.confirm({
    window: { title: "Scene links" },
    content: `<p>${problems.length} region or stairway link(s) on "<strong>${foundry.utils.escapeHTML(scene.name ?? "")}</strong>" cannot be followed after import:</p><ul>${list}</ul><p>Export anyway?</p>`,
    rejectClose: false,
  } as any));
}

// NativeSceneBuilder: scene sort = SCENE_SORT_BASE + row id + muncher-numbered id
const NATIVE_SCENE_SORT_BASE = 100000;
// flags.ddb.source values the native importer stamps on scenes it found in the book html
const NATIVE_DETECTED_SOURCES = new Set(["figure", "div", "viewplayer", "linkfallback"]);
// the flags.ddb keys a meta-data scene file carries (ddb-adventure-muncher load-scenes keeps these);
// notes, tokens, images, links and versions are added below
const EXPORT_DDB_KEYS = ["bookCode", "ddbId", "cobaltId", "parentId", "contentChunkId", "originalLink", "alternateIds", "tiles"];
const EXPORT_MODULE_FLAGS = ["stairways", "perfect-vision", "dynamic-illumination"];

/**
 * The scene's id in the zip muncher's numbering, which meta-data files are keyed on. Scenes from the
 * muncher and from the native importer since it adopted that numbering (they carry flags.ddb.rowId)
 * already hold it. Older native imports held the page row id: take the id of the meta-data file the scene
 * was enriched from, or recover it from the scene's sort (row id + muncher id). Returns a problem when
 * neither works, so the export can say the scene needs a re-import.
 */
export function exportSceneDdbId(scene: Scene): { ddbId: number | string | null; problem?: string } {
  const ddb: Record<string, any> = (scene.flags as any)?.ddb ?? {};
  if (ddb.rowId != null || !NATIVE_DETECTED_SOURCES.has(ddb.source)) return { ddbId: ddb.ddbId ?? null };

  const candidates = [
    foundry.utils.getProperty(scene, "flags.ddbimporter.metaSource"),
    foundry.utils.getProperty(scene, "flags.ddbimporter.metaDataMatch.scene.flags.ddb"),
  ] as ({ contentChunkId?: string | null; ddbId?: number | string | null } | undefined)[];
  for (const candidate of candidates) {
    const id = Number(candidate?.ddbId);
    if (candidate?.contentChunkId === ddb.contentChunkId && Number.isFinite(id)) return { ddbId: id };
  }
  const rowId = Number(ddb.ddbId);
  const fromSort = Number(scene.sort) - NATIVE_SCENE_SORT_BASE - rowId;
  // the muncher numbers detected scenes (10000-14999) + row id; a sort the GM changed falls outside
  if (Number.isInteger(fromSort) && fromSort >= 10000 + rowId && fromSort < 15000 + rowId) return { ddbId: fromSort };
  return {
    ddbId: ddb.ddbId ?? null,
    problem: `Scene id: "${scene.name}" was imported before scene ids followed the adventure muncher; re-import the adventure to export it with the right id`,
  };
}

/** Sort walls and lights into a stable order, so exports differ from a master only where something moved. */
function stableOrder<T>(docs: T[], key: (doc: T) => number[]): T[] {
  return docs
    .map((doc) => ({ doc, k: key(doc), j: JSON.stringify(doc) }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.k.length, b.k.length); i++) {
        const d = (a.k[i] ?? 0) - (b.k[i] ?? 0);
        if (d !== 0) return d;
      }
      return a.j < b.j ? -1 : a.j > b.j ? 1 : 0;
    })
    .map((entry) => entry.doc);
}

/** The scene flags a meta-data file carries, whichever importer built the scene. */
function exportFlags(scene: Scene): I5eSceneDataFlags & Record<string, unknown> {
  const source = foundry.utils.deepClone(scene._source.flags ?? {}) as Record<string, any>;
  const flags: Record<string, any> = {};
  for (const key of EXPORT_MODULE_FLAGS) {
    if (source[key] !== undefined) flags[key] = source[key];
  }
  const ddb: Record<string, any> = {};
  for (const key of EXPORT_DDB_KEYS) {
    if (source.ddb?.[key] !== undefined) ddb[key] = source.ddb[key];
  }
  ddb.ddbId = exportSceneDdbId(scene).ddbId;
  flags.ddb = ddb;
  // import bookkeeping stays behind, but ThirdPartyMunch reads the export choices (actors, compendium) from the file
  flags.ddbimporter = source.ddbimporter?.export ? { export: source.ddbimporter.export } : {};
  return flags as I5eSceneDataFlags & Record<string, unknown>;
}

// the token ddbActorFlags keys ddb-importer and ddb-adventure-muncher read
const EXPORT_ACTOR_FLAG_KEYS = new Set(["id", "name", "keepToken", "tokenImage", "keepAvatar", "avatarImage", "keepItems"]);

// the note flags.ddb keys meta-data files carry; journal page flags such as themeCss stay behind
const EXPORT_NOTE_KEYS = new Set(["ddbId", "bookCode", "slug", "contentChunkId", "parentId", "cobaltId", "img", "note",
  "slugLink", "linkName", "duplicate", "labelName", "linkId", "pin", "noLink", "originDocId", "originHint", "originalLink"]);

function exportNoteFlags(flags: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(flags ?? {}).filter(([key]) => EXPORT_NOTE_KEYS.has(key)));
}

/** A note placed from meta-data keeps the meta file's icon, not the one the importer generated. */
function exportNoteTexture(note: NoteDocument): any {
  const meta = foundry.utils.getProperty(note, "flags.ddbimporter.metaDataNote.texture");
  return meta ?? note.texture;
}

// Prepares the scene data for download
export function collectSceneData(scene: Scene, bookCode: string) {
  const notes = getNotes(scene, bookCode);

  // Export levels from scene, stripping background.src from each
  const levels = scene.levels.map((level) => {
    const l = level.toObject();
    delete l.background?.src;
    return l;
  });

  const walls = stableOrder(scene.walls!.map((wall: WallDocument) => {
    const { _id, ...w } = wall.toObject();
    return w;
  }), (w) => w.c);

  const lights = stableOrder(scene.lights!.map((light: AmbientLightDocument) => {
    const { _id, ...l } = light.toObject();
    return l;
  }), (l) => [l.x, l.y]);

  const fullData = {
    // a copy: the export rewrites flags, which must never touch the live scene
    flags: exportFlags(scene),
    // fvtt-types collapses the schema-derived name to never at this instantiation depth
    name: scene._source.name as string,
    navName: scene._source.navName,
    navOrder: scene._source.navOrder,
    // dimensions
    width: scene._source.width,
    height: scene._source.height,
    shiftX: scene._source.shiftX,
    shiftY: scene._source.shiftY,
    // grid
    grid: scene._source.grid,
    padding: scene._source.padding,
    // initial
    initial: scene._source.initial,
    initialLevel: scene._source.initialLevel,
    // levels
    levels,
    walls,
    drawings: scene._source.drawings,
    weather: scene._source.weather,
    // environment
    tokenVision: scene._source.tokenVision,
    lights,
    regions: exportRegions(scene),
    environment: scene._source.environment,
    fog: {
      mode: scene._source.fog.mode,
      colors: scene._source.fog.colors,
    },
    transition: scene._source.transition,
  };

  // these keys are deleted from the export when the "config" option is not
  // selected, so they must be optional on the exported data shape
  type TConfigKey = "navName" | "width" | "height" | "shiftX" | "shiftY" | "grid" | "padding" | "initial"
    | "initialLevel" | "levels" | "weather" | "tokenVision" | "fog" | "environment" | "regions";
  const data: Omit<typeof fullData, TConfigKey> & { [K in TConfigKey]?: (typeof fullData)[K] } = fullData;

  if (!data.flags.ddb) data.flags.ddb = {};
  data.flags.ddb.foundryVersion = game.version;
  // lets the importer recognise this scene's own region UUIDs (Scene.<id>.Region...) with certainty
  data.flags.ddb.sourceSceneId = scene.id;
  data.flags.ddb.links = collectSceneLinks(scene).links;

  if (data.flags.ddb.tokens) delete data.flags.ddb.tokens;
  data.flags.ddb.tokens = scene.tokens!
    .filter((token: TokenDocument) => !token.actorLink)
    .map((token: TokenDocument) => {
      // copies: the export reshapes flags, which must never touch the live token or actor
      const tokenFlags = foundry.utils.deepClone(token._source.flags ?? {}) as Record<string, any>;
      const importFlags: Record<string, any> = tokenFlags.ddbimporter ?? {};
      const actorData = token.delta?.toObject() as Record<string, any> | undefined;
      const result = {
        // a token placed from meta-data keeps its meta id, and the hidden state the meta file gave it
        // rather than the import's hide-everything policy
        _id: importFlags.metaTokenId ?? token._id,
        name: token.name,
        width: token.width,
        height: token.height,
        x: token.x,
        y: token.y,
        disposition: token.disposition,
        flags: tokenFlags,
        actorLink: false,
        bar1: { attribute: "attributes.hp" },
        effects: [] as any[],
        elevation: token.elevation,
        level: token.level,
        depth: token.depth,
        // every importer places tokens hidden, so the file says so whatever the GM has revealed since
        hidden: true,
        actorData,
        light: token.light,
      };

      // the token actor flags here help us match up actors using the DDB ID
      const actor = token.actor;
      const ddbFlags = foundry.utils.deepClone(foundry.utils.getProperty(token, "actor.flags.ddbimporter")) as Record<string, any>;
      // ddbFlags come from the token actor, so a hit implies the actor exists
      if (ddbFlags && actor) {
        if (ddbFlags.keepAvatar && actor.img) {
          const image = actor.img.split("assets/").pop();
          ddbFlags.avatarImage = `assets/${image}`;
        }
        if (ddbFlags.keepToken && token.texture.src) {
          const image = token.texture.src.split("assets/").pop();
          ddbFlags.tokenImage = `assets/${image}`;
        }
        ddbFlags.name = actor.prototypeToken?.name ? actor.prototypeToken.name : actor.name;
        // only what the importers read: the rest describes the world's monster actor (sources, munch
        // version), which differs between worlds and would make every export look changed
        result.flags.ddbActorFlags = Object.fromEntries(Object.entries(ddbFlags)
          .filter(([key]) => EXPORT_ACTOR_FLAG_KEYS.has(key)));
      }

      // these might exist, we don't have them in our model, we don't want to carry them over, so delete them
      for (const key of ["token-action-hud-core", "simbuls-cover-calculator", "monks-enhanced-journal", "monks-tokenbar",
        "tagger", "monks-combat-marker", "image-hover", "elevation-drag-ruler"]) {
        delete tokenFlags[key];
        if (actorData?.flags) delete actorData.flags[key];
      }
      // bookkeeping from placing the token from meta-data (Quickplay tokens keep their ddbimporter keys)
      if (importFlags.source === "meta-data") {
        delete importFlags.source;
        delete importFlags.metaTokenId;
        // written by imports before tokens were always exported hidden
        delete importFlags.metaHidden;
        // a Quickplay token's ddbEntityId came with the meta-data; otherwise placement added it
        if (!importFlags.quickplayTokenId) delete importFlags.ddbEntityId;
      }
      // written by native imports before tokens were always exported hidden
      delete importFlags.hiddenByImport;
      if (tokenFlags.ddbimporter && Object.keys(tokenFlags.ddbimporter).length === 0) delete tokenFlags.ddbimporter;

      return result;
    }) as unknown as I5eTokenData[];


  // removed un-needed userdata
  if (data.flags.ddb?.userData) delete data.flags.ddb.userData;

  // the note shapes carry live document values (e.g. texture.tint as Color)
  // where I5eNoteData declares the serialized string forms
  data.flags.ddb.notes = notes as unknown as I5eNoteData[];
  if (!scene.background.src) {
    throw new Error(`Scene "${scene.name}" has no background image to export`);
  }
  data.flags.ddb.img = `assets/${scene.background.src.split("assets/").pop()}`;
  data.flags.ddb.levelImages = {};
  for (const level of scene.levels) {
    if (level._id && level.background?.src) {
      data.flags.ddb.levelImages[level._id] = `assets/${level.background.src.split("assets/").pop()}`;
    }
  }

  if (!data.flags.ddbimporter) data.flags.ddbimporter = {};
  data.flags.ddbimporter.version = game.modules.get("ddb-importer")?.version;

  return data;
}

function getCompendiumScenes(compendiumCollection: string, selectedId: string | null = null, selectedName: string | null = null) {
  const scenes: any[] = [];
  const compendium = game.packs.find((pack) => pack.collection === compendiumCollection);
  if (compendium) {
    compendium.index.forEach((scene) => {
      const option = {
        _id: scene._id,
        name: (scene as unknown as INameMatchIndexEntry).name,
        selected: (!!selectedId && selectedId == scene._id)
          || (!!selectedName && !!(scene as unknown as INameMatchIndexEntry).name
            && selectedName.trim().includes((scene as unknown as INameMatchIndexEntry).name as string)),
      };
      scenes.push(option);
    });
  }

  return scenes;
}

const ddbFlags = ["ddb", "ddbimporter"];
const allowedFlags = ["stairways", "perfect-vision", "dynamic-illumination"];

export class SceneEnhancerExport extends Application {

  sceneSet: boolean;
  compendiumBookSet: boolean;
  downloadBookSet: boolean;
  scene: any;
  description: string;
  url: string;
  compendium: string;
  compendiumSceneId: string;
  bookCode: string;
  compendiumScenes: { _id: string; name: string; selected: boolean }[];
  compendiums: any[];
  books: { code: string; name: string; selected: boolean }[];
  exportOptionsCompendium: Record<string, boolean>;
  exportOptionsDownload: Record<string, boolean>;
  compendiumDisabled: boolean;
  downloadDisabled: boolean;

  constructor(scene: any) {
    super();
    this.sceneSet = false;
    this.compendiumBookSet = false;
    this.downloadBookSet = false;

    this.scene = scene;
    const sceneExportFlags = this.scene.flags.ddbimporter?.export;
    const lastCompendium = localStorage.getItem("ddb-last-compendium");
    const lastBook = localStorage.getItem("ddb-last-book");

    this.description = sceneExportFlags?.description || "";
    this.url = sceneExportFlags?.url || "";
    this.compendium = sceneExportFlags?.compendium ?? lastCompendium;
    this.compendiumSceneId = sceneExportFlags?.scene;
    this.bookCode = this.scene.flags?.ddb?.bookCode.toLowerCase() ?? lastBook;
    this.compendiumScenes = this.compendium ? getCompendiumScenes(this.compendium, this.compendiumSceneId, this.scene.name) : [];

    if (this.compendiumScenes && this.compendiumScenes.some((s) => s.selected === true)) this.sceneSet = true;

    this.compendiums = game.packs
      .filter((pack) => pack.metadata?.type === "Scene")
      .map((pack) => {
        if (this.compendium && this.compendium === pack.collection) (pack as { selected?: boolean }).selected = true;
        else (pack as { selected?: boolean }).selected = false;
        return pack;
      })
      .sort((a, b) => (a.metadata.label as string).localeCompare(b.metadata.label as string));

    const selectedBooks = this.bookCode
      ? CONFIG.DDB.sources.filter((s) => s.name.toLowerCase() === this.bookCode).map((s) => s.id)
      : [];
    this.books = MuncherSettings.getSourcesLookups(selectedBooks).map((b) => {
      if (b.selected) {
        this.compendiumBookSet = true;
        this.downloadBookSet = true;
      }
      return {
        code: b.acronym.toLowerCase(),
        name: b.label,
        selected: b.selected,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    this.exportOptionsCompendium = {
      actors: sceneExportFlags?.actors !== undefined ? sceneExportFlags.actors : true,
      notes: sceneExportFlags?.notes !== undefined ? sceneExportFlags.notes : true,
      lights: sceneExportFlags?.lights !== undefined ? sceneExportFlags.lights : false,
      walls: sceneExportFlags?.walls !== undefined ? sceneExportFlags.walls : false,
      drawings: sceneExportFlags?.drawings !== undefined ? sceneExportFlags.drawings : false,
      config: sceneExportFlags?.config !== undefined ? sceneExportFlags.config : false,
    };
    this.exportOptionsDownload = {
      actors: sceneExportFlags?.actors !== undefined ? sceneExportFlags.actors : true,
      notes: sceneExportFlags?.notes !== undefined ? sceneExportFlags.notes : true,
      lights: sceneExportFlags?.lights !== undefined ? sceneExportFlags.lights : true,
      walls: sceneExportFlags?.walls !== undefined ? sceneExportFlags.walls : true,
      drawings: sceneExportFlags?.drawings !== undefined ? sceneExportFlags.drawings : true,
      config: sceneExportFlags?.config !== undefined ? sceneExportFlags.config : true,
    };
    this.compendiumDisabled = !this.sceneSet || !this.compendiumBookSet;
    this.downloadDisabled = !this.downloadBookSet || this.url === "" || !this.url.startsWith("http");
  }

  static override get defaultOptions() {
    const options = super.defaultOptions;
    options.baseApplication = "SceneEnhancerExport";
    options.id = "ddb-importer-scene-enhancer";
    options.template = "modules/ddb-importer/handlebars/enhance-export.hbs";
    options.width = 500;
    options.resizable = false;
    options.height = "auto";
    options.classes = ["ddb-muncher", "sheet"];
    options.tabs = [{ navSelector: ".tabs", contentSelector: "div", initial: "compendium" }];
    return options;
  }

  override get title() {
    return `DDB Importer Scene Enhancer Exporter: ${this.scene.name}`;
  }

  /** @override */
  override getData() {
    const templateData = {
      sceneName: this.scene.name,
      compendiums: this.compendiums,
      compendiumScenes: this.compendiumScenes,
      description: this.description,
      books: this.books,
      url: this.url,
      exportOptionsCompendium: this.exportOptionsCompendium,
      exportOptionsDownload: this.exportOptionsDownload,
      compendiumDisabled: this.compendiumDisabled,
      downloadDisabled: this.downloadDisabled,
    };

    return templateData;
  }

  checkState() {
    if (this.sceneSet && this.compendiumBookSet) {
      this.compendiumDisabled = false;
      $("#compendium-button").prop("disabled", false);
    } else {
      $("#compendium-button").prop("disabled", true);
    }
    if (this.downloadBookSet && this.url !== "" && this.url.startsWith("http")) {
      this.downloadDisabled = false;
      $("#download-button").prop("disabled", false);
    } else {
      $("#download-button").prop("disabled", true);
    }
  }

  override activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    $("#ddb-importer-scene-enhancer").css("height", "auto");

    html.find("#compendium-form").submit(async (event: any) => {
      const form = document.querySelector<HTMLFormElement>("#compendium-form");
      if (!form) return;
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find("#download-form").submit(async (event: any) => {
      const form = document.querySelector<HTMLFormElement>("#download-form");
      if (!form) return;
      const data = Object.fromEntries(new FormData(form).entries());
      this.buttonClick(event, data);
    });

    html.find("#select-compendium").on("change", async () => {
      const compendiumSelection = html.find("#select-compendium");

      // get selected campaign from html selection
      const compendiumCollection = (compendiumSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (compendiumSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;

      let sceneList = "";

      if (compendiumCollection && compendiumCollection !== "") {
        const scenes = getCompendiumScenes(compendiumCollection);
        sceneList = `<option value="">Select...</option>`;
        scenes.forEach((scene) => {
          const selected = scene.selected ? " selected" : "";
          sceneList += `<option value="${scene._id}"${selected}>${scene.name}</option>`;
        });
      }
      const sceneSelection = html.find("#select-scene");
      sceneSelection[0].innerHTML = sceneList;
    });

    html.find("#select-scene").on("change", async () => {
      const sceneSelection = html.find("#select-scene");
      const scene = (sceneSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (sceneSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.sceneSet = !!scene && scene !== "";
      this.checkState();
    });

    html.find("#select-book-compendium").on("change", async () => {
      const bookSelection = html.find("#select-book-compendium");
      const book = (bookSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (bookSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.compendiumBookSet = !!book && book !== "";
      this.checkState();
    });

    html.find("#select-book-download").on("change", async () => {
      const bookSelection = html.find("#select-book-download");
      const book = (bookSelection[0] as HTMLSelectElement).selectedOptions[0]
        ? (bookSelection[0] as HTMLSelectElement).selectedOptions[0].value
        : undefined;
      this.downloadBookSet = !!book && book !== "";
      this.checkState();
    });

    html.find("#download-url").on("change", async () => {
      const bookSelection = html.find("#download-url");
      const url = (bookSelection[0] as HTMLInputElement).value;
      if (url && url !== "" && url.startsWith("http")) {
        this.url = url;
      }
      this.checkState();
    });

  }


  async buttonClick(event: any, formData: any) {
    event.preventDefault();

    // before the form choices are saved, so cancelling leaves the scene as it was
    if (!(await confirmSceneLinks(this.scene))) return;

    const sceneFlags = foundry.utils.duplicate(this.scene.flags);

    if (!sceneFlags.ddb) sceneFlags.ddb = {};
    if (!sceneFlags.ddbimporter) sceneFlags.ddbimporter = {};
    if (!sceneFlags.ddbimporter.export) sceneFlags.ddbimporter.export = {};

    sceneFlags.ddb["bookCode"] = formData["select-book"];
    localStorage.setItem("ddb-last-book", formData["select-book"]);
    sceneFlags.ddbimporter.export["description"] = formData["description"];
    sceneFlags.ddbimporter.export["actors"] = formData["export-actors"] == "on";
    sceneFlags.ddbimporter.export["notes"] = formData["export-notes"] == "on";
    sceneFlags.ddbimporter.export["lights"] = formData["export-lights"] == "on";
    sceneFlags.ddbimporter.export["walls"] = formData["export-walls"] == "on";
    sceneFlags.ddbimporter.export["drawings"] = formData["export-drawings"] == "on";
    sceneFlags.ddbimporter.export["config"] = formData["export-config"] == "on";

    if (formData["download-url"]) {
      sceneFlags.ddbimporter.export["url"] = formData["download-url"];
    } else {
      sceneFlags.ddbimporter.export["compendium"] = formData["select-compendium"];
      localStorage.setItem("ddb-last-compendium", formData["select-compendium"]);
      sceneFlags.ddbimporter.export["scene"] = formData["select-scene"];
    }

    await this.scene.update({ flags: sceneFlags });

    const sceneData = collectSceneData(this.scene, formData["select-book"]);

    Object.keys(sceneData.flags).forEach((flag) => {
      if (!allowedFlags.includes(flag) && !ddbFlags.includes(flag)) delete sceneData.flags[flag];
    });

    if (formData["export-actors"] !== "on") delete sceneData.flags.ddb?.tokens;
    if (formData["export-notes"] !== "on") delete sceneData.flags.ddb?.notes;
    const optionalSceneData = sceneData as { lights?: unknown; walls?: unknown; drawings?: unknown };
    if (formData["export-lights"] !== "on") delete optionalSceneData.lights;
    if (formData["export-walls"] !== "on") delete optionalSceneData.walls;
    if (formData["export-drawings"] !== "on") delete optionalSceneData.drawings;
    if (formData["export-config"] !== "on") {
      delete sceneData.navName;
      delete sceneData.width;
      delete sceneData.height;
      delete sceneData.shiftX;
      delete sceneData.shiftY;
      delete sceneData.grid;
      delete sceneData.padding;
      delete sceneData.initial;
      delete sceneData.initialLevel;
      delete sceneData.levels;
      delete sceneData.weather;
      delete sceneData.tokenVision;
      delete sceneData.fog;
      delete sceneData.environment;
      delete sceneData.regions;
      Object.keys(sceneData.flags).forEach((flag) => {
        if (!ddbFlags.includes(flag)) delete sceneData.flags[flag];
      });
    }

    logger.debug(sceneData);
    const name = sceneData.name.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    const sceneRef = `ddb-enhanced-scene-${name}`;
    FileHelper.download(JSON.stringify(sceneData, null, 4), `${sceneRef}.json`, "application/json");

    this.close();
  }
}

