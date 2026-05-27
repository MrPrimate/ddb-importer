import { CompendiumHelper } from "../../../lib/_module";

import logger from "../../../lib/Logger";
import utils from "../../../lib/Utils";
import DDBMonsterFactory from "../../DDBMonsterFactory";

interface ITransformProfile {
  name: string;
  uuid?: string | null;
  [key: string]: any;
}

interface IParsedProfile {
  profile: ITransformProfile;
  name: string;
  normalizedName: string;
  ddbId: number | null;
}

/**
 * Parses a transform profile name, optionally encoded as "Name#ddbId".
 * Rewrites the profile name to the clean display name (strips the "#id" suffix).
 */
function parseProfile(profile: ITransformProfile): IParsedProfile {
  const [rawName, idPart] = (profile.name ?? "").split("#");
  const name = rawName.trim();
  const ddbId = idPart && !Number.isNaN(parseInt(idPart)) ? parseInt(idPart) : null;
  profile.name = name;
  return {
    profile,
    name,
    normalizedName: utils.normalizeString(name),
    ddbId,
  };
}

function findIndexEntry(index: any, parsed: IParsedProfile, rules: string): any | undefined {
  if (parsed.ddbId !== null) {
    return index.find((entry) => foundry.utils.getProperty(entry, "flags.ddbimporter.id") == parsed.ddbId);
  }
  return index.find((entry) =>
    utils.normalizeString(entry.name) === parsed.normalizedName
    && foundry.utils.getProperty(entry, "system.source.rules") === rules,
  );
}

/**
 * Resolves the `uuid` of each transform (polymorph) profile that lacks one, by looking up
 * the monster in the monster compendium (importing from DDB if absent). Profiles may encode
 * a DDB monster id with "#" (e.g. "Giant Spider#4775821") for a precise, version-pinned match;
 * otherwise the monster is matched by name and the supplied rules version (2014/2024).
 *
 * Mutates the passed profiles in place (sets `uuid`, cleans `name`).
 */
export async function resolveTransformProfileUuids(
  { profiles, is2014 }: { profiles: ITransformProfile[]; is2014: boolean },
): Promise<ITransformProfile[]> {
  const rules = is2014 ? "2014" : "2024";

  const parsed = (profiles ?? [])
    .map((profile) => parseProfile(profile))
    .filter((p) => !p.profile.uuid && p.name.length > 0);

  if (parsed.length === 0) return profiles;

  const compendium = CompendiumHelper.getCompendiumType("monster", false);
  if (!compendium) {
    logger.warn("No monster compendium configured, cannot resolve transform profiles");
    return profiles;
  }

  const indexOptions = { fields: ["name", "system.source.rules", "flags.ddbimporter.id"] };
  await compendium.getIndex(indexOptions);

  const setResolved = () => {
    const unresolved: IParsedProfile[] = [];
    for (const p of parsed) {
      if (p.profile.uuid) continue;
      const entry = findIndexEntry(compendium.index, p, rules);
      if (entry) {
        p.profile.uuid = entry.uuid;
      } else {
        unresolved.push(p);
      }
    }
    return unresolved;
  };

  let unresolved = setResolved();

  if (unresolved.length > 0 && game.user.isGM) {
    const idMisses = unresolved.filter((p) => p.ddbId !== null).map((p) => p.ddbId as number);
    const nameMisses = [...new Set(unresolved.filter((p) => p.ddbId === null).map((p) => p.name))];

    const monsterFactory = new DDBMonsterFactory({ forceUpdate: false });
    if (idMisses.length > 0) {
      await monsterFactory.processIntoCompendium([...new Set(idMisses)]);
    }
    for (const name of nameMisses) {
      await monsterFactory.processIntoCompendium(null, name);
    }

    await compendium.getIndex(indexOptions);
    unresolved = setResolved();
  }

  for (const p of unresolved) {
    logger.warn(`Could not resolve transform profile monster: ${p.name}${p.ddbId ? ` (#${p.ddbId})` : ""}`);
  }

  return profiles;
}
