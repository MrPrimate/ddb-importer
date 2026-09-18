import logger from "../../../lib/Logger";
import DDBMonsterFactory from "../../DDBMonsterFactory";
import { getSRDObjects } from "./SRDObjects";
import { findSRDItemSummon, srdCreatureKey } from "./SRDItemSummonTable";

interface ISRDCreature {
  name: string;
  ddbId: string;
  source: "2014" | "2024";
}

/**
 * Build summon actors from published DDB monsters, for spells that call ordinary creatures
 * rather than carrying their own stat block. The key each actor is stored under is
 * `<keyPrefix><Name without spaces><source>`, which is what an enricher's `profileKeys` names.
 */
async function getCreatureSummons({ creatures, keyPrefix, folderName }: {
  creatures: ISRDCreature[];
  keyPrefix: string;
  folderName: string;
}): Promise<ICompanionResult> {
  const result: ICompanionResult = {};
  if (creatures.length === 0) return result;

  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: creatures.map((creature) => parseInt(creature.ddbId)) });
  const monsterResults = await monsterFactory.parse();

  for (const creature of creatures) {
    const stub = monsterResults.actors.find((actor) =>
      actor.name === creature.name
      && actor.system.source?.rules === creature.source,
    );
    if (!stub) continue;

    result[`${keyPrefix}${creature.name.replaceAll(" ", "")}${creature.source}`] = {
      name: creature.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName,
      data: stub,
    };
  }

  logger.verbose(`${folderName} summons result`, result);
  return result;
}

/** The five steeds the 2014 spell names; the 2024 spell has its own Otherworldly Steed block. */
export async function getFindSteed2014(_data: ICompanionData): Promise<ICompanionResult> {
  return getCreatureSummons({
    keyPrefix: "FindSteed",
    folderName: "Find Steed",
    creatures: [
      { name: "Warhorse", ddbId: "17049", source: "2014" },
      { name: "Pony", ddbId: "16984", source: "2014" },
      { name: "Camel", ddbId: "16819", source: "2014" },
      { name: "Elk", ddbId: "16857", source: "2014" },
      { name: "Mastiff", ddbId: "16953", source: "2014" },
    ],
  });
}

/** The giant forms the 2014 spell transforms vermin into; the 2024 spell has its own block. */
export async function getGiantInsect2014(_data: ICompanionData): Promise<ICompanionResult> {
  return getCreatureSummons({
    keyPrefix: "GiantInsect",
    folderName: "Giant Insect",
    creatures: [
      { name: "Giant Centipede", ddbId: "16877", source: "2014" },
      { name: "Giant Spider", ddbId: "16895", source: "2014" },
      { name: "Giant Wasp", ddbId: "16898", source: "2014" },
      { name: "Giant Scorpion", ddbId: "16892", source: "2014" },
    ],
  });
}

/**
 * DDB monster ids for the ordinary creatures SRD magic items and spells call, per ruleset. Giant Fly and
 * Avatar of Death are Dungeon Master's Guide monsters DDB publishes once for both rulesets.
 */
const CREATURE_IDS: Record<string, { "2014": string; "2024": string }> = {
  "Air Elemental": { "2014": "16774", "2024": "5194878" },
  "Ape": { "2014": "16788", "2024": "4775801" },
  "Awakened Shrub": { "2014": "16791", "2024": "5194905" },
  "Awakened Tree": { "2014": "16792", "2024": "5194906" },
  "Axe Beak": { "2014": "16793", "2024": "5194907" },
  "Baboon": { "2014": "16795", "2024": "5194910" },
  "Badger": { "2014": "16796", "2024": "4775802" },
  "Berserker": { "2014": "16805", "2024": "4904621" },
  "Black Bear": { "2014": "16806", "2024": "4775804" },
  "Boar": { "2014": "16812", "2024": "4775805" },
  "Brown Bear": { "2014": "16816", "2024": "4775806" },
  "Clay Golem": { "2014": "16825", "2024": "5194945" },
  "Dire Wolf": { "2014": "16841", "2024": "4775812" },
  "Djinni": { "2014": "16842", "2024": "5194971" },
  "Earth Elemental": { "2014": "16853", "2024": "5194980" },
  "Efreeti": { "2014": "16854", "2024": "5194981" },
  "Elephant": { "2014": "16855", "2024": "4775814" },
  "Fire Elemental": { "2014": "16861", "2024": "4904758" },
  "Flesh Golem": { "2014": "16863", "2024": "5194997" },
  "Giant Badger": { "2014": "16874", "2024": "4775817" },
  "Giant Boar": { "2014": "16876", "2024": "5195013" },
  "Giant Constrictor Snake": { "2014": "16878", "2024": "5195015" },
  "Giant Elk": { "2014": "16882", "2024": "5195018" },
  "Giant Fly": { "2014": "27750", "2024": "27750" },
  "Giant Goat": { "2014": "16885", "2024": "4775819" },
  "Giant Hyena": { "2014": "16886", "2024": "5195021" },
  "Giant Owl": { "2014": "16889", "2024": "5195024" },
  "Giant Rat": { "2014": "16891", "2024": "5195025" },
  "Giant Weasel": { "2014": "16899", "2024": "4775822" },
  "Goat": { "2014": "16906", "2024": "4775823" },
  "Griffon": { "2014": "16913", "2024": "5195062" },
  "Iron Golem": { "2014": "16935", "2024": "5195090" },
  "Jackal": { "2014": "16936", "2024": "5195091" },
  "Lion": { "2014": "16944", "2024": "4775826" },
  "Mastiff": { "2014": "16953", "2024": "4775828" },
  "Nightmare": { "2014": "16964", "2024": "5195143" },
  "Owl": { "2014": "16974", "2024": "4775831" },
  "Panther": { "2014": "16976", "2024": "4775832" },
  "Rat": { "2014": "16991", "2024": "4775836" },
  "Raven": { "2014": "16992", "2024": "4775837" },
  "Riding Horse": { "2014": "16997", "2024": "4775839" },
  "Roc": { "2014": "16998", "2024": "5195184" },
  "Stone Golem": { "2014": "17025", "2024": "4904850" },
  "Swarm of Rats": { "2014": "17032", "2024": "5195228" },
  "Tiger": { "2014": "17036", "2024": "4775846" },
  "Water Elemental": { "2014": "17051", "2024": "5195261" },
  "Weasel": { "2014": "17052", "2024": "4775849" },
};

/**
 * Build the named creatures for the importing ruleset. Every item shares one folder and one key
 * per creature, so the Mastiff behind a Bag of Tricks and an Onyx Dog is a single actor.
 */
export async function getSRDCreatures(names: string[], is2014: boolean): Promise<ICompanionResult> {
  const source = is2014 ? "2014" : "2024";
  const creatures = names.filter((name) => CREATURE_IDS[name]).map((name) => ({ name, ddbId: CREATURE_IDS[name][source] }));
  const result: ICompanionResult = {};
  if (creatures.length === 0) return result;

  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: [...new Set(creatures.map((creature) => parseInt(creature.ddbId)))] });
  const monsterResults = await monsterFactory.parse();

  for (const creature of creatures) {
    // a monster DDB publishes once carries one ruleset tag, so fall back to the name alone
    const stub = monsterResults.actors.find((actor) => actor.name === creature.name && actor.system.source?.rules === source)
      ?? monsterResults.actors.find((actor) => actor.name === creature.name);
    if (!stub) continue;
    result[srdCreatureKey(creature.name, is2014)] = {
      name: creature.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "SRD Creatures",
      data: stub,
    };
  }
  logger.verbose("SRD creature summons result", result);
  return result;
}

/** Every actor an SRD summoning item places: its published creatures and its object tokens. */
export async function getSRDItemSummons({ ddbParser }: ICompanionData): Promise<ICompanionResult> {
  const entry = findSRDItemSummon(ddbParser.originalName);
  if (!entry) return {};
  const creatures = entry.profiles.flatMap((profile) => (profile.creature ? [profile.creature] : []));
  const objects = entry.profiles.flatMap((profile) => (profile.object ? [profile.object] : []));
  return {
    ...(await getSRDCreatures(creatures, ddbParser.is2014)),
    ...(await getSRDObjects(objects)),
  };
}

/** The bare tokens the object spells place. */
export async function getFloatingDisk(_data: ICompanionData): Promise<ICompanionResult> {
  return getSRDObjects(["SRDObjectFloatingDisk"]);
}

export async function getSecretChest(_data: ICompanionData): Promise<ICompanionResult> {
  return getSRDObjects(["SRDObjectSecretChest"]);
}

/** The two plant creatures Awaken can make, from the stat blocks of the importing ruleset. */
export async function getAwaken({ ddbParser }: ICompanionData): Promise<ICompanionResult> {
  return getSRDCreatures(["Awakened Shrub", "Awakened Tree"], ddbParser.is2014);
}
