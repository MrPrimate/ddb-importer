import { CompendiumHelper, logger, utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";
import { findInMonsterBatch, findInMonsterBatchById } from "../../monster/batch";

interface IMonsterSummonCreature {
  /** The creature's name as the monster compendium holds it. */
  name: string;
  /** A number or a dice formula; "1" when the text names a single creature. */
  count?: string;
  /** Shown in the summoning prompt in place of the name, for a creature the text alters. */
  label?: string;
  /** The creature's D&D Beyond id, for linking it before it has been munched. */
  ddbId?: number;
}

/** "1d4 devils of challenge rating 4 or lower": dnd5e asks which creature when the summon is used. */
interface IMonsterSummonChallenge {
  count: string;
  cr: string;
  types: TCreatureTypes[];
}

interface IMonsterSummon {
  creatures: IMonsterSummonCreature[];
  /** Used in place of `creatures`, never beside them: a summon activity has one mode. */
  challenge?: IMonsterSummonChallenge | null;
  activationType?: TActivationCost;
  activationCondition?: string;
  /** Feet to the space the creature appears in. */
  range?: string;
  duration?: I5eActivityDuration;
  /** Spend the feature's own uses or recharge. */
  consume?: boolean;
}

/**
 * The profile id is derived from the creature's name, so the linker below can find a profile
 * again after the activity is built, and a re-import lands on the same profile.
 */
function profileId(creature: IMonsterSummonCreature): string {
  return utils.namedIDStub(creature.name, { prefix: "ddbMS", postfix: "" });
}

/**
 * The summon fields of the activity: named, actor-less profiles for creatures, or one
 * challenge-rating profile that has dnd5e ask for the creature.
 */
export function monsterSummonData(summon: Pick<IMonsterSummon, "creatures" | "challenge">): Partial<I5eSummonActivity> {
  const blank = { level: { min: null, max: null } };
  return {
    summon: { mode: summon.challenge ? "cr" : "", prompt: true },
    match: { proficiency: false, attacks: false, saves: false, disposition: true },
    bonuses: { ac: "", hp: "", attackDamage: "", saveDamage: "", healing: "" },
    creatureSizes: [],
    creatureTypes: [],
    profiles: summon.challenge
      ? [{
        _id: utils.namedIDStub(`cr ${summon.challenge.cr}`, { prefix: "ddbMS", postfix: "" }),
        name: "",
        count: summon.challenge.count,
        cr: summon.challenge.cr,
        types: summon.challenge.types,
        ...blank,
      }]
      : summon.creatures.map((creature) => ({
        _id: profileId(creature),
        name: creature.label ?? creature.name,
        count: creature.count ?? "1",
        ...blank,
      })),
  };
}

/**
 * A monster that summons other monsters, as an extra activity beside whatever the parser built.
 * The called creatures are ordinary stat blocks, not the generated companions in the summons
 * compendium, so the profiles are written with a name and no actor: dnd5e places nothing for a
 * profile without an actor, which leaves the activity harmless until `linkMonsterSummons` has
 * found the creature. The summoner's token disposition is matched because every one of these
 * creatures is the summoner's ally.
 */
export function monsterSummon(name: string, summon: IMonsterSummon): IDDBAdditionalActivity {
  return {
    init: { name, type: DDBEnricherData.ACTIVITY_TYPES.SUMMON },
    build: {
      generateSummon: true,
      generateActivation: true,
      generateRange: Boolean(summon.range),
      generateDuration: Boolean(summon.duration),
      generateConsumption: false,
      activationOverride: {
        type: summon.activationType ?? "action",
        value: null,
        condition: summon.activationCondition ?? "",
      },
      ...(summon.range ? { rangeOverride: { override: true, value: summon.range, units: "ft", special: "" } } : {}),
      ...(summon.duration ? { durationOverride: { override: true, ...summon.duration } } : {}),
    },
    overrides: {
      noTemplate: true,
      noeffect: true,
      ...(summon.consume ? { addItemConsume: true } : { noConsumeTargets: true }),
      data: monsterSummonData(summon),
    },
  };
}

/**
 * Points the profiles `monsterSummon` wrote at the creatures in the monster compendium, matching
 * by name and preferring the summoner's own ruleset. Run from an enricher's `cleanup`.
 *
 * A munch can reach the summoner before the creature it calls. A munched monster's compendium id
 * is built from its name and D&D Beyond id, so a creature that gives its id, or that is part of
 * the munch now running, is linked to where it will land; until it does, dnd5e reports the
 * missing actor when the summon is used. Any other keeps its actor-less profile, and
 * re-importing the summoner once the creature is munched completes the link.
 * With no monster compendium configured (the audit harness) nothing is linked.
 *
 * Preference, whether the creature is in the compendium already or in the munch now running:
 * the summoner's own printing by name, then the D&D Beyond id the text gave, then the other
 * printing. D&D Beyond's links on a 2024 monster often still point at the legacy creature.
 */
export async function linkMonsterSummons(
  data: { name?: string; system?: { activities?: Record<string, I5eActivity> } } | null | undefined,
  creatures: IMonsterSummonCreature[],
  is2024: boolean,
): Promise<void> {
  const activities = Object.values(data?.system?.activities ?? {});
  const summons = activities.filter((activity): activity is I5eSummonActivity => activity.type === "summon");
  if (summons.length === 0) return;

  const pack = CompendiumHelper.getCompendiumType("monsters", false);
  if (!pack) return;
  await pack.getIndex({ fields: ["name", "system.source.rules", "flags.ddbimporter.id"] });
  const index = [...pack.index] as {
    name?: string;
    uuid: string;
    system?: { source?: { rules?: string } };
    flags?: { ddbimporter?: { id?: number | string } };
  }[];
  const ownRules = is2024 ? "2024" : "2014";

  for (const creature of creatures) {
    const wanted = printedName(creature.name).toLowerCase();
    const named = index.filter((entry) => printedName(entry.name).toLowerCase() === wanted);
    const byId = creature.ddbId
      ? index.find((entry) => Number(entry.flags?.ddbimporter?.id) === creature.ddbId)
      : undefined;
    // not munched yet: a creature in the munch now running, or one that gives its id, will land
    // on an id that can be worked out from its name. The munch knows the name as D&D Beyond
    // spells it, which a name read from a link's slug may not match.
    const ownBatch = findInMonsterBatch(creature.name, is2024, { ownRulesOnly: true });
    const idBatch = creature.ddbId ? findInMonsterBatchById(creature.ddbId) : null;
    const anyBatch = findInMonsterBatch(creature.name, is2024);
    const givenId = creature.ddbId ? { id: creature.ddbId, name: creature.name } : null;

    let found: (typeof index)[number] | undefined;
    let pending: { id: number; name: string } | null = null;
    const ownNamed = named.find((entry) => entry.system?.source?.rules === ownRules);
    if (ownNamed) found = ownNamed;
    else if (ownBatch) pending = ownBatch;
    else if (byId) found = byId;
    else if (idBatch) pending = idBatch;
    else if (named[0]) found = named[0];
    else pending = anyBatch ?? givenId;

    if (!found && !anyBatch) {
      logger.info(`${data?.name}: ${creature.name} is not in the monster compendium; munch it to complete the summon`);
    }
    const uuid = found?.uuid ?? (pending
      ? `Compendium.${pack.metadata.id}.Actor.${utils.namedIDStub(pending.name, { postfix: pending.id })}`
      : null);
    if (!uuid) continue;
    for (const activity of summons) {
      const profile = (activity.profiles ?? []).find((entry) => entry._id === profileId(creature));
      if (!profile) continue;
      profile.uuid = uuid;
      // a name read from a link's slug loses its punctuation; the compendium has it as printed
      if (found?.name && !creature.label) profile.name = printedName(found.name);
    }
  }
}

/** The legacy postfix setting imports a superseded 2014 creature as "Wolf (Legacy)". */
function printedName(name: string | undefined): string {
  return (name ?? "").replace(/\s*\(Legacy\)\s*$/i, "");
}
