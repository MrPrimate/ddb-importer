import { logger, utils } from "../../lib/_module";
import { DDBReferenceLinker } from "../../parser/lib/_module";

/**
 * Shared `ddb://` link replacement for adventure journal HTML, used by both the
 * zip-based importer (AdventureMunch) and the native in-browser importer
 * (NativeLinkReplacer). The two callers differ only in whether they resolve
 * world-actor links and apply the 2014->2024 monster swap, so those are opt-in.
 */

export const COMPENDIUM_MAP: Record<string, string> = {
  "spells": "spells",
  "magicitems": "items",
  "weapons": "items",
  "armor": "items",
  "adventuring-gear": "items",
  "monsters": "monsters",
  "vehicles": "vehicles",
};

export const DDB_MAP: Record<string, string> = {
  "spells": "spells",
  "magicitems": "magic-items",
  "weapons": "equipment",
  "armor": "equipment",
  "adventuring-gear": "equipment",
  "monsters": "monsters",
  "vehicles": "vehicles",
};

export const CONFIG_MAP: Record<string, string> = {
  "armor": "armor",
  "weapons": "weapons",
};

export interface LinkReplaceOptions {
  /** `adventureConfig.lookups` - per-type arrays of compendium entries. */
  lookups: Record<string, any[]>;
  /** Monsters being swapped 2014->2024 (zip importer only). */
  monstersToReplace?: { id2014: number; id2024: number | string }[];
  /** Resolve `ddb://monsters/<id>` to a world `@UUID[Actor.<id>]` (zip importer only). */
  journalWorldActors?: boolean;
  /** World actor data for the journalWorldActors branch. */
  actorData?: any[];
}

/** Replace the `ddb://<type>/<id>` compendium links with `@Compendium`/`@UUID` links. */
export function replaceLookupLinks(doc: Document, options: LinkReplaceOptions): Document {
  const { lookups, monstersToReplace = [], journalWorldActors = false, actorData = [] } = options;

  for (const lookupKey in COMPENDIUM_MAP) {
    const compendiumLinks = doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`);
    const lookupRegExp = new RegExp(`ddb://${lookupKey}/([0-9]*)"`);
    // only entries for a compendium document can become a compendium link; the vehicle lookup
    // also lists vehicles that were never imported, by DDB url only, which later steps link to DDB
    const lookupEntries = lookups?.[COMPENDIUM_MAP[lookupKey]];
    const lookupDictionary = (lookupEntries ?? []).filter((entry: any) => entry.compendium && entry._id);
    compendiumLinks.forEach((node) => {
      const lookupMatch = node.outerHTML.match(lookupRegExp);
      if (!lookupEntries || !lookupMatch) return;

      const worldActorLink = journalWorldActors && ["monsters"].includes(lookupKey);
      let ddbId = lookupMatch[1];
      const dictionaryName = CONFIG_MAP[lookupKey]
        ? CONFIG.DDB[lookupKey as keyof typeof CONFIG.DDB]?.find((e: any) => e.id == ddbId)?.name
        : null;
      const replacedMonster = monstersToReplace.find((m) => m.id2014 === parseInt(ddbId));
      if (replacedMonster) ddbId = String(replacedMonster.id2024);
      const lookupEntry = worldActorLink
        ? actorData.find((a) => a.ddbId === parseInt(ddbId))
        : dictionaryName
          ? lookupDictionary.find((e: any) => e.name == dictionaryName)
          : (lookupDictionary.find((e: any) => e.id == ddbId && e.name === (node.textContent?.trim() ?? ""))
            ?? lookupDictionary.find((e: any) => e.id == ddbId));

      if (lookupEntry) {
        writeLink(doc, node, lookupEntry, worldActorLink);
      } else {
        logger.warn(`NO Lookup Compendium Entry for ${node.outerHTML}, using key "${lookupKey}"`, {
          lookups,
          actorData,
          lookupRegExp,
          lookupKey,
        });
        // last resort: a compendium entry whose name matches (case-insensitive)
        // but carries a different id (DDB id drift across reprints).
        const named = worldActorLink
          ? undefined
          : lookupDictionary.find((e: any) => e.name?.toLowerCase() === (node.textContent?.trim() ?? "").toLowerCase());
        if (named) {
          logger.warn(`Found a compendium entry with matching name "${named.name}" but different ID ${named.id} (expected ${ddbId})`);
          writeLink(doc, node, named, false);
        }
      }
    });
  }

  return doc;
}

/**
 * The DDB page for a `ddb://<type>/<id>` link with no compendium entry, in DDB's `<id>-<slug>`
 * form (`https://www.dndbeyond.com/monsters/16907-goblin`). Every space becomes a hyphen, so
 * multi-word names keep their word breaks; without an id only the slug is used.
 */
export function guessDDBUrl(lookupKey: string, href: string, text: string): string {
  const ddbStub = DDB_MAP[lookupKey];
  const ddbId = href.match(new RegExp(`ddb://${lookupKey}/([0-9]+)`))?.[1];
  const slug = text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^0-9a-z-]/g, "");
  const path = ddbId ? (slug ? `${ddbId}-${slug}` : ddbId) : slug;
  return `https://www.dndbeyond.com/${ddbStub}/${path}`;
}

/** Write the resolved `@Compendium`/`@UUID` link in place of the `<a>` node. */
function writeLink(doc: Document, node: Element, lookupEntry: any, worldActorLink: boolean): void {
  const pageLink = lookupEntry.pageId ? `.JournalEntryPage.${lookupEntry.pageId}` : "";
  const linkStub = lookupEntry.headerLink ? `#${lookupEntry.headerLink}` : "";
  const linkType = worldActorLink ? "UUID" : "Compendium";
  const linkBody = worldActorLink
    ? `Actor.${lookupEntry.actorId}`
    : `${lookupEntry.compendium}.${lookupEntry._id}${pageLink}${linkStub}`;
  doc.body.innerHTML = doc.body.innerHTML.replace(node.outerHTML, `@${linkType}[${linkBody}]{${node.textContent}}`);
}

/**
 * Replace `ddb://` links in journal HTML with compendium/world links, falling
 * back to DDB urls for vehicles and any still-unresolved references, then run
 * the reference-tag pass. Returns the rewritten innerHTML.
 */
export function foundryCompendiumReplace(text: string, options: LinkReplaceOptions): string {
  const { lookups } = options;
  const doc = replaceLookupLinks(utils.htmlToDoc(text), options);

  // vehicles - if not imported, link to DDB
  const vehicleLinks = doc.querySelectorAll("a[href*=\"ddb://vehicles/\"]");
  const vehicleRegExp = /ddb:\/\/vehicles\/([0-9]*)/;
  vehicleLinks.forEach((node) => {
    const target = node.outerHTML;
    const lookupMatch = node.outerHTML.match(vehicleRegExp);
    const lookupValue = lookups["vehicles"] ?? [];
    if (lookupMatch) {
      const lookupEntry = lookupValue.find((e: any) => e.id == lookupMatch[1] && e.url);
      if (lookupEntry) {
        const url = (/^https?:/).test(lookupEntry.url) ? lookupEntry.url : `https://www.dndbeyond.com${lookupEntry.url}`;
        node.setAttribute("href", url);
        doc.body.innerHTML = doc.body.innerHTML.replace(target, node.outerHTML);
      } else {
        logger.warn(`NO Vehicle Lookup Entry for ${node.outerHTML}`);
      }
    } else {
      logger.warn(`NO Vehicle Lookup Match for ${node.outerHTML}`);
    }
  });

  // final fallback: any remaining ddb:// compendium links -> guessed DDB url
  for (const lookupKey in COMPENDIUM_MAP) {
    doc.querySelectorAll(`a[href*="ddb://${lookupKey}/"]`).forEach((node) => {
      const target = node.outerHTML;
      logger.warn(`No Compendium Entry for ${node.outerHTML} attempting to guess a link to DDB`);
      node.setAttribute("href", guessDDBUrl(lookupKey, node.getAttribute("href") ?? "", node.textContent ?? ""));
      doc.body.innerHTML = doc.body.innerHTML.replace(target, node.outerHTML);
    });
  }

  return DDBReferenceLinker.parseTags(doc.body.innerHTML);
}
