import { CompendiumHelper, DDBRunContext } from "../../../lib/_module";

import logger from "../../../lib/Logger";
import utils from "../../../lib/Utils";
import DDBMonsterImporter from "../../../muncher/DDBMonsterImporter";
import DDBMonster from "../../DDBMonster";
import DDBMonsterFactory from "../../DDBMonsterFactory";
import { resolveMonsterSource } from "../../monster/source";
import { newNPC } from "../../monster/templates/monster";

// one lookup per creature and ruleset for the page load; a miss is remembered too
const RESOLVED = new Map<string, string | null>();

/** A token image an effect can point `token.texture.src` at: a real, single file. */
function usableTokenPath(path: string | null | undefined): path is string {
  return !!path && !path.includes("*") && !utils.isDefaultOrPlaceholderImage(path);
}

/**
 * The token art of an already munched monster, preferring the requested ruleset. A wildcard
 * token is a folder pattern, so the server is asked for the files behind it and the first is used.
 */
async function compendiumTokenArt(normalizedName: string, rules: string): Promise<string | null> {
  const compendium = CompendiumHelper.getCompendiumType("monster", false);
  if (!compendium) return null;
  await compendium.getIndex({ fields: ["name", "system.source.rules", "prototypeToken.texture.src"] });
  const tokenOf = (entry: any) => foundry.utils.getProperty(entry, "prototypeToken.texture.src") as string | undefined;
  const matches = compendium.index.filter((entry: any) =>
    utils.normalizeString(entry.name) === normalizedName
    && !utils.isDefaultOrPlaceholderImage(tokenOf(entry)),
  );
  const match = matches.find((entry: any) => foundry.utils.getProperty(entry, "system.source.rules") === rules)
    ?? matches[0];
  if (!match) return null;

  const token = tokenOf(match);
  if (usableTokenPath(token)) return token;
  const files = await CONFIG.ux.FilePicker.requestTokenImages(match._id, { pack: compendium.collection });
  return files.find((file: string) => usableTokenPath(file)) ?? null;
}

/** The dnd5e creature type a DDB monster imports as, as the importer files its art. */
function creatureType(source: IDDBMonsterSourceData): string {
  const typeName = CONFIG.DDB.monsterTypes.find((type) => source.typeId == type.id)?.name.toLowerCase();
  return typeName && typeName in CONFIG.DND5E.creatureTypes ? typeName : "";
}

/**
 * The DDB token art of a monster that is not in the compendium. The source data is fetched by
 * exact name, as the companion images are, and a bare stand-in for that monster goes through the
 * monster importer's own image step. That is what makes the art match the table: the file lands
 * where the monster's own munch would put it (rules, book, deep-path and wildcard folders), it
 * is auto-tokenized when that setting and a tokenizer are on, and the importer's lookup cache is
 * filled, so a later munch of the monster reuses the result instead of repeating the work.
 */
async function ddbTokenArt(name: string, normalizedName: string, is2014: boolean): Promise<string | null> {
  if (!game.user.isGM && !DDBRunContext.keyPostfix) return null;
  if (utils.getSetting<boolean>("munching-policy-disable-monster-art")) return null;

  const monsterFactory = new DDBMonsterFactory({ type: "summons" });
  // not defaultFetchOptions: the muncher's book and type filters must not hide a common beast
  await monsterFactory.fetchDDBMonsterSourceData({
    ids: [],
    searchTerm: name,
    sources: [],
    homebrew: false,
    homebrewOnly: false,
    exactMatch: true,
    excludeLegacy: false,
    excludedCategories: [],
    monsterTypes: [],
  });

  const matches = monsterFactory.source
    .filter((source) =>
      utils.normalizeString(source.name) === normalizedName
      && source.avatarUrl
      && !DDBMonster.STOCK_TYPE_IMAGES.includes(source.avatarUrl),
    )
    .map((ddb) => {
      const resolved = resolveMonsterSource(ddb);
      return { ddb, book: resolved.source, is2014: resolved.is2014 };
    });
  const match = matches.find((candidate) => candidate.is2014 === is2014) ?? matches[0];
  if (!match) return null;

  // only what the image step reads: name, type, source and the DDB image urls
  const standIn = newNPC(match.ddb.name, match.ddb.id);
  foundry.utils.setProperty(standIn, "system.details.type.value", creatureType(match.ddb));
  foundry.utils.setProperty(standIn, "system.source", { ...match.book, rules: match.is2014 ? "2014" : "2024" });
  const avatar = match.ddb.basicAvatarUrl ?? match.ddb.largeAvatarUrl;
  foundry.utils.setProperty(standIn, "flags.monsterMunch", {
    // foundry doesn't support gifs
    img: avatar && !avatar.match(/.gif$/) ? avatar : match.ddb.avatarUrl,
    tokenImg: match.ddb.avatarUrl,
    isStockImg: false,
  });

  const importer = new DDBMonsterImporter({ monster: standIn, type: "monsters" });
  await importer.getNPCImage();

  const token = standIn.prototypeToken?.texture?.src;
  if (usableTokenPath(token)) return token;
  // wildcard tokens: the prototype token is the folder pattern, the importer kept the files
  return [importer.tokenFiles.tokenized, importer.tokenFiles.downloaded].find((file) => usableTokenPath(file)) ?? null;
}

/**
 * Token art for a named creature, for effects that swap `token.texture.src` (shape-shift forms).
 * A munched monster's own token wins, so the form matches the table's token style; otherwise the
 * DDB token image is downloaded. Null when there is no monster compendium (the audit harness),
 * no such monster, or no usable image, leaving the caller's fallback in place.
 */
export async function resolveMonsterTokenArt({ name, is2014 }: { name: string; is2014: boolean }): Promise<string | null> {
  const normalizedName = utils.normalizeString(name);
  const rules = is2014 ? "2014" : "2024";
  const key = `${rules}:${normalizedName}`;
  if (RESOLVED.has(key)) return RESOLVED.get(key) ?? null;

  let art: string | null = null;
  try {
    if (CompendiumHelper.getCompendiumType("monster", false)) {
      art = await compendiumTokenArt(normalizedName, rules)
        ?? await ddbTokenArt(name, normalizedName, is2014);
    }
  } catch (error) {
    logger.warn(`Could not resolve token art for ${name}`, { error });
  }
  RESOLVED.set(key, art);
  return art;
}
