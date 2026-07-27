import { logger, FolderHelper, utils } from "../lib/_module";
import DDBMonsterFactory from "./DDBMonsterFactory";
import { getAbilityMods, TDDBAbilityMods } from "./monster/helpers";
import { DICTIONARY, SETTINGS } from "../config/_module";
import DDBCompanionFactory from "./companions/DDBCompanionFactory";
import DDBCharacter from "./DDBCharacter";
import ChangeHelper from "./enrichers/effects/ChangeHelper";

/**
 * A creature definition after addCreatureFlags has injected the importer's
 * creature group data, so those fields are always present downstream.
 */
type TCreatureMock = IDDBCreatureDefinition & {
  creatureFlags: string[];
  creatureGroup: IDDBConfigCreatureGroup;
  creatureGroupId: number | null;
};

function getCustomValue(ddbCharacter: IDDBCharacterData, typeId: number | string, valueId: number | string, valueTypeId: number | string) {
  const characterValues = ddbCharacter.characterValues;
  // loose equality intentional: DDB sends characterValues ids as strings, callers pass numbers
  const customValue = characterValues.find(
    (value: any) => value.valueId == valueId && value.valueTypeId == valueTypeId && value.typeId == typeId,
  );

  if (customValue) {
    return customValue.value;
  }
  return null;
}

function generateBeastCompanionEffects(extra: I5eMonsterData, characterProficiencyBonus: number): I5eMonsterData {
  // beast master get to add proficiency bonus to current attacks, damage, ac
  // and saving throws and skills it is proficient in.
  // extra.system.details.cr = actor.system.flags.ddbimporter.dndbeyond.totalLevels;

  const effect: I5eEffectData & { system: Required<I5eEffectSystem> } = {
    system: {
      changes: [
        ChangeHelper.customChange(`+${characterProficiencyBonus}`, 20, "system.bonuses.rwak.attack"),
        ChangeHelper.customChange(`+${characterProficiencyBonus}`, 20, "system.bonuses.rwak.damage"),
        ChangeHelper.customChange(`+${characterProficiencyBonus}`, 20, "system.bonuses.mwak.attack"),
        ChangeHelper.customChange(`+${characterProficiencyBonus}`, 20, "system.bonuses.mwak.damage"),
      ],
    },
    duration: {
      value: null,
      units: "seconds",
    },
    tint: "",
    disabled: false,
    name: "Beast Companion Effects",
  };
  DICTIONARY.actor.abilities.filter((ability) => (extra.system.abilities?.[ability.value].proficient ?? 0) >= 1).forEach((ability) => {
    const boost = ChangeHelper.addChange(`{characterProficiencyBonus}`, 20, `data.abilities.${ability.value}.save`);
    effect.system.changes.push(boost);
  });
  DICTIONARY.actor.skills.filter((skill) => (extra.system.skills?.[skill.name].value ?? 0) >= 1).forEach((skill) => {
    const boost = ChangeHelper.addChange(`{characterProficiencyBonus}`, 20, `data.skills.${skill.name}.mod`);
    effect.system.changes.push(boost);
  });
  extra.effects = [effect];
  return extra;
}

function generateArtificerDamageEffect(actor: TImporterActor, extra: I5eMonsterData): I5eMonsterData {
  // artificer uses the actors spell attack bonus, so is a bit trickier
  // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
  if (extra.system.details) {
    extra.system.details.cr = actor.flags.ddbimporter?.dndbeyond?.totalLevels;
  }

  const effect: I5eEffectData = {
    system: {
      changes: [
        ChangeHelper.customChange("+ @prof", 20, "data.bonuses.rwak.damage"),
        ChangeHelper.customChange("+ @prof", 20, "data.bonuses.mwak.damage"),
      ],
    },
    duration: {
      value: null,
      units: "seconds",
    },
    tint: "",
    disabled: false,
    name: "Artificer Extra Effects",
  };
  extra.effects = [effect];
  return extra;
}

interface ICreatureGroupMember {
  id: number;
  name: string;
  animation: string;
}

const creatureGroupMatrix: ICreatureGroupMember[] = [
  {
    id: 1,
    name: "Wildshape",
    animation: "fourelements",
  },
  {
    id: 2,
    name: "Familiar",
    animation: "magic1",
  },
  {
    id: 3,
    name: "Beast Companion",
    animation: "fourelements",
  },
  {
    id: 4,
    name: "Mount",
    animation: "heart",
  },
  {
    id: 5,
    name: "Pet",
    animation: "heart",
  },
  {
    id: 6,
    name: "Summoned",
    animation: "magic1",
  },
  {
    id: 7,
    name: "Misc",
    animation: "magic1",
  },
  {
    id: 10,
    name: "Battle Smith Defender",
    animation: "energy1",
  },
  {
    id: 11,
    name: "Sidekick",
    animation: "energy1",
  },
  {
    id: 12,
    name: "Infusion",
    animation: "energy1",
  },
];

function getCreatureAnimationType(name: string, creatureGroup: IDDBConfigCreatureGroup): string {
  // "fire":
  // "air":
  // "lightning":
  // "water":
  // "energy1":
  // "magic1":
  // "heart":
  // "music":
  // "fourelements":
  const checkName = name.toLowerCase();
  let animation = "magic1";
  // switch on true so the includes() cases actually match (was switch(name), which never matched)
  switch (true) {
    case checkName.includes("flame"):
    case checkName.includes("fire"):
      animation = "fire";
      break;
    case checkName.includes("air"):
    case checkName.includes("wind"):
      animation = "air";
      break;
    case checkName.includes("lightning"):
    case checkName.includes("thunder"):
      animation = "lightning";
      break;
    case checkName.includes("water"):
    case checkName.includes("aqua"):
      animation = "water";
      break;
    case checkName.includes("energy"):
    case checkName.includes("construct"):
      animation = "energy1";
      break;
    case checkName.includes("magic"):
    case checkName.includes("arcane"):
      animation = "magic1";
      break;
    default: {
      const match = creatureGroupMatrix.find((group) => group.id === creatureGroup.id);
      if (match) {
        animation = match.animation;
      }
    }
  }

  return animation;
}

function setExtraMunchDefaults(): IMuncherDefaultSetting[] {
  const munchSettings: IMuncherDefaultSetting[] = [];

  SETTINGS.MUNCH_DEFAULTS.forEach((setting) => {
    logger.debug(`Loading extras munch settings ${setting.name}`);
    setting.chosen = utils.getSetting<string>(setting.name);
    munchSettings.push(setting);
  });

  munchSettings.forEach((setting) => {
    utils.setSetting(setting.name, setting.needed);
  });

  return munchSettings;

}

function revertExtraMunchDefaults(munchSettings: IMuncherDefaultSetting[]) {
  munchSettings.forEach((setting) => {
    logger.debug(`Returning ${setting.name} to ${setting.chosen}`);
    utils.setSetting(setting.name, setting.chosen);
  });
}

function addOwnerSkillProficiencies(ddbCharacter: DDBCharacter, mock: TCreatureMock) {
  const newSkills: IDDBMonsterSkill[] = [];
  const crData = CONFIG.DDB.challengeRatings.find(
    (cr) => cr.id === mock.challengeRatingId,
  );
  if (!crData) {
    logger.warn(`Unknown challenge rating id ${mock.challengeRatingId} for ${mock.name}, defaulting proficiency bonus to 2`);
  }
  const proficiencyBonus = crData?.proficiencyBonus ?? 2;

  DICTIONARY.actor.skills.forEach((skill) => {
    const existingSkill = mock.skills.find((mockSkill: any) => skill.valueId === mockSkill.skillId);
    const characterProficient = ddbCharacter.data.character.system.skills?.[skill.name].value;
    const ability = DICTIONARY.actor.abilities.find((ab) => ab.value === skill.ability);
    if (!ability) {
      logger.warn(`Unknown ability ${skill.ability} for skill ${skill.name}, skipping proficiency check`);
      return;
    }
    const stat = mock.stats.find((stat: any) => stat.statId === ability.id)?.value || 10;
    // fall back to the standard 5e formula if the score is outside the DDB config table
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value === stat)?.modifier ?? Math.floor((stat - 10) / 2);

    if (existingSkill && characterProficient === 2) {
      const doubleProf = proficiencyBonus * 2;
      newSkills.push({
        skillId: skill.valueId,
        value: mod + doubleProf,
        additionalBonus: null,
      });
    } else if (existingSkill) {
      newSkills.push(existingSkill);
    } else if (characterProficient === 1) {
      newSkills.push({
        skillId: skill.valueId,
        value: mod + proficiencyBonus,
        additionalBonus: null,
      });
    }
  });
  mock.skills = newSkills;

  return mock;
}

function addOwnerSaveProficiencies(ddbCharacter: DDBCharacter, mock: TCreatureMock) {
// add owner save profs
  const newSaves: { statId: number; bonusModifier: number | null }[] = [];
  DICTIONARY.actor.abilities.forEach((ability) => {
    const existingProficient = mock.savingThrows.find((stat: any) => stat.statId === ability.id) ? 1 : 0;
    const characterProficient = ddbCharacter.abilities.withEffects[ability.value].proficient;

    if (existingProficient || characterProficient) {
      const bonus = {
        bonusModifier: null as number | null,
        statId: ability.id,
      };
      newSaves.push(bonus);
    }
  });
  mock.savingThrows = newSaves;
  return mock;
}

function addAverageHitPoints(ddbCharacterData: IDDBCharacterData, actor: TImporterActor, creature: IDDBCreature, mock: TCreatureMock) {
  // hp
  const hpMaxChange = getCustomValue(ddbCharacterData, 43, creature.id, creature.entityTypeId);
  if (hpMaxChange) mock.averageHitPoints = parseInt(String(hpMaxChange));

  // assume this is beast master
  if (mock.creatureFlags.includes("HPLM")) {
    const ranger = ddbCharacterData.classes.find((klass: any) => klass.definition.id === 5);
    const level = ranger ? ranger.level : 0;
    mock.averageHitPoints = Math.max(mock.averageHitPoints, 4 * level);
  }

  // homunculus servant
  // Max Hit Points Base Artificer Level
  if (mock.creatureFlags.includes("MHPBAL")) {
    const artificer = ddbCharacterData.classes.find((klass: any) => klass.definition.name === "Artificer");
    if (artificer) {
      mock.averageHitPoints = parseInt(String(artificer.level));
      foundry.utils.setProperty(mock, "hitPointDice.diceCount", artificer.level);
      foundry.utils.setProperty(mock, "hitPointDice.diceString", `${artificer.level}d${mock.hitPointDice.diceValue}`);
    }
  }

  if (mock.creatureFlags.includes("AHM")) {
    const artificer = ddbCharacterData.classes.find((klass: any) => klass.definition.name === "Artificer");
    if (artificer) {
      mock.averageHitPoints = 5 * parseInt(String(artificer.level));
    }
  }

  // Max Hit Points Add Int Modifier
  if (mock.creatureFlags.includes("MHPAIM")) {
    mock.averageHitPoints += utils.calculateModifier((actor.system as I5ePCSystemData).abilities!.int.value!);
  }

  // Max Hit Points Add Monster CON Modifier
  if (mock.creatureFlags.includes("MHPAMCM")) {
    const monsterConModifier: TDDBAbilityMods = getAbilityMods(mock);
    mock.averageHitPoints += monsterConModifier.con;
  }

  return mock;
}

function addCreatureStats(mock: TCreatureMock, actor: TImporterActor) {
  const creatureStats = mock.stats.filter((stat) => !mock.creatureGroup.ownerStats.includes(stat.statId));
  const characterStats = mock.stats
    .filter((stat) => mock.creatureGroup.ownerStats.includes(stat.statId))
    .map((stat) => {
      const abilityKey = DICTIONARY.actor.abilities.find((a) => a.id === stat.statId)?.value;
      const value = abilityKey
        ? (actor.system as I5ePCSystemData).abilities?.[abilityKey].value
        : undefined;
      return { name: null as string | null, statId: stat.statId, value: value ?? 10 };
    });

  mock.stats = creatureStats.concat(characterStats);
  return mock;
}

function addCreatureFlags(creature: IDDBCreature, mock: IDDBCreatureDefinition): TCreatureMock {
  let creatureGroup = CONFIG.DDB.creatureGroups.find((group) => group.id === creature.groupId);
  if (!creatureGroup) {
    logger.warn(`Unknown creature group id ${creature.groupId} for ${creature.definition?.name}, no group flags applied`);
    // minimal stand-in so downstream consumers of mock.creatureGroup don't crash
    creatureGroup = {
      id: creature.groupId,
      name: "Unknown",
      flags: [],
      ownerStats: [],
      description: "",
      specialQualityTitle: null,
      specialQualityText: null,
    };
  }
  let creatureFlags = creatureGroup.flags ?? [];

  if (creature.definition.name === "Homunculus Servant") {
    // Max Hit Points Add Monster CON Modifier
    // Max Hit Points Add Int Modifier
    // Max Hit Points Base Artificer Level
    // Attack Rolls Add Proficiency Bonus
    // Proficient Skills Add Proficiency Bonus
    creatureFlags = creatureFlags.concat(["MHPAMCM", "MHPAIM", "MHPBAL", "ARPB", "PSPB"]);
  }
  mock.creatureFlags = creatureFlags;
  mock.creatureGroupId = creature.groupId;
  mock.creatureGroup = creatureGroup;

  // the three assignments above make this a TCreatureMock
  return mock as TCreatureMock;

}

function transformExtraToMonsterData(ddbCharacter: DDBCharacter, actor: TImporterActor, creature: IDDBCreature): IDDBCreatureDefinition {
  if (!ddbCharacter.source) {
    throw new Error("DDBCharacter has no source data, unable to transform extra creature");
  }
  const ddbCharacterData: IDDBCharacterData = ddbCharacter.source.ddb.character;
  logger.debug("Extra data", creature);
  const baseMock: IDDBCreatureDefinition = foundry.utils.duplicate(creature.definition) as IDDBCreatureDefinition;
  baseMock.id = creature.id;
  baseMock.entityTypeId = creature.entityTypeId;
  let mock: TCreatureMock = addCreatureFlags(creature, baseMock);

  if (creature.name) mock.name = creature.name;

  // creature group
  mock.automatedEvocationAnimation = getCreatureAnimationType(mock.name, mock.creatureGroup);

  // size
  const sizeChange = getCustomValue(ddbCharacterData, 46, creature.id, creature.entityTypeId);
  if (sizeChange) mock.sizeId = parseInt(String(sizeChange));

  // hp
  mock = addAverageHitPoints(ddbCharacterData, actor, creature, mock);
  mock.removedHitPoints = creature.removedHitPoints;
  mock.temporaryHitPoints = creature.temporaryHitPoints;

  // creature type
  const typeChange = getCustomValue(ddbCharacterData, 44, creature.id, creature.entityTypeId);
  if (typeChange) mock.typeId = parseInt(String(typeChange));

  // ac
  const acChange = getCustomValue(ddbCharacterData, 42, creature.id, creature.entityTypeId);
  if (acChange) mock.armorClass = parseInt(String(acChange));

  // alignment
  const alignmentChange = getCustomValue(ddbCharacterData, 45, creature.id, creature.entityTypeId);
  if (alignmentChange) mock.alignmentId = parseInt(String(alignmentChange));

  // notes
  const extraNotes = getCustomValue(ddbCharacterData, 47, creature.id, creature.entityTypeId);
  if (extraNotes) mock.characteristicsDescription += `\n\n${extraNotes}`;

  // stats
  mock = addCreatureStats(mock, actor);

  // ownership the same as actor
  mock.ownership = actor.ownership as unknown as IFoundryOwnership;

  if (mock.creatureGroup.description !== "") {
    mock.characteristicsDescription = `${mock.creatureGroup.description}\n\n${mock.characteristicsDescription}`;
  }

  if (mock.creatureGroup.specialQualityTitle) {
    mock.specialTraitsDescription = `${mock.specialTraitsDescription} <p><em><strong>${mock.creatureGroup.specialQualityTitle}.</strong></em> ${mock.creatureGroup.specialQualityText}</p>`;
  }

  // Armor Add Proficiency Bonus
  if (mock.creatureFlags.includes("ACPB")) {
    mock.armorClass += actor.flags.ddbimporter?.dndbeyond?.profBonus ?? 0;
  }

  // Evaluate Owner Skill Proficiencies
  if (mock.creatureFlags.includes("EOSKP")) {
    mock = addOwnerSkillProficiencies(ddbCharacter, mock);
  }

  // Evaluate Owner Save Proficiencies
  if (mock.creatureFlags.includes("EOSVP")) {
    mock = addOwnerSaveProficiencies(ddbCharacter, mock);
  }

  // Cannot Use Legendary Actions
  if (mock.creatureFlags.includes("CULGA")) {
    mock.isLegendary = false;
    mock.legendaryActionsDescription = "";
  }

  // Cannot Use Lair Actions
  if (mock.creatureFlags.includes("CULRA")) {
    mock.hasLair = false;
    mock.lairDescription = "";
  }

  logger.debug("mock creature", mock);
  return mock;

}

function enhanceParsedExtra(actor: TSyncCharacterActor, extra: I5eMonsterData) {
  // `TODO: this probably is a flag now
  const characterProficiencyBonus = actor.flags.ddbimporter?.dndbeyond?.profBonus ?? 0;
  const artificerBonusGroup = [10, 12];

  if (
    extra.flags?.ddbimporter?.creatureFlags?.includes("ARPB") // Attack Rolls Add Proficiency Bonus
    && extra.flags?.ddbimporter?.creatureFlags?.includes("PSPB") // Proficient Skills Add Proficiency Bonus
  ) {
    if (extra.flags?.ddbimporter?.creatureGroupId === 3) {
      extra = generateBeastCompanionEffects(extra, characterProficiencyBonus);
    } else if (artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroupId ?? -1)) {
      // artificer uses the actors spell attack bonus, so is a bit trickier
      // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
      extra = generateArtificerDamageEffect(actor, extra);
    } else if (extra.system.details) {
      // who knows!
      extra.system.details.cr = actor.flags.ddbimporter?.dndbeyond?.totalLevels;
    }
  }

  if (
    // Damage Rolls Add Proficiency Bonus
    (extra.flags?.ddbimporter?.creatureFlags?.includes("DRPB") && extra.flags?.ddbimporter?.creatureGroupId !== 3)
    // is this a artificer infusion? the infusion call actually adds this creature group, but we don't fetch that yet.
    || extra.flags?.ddbimporter?.creatureGroupId === 12
  ) {
    const isArtificer = artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroupId ?? -1);
    const intMod = utils.calculateModifier(actor.system.abilities?.int.value ?? 10);
    const globalMod = Number(actor.system.bonuses?.rsak?.attack || 0);

    extra.items = extra.items.map((item) => {
      if (item.type !== "weapon" || !isArtificer) return item;

      // Artificer companions bake the creature's own prof/ability bonus into the
      // base weapon damage; the damage prof is re-applied via the "@prof" effect
      // (generateArtificerDamageEffect), so strip the flat bonus from the single
      // base damage object (this used to be an array of formula/type tuples).
      if (item.system.damage?.base) {
        item.system.damage.base.bonus = "";
      }

      // Attacks should use the character's spell attack (int + global rsak bonus)
      // rather than the companion's own ability. Attack data now lives on the
      // attack activity, so correct each attack activity's flat bonus.
      for (const activity of Object.values(item.system.activities ?? {})) {
        if (activity.type !== "attack" || !activity.attack) continue;
        const ability = activity.attack.ability === ""
          ? "str"
          : activity.attack.ability as T5eAbility;
        const extraMod = utils.calculateModifier(extra.system.abilities?.[ability]?.value ?? 10);
        const mod = ability ? extraMod : 0;
        activity.attack.bonus = `${intMod + globalMod - mod}`;
      }

      return item;
    });
  }

  return extra;
}

export async function generateCharacterExtras(_html: any, ddbCharacter: DDBCharacter, actor: TImporterActor) {
  const munchSettings = setExtraMunchDefaults();

  try {
    logger.debug("ddbCharacter", ddbCharacter);
    const source = ddbCharacter.source;
    if (!source) {
      logger.error("No DDB source data on character, unable to generate extras");
      return;
    }
    if (source.ddb.character.creatures.length === 0) return;

    // fvtt-types does not resolve the actor's folder field to Folder.Implementation here
    const folder = await FolderHelper.getOrCreateFolder(actor.folder as Folder.Implementation | null, "Actor", `[Extras] ${actor.name}`);

    const extractedCreatures = source.ddb.character.creatures
      .map((creature) => transformExtraToMonsterData(ddbCharacter, actor, creature))
      .map((creature) => {
        creature.folder = folder.id;
        return creature;
      });

    logger.debug("Extracted creatures", foundry.utils.duplicate(extractedCreatures));
    const keyPostfix = actor.id;
    const useLocalKey = foundry.utils.getProperty(actor, "flags.ddbimporter.useLocalPatreonKey") as boolean ?? false;

    const monsterFactory = new DDBMonsterFactory({
      // this is fine for now
      ddbData: extractedCreatures as unknown as IDDBMonsterSourceData[],
      extra: true,
      keyPostfix,
      useLocalKey,
    });
    const parsedExtras = await monsterFactory.parse();
    logger.debug("Parsed Extras:", foundry.utils.duplicate(parsedExtras.actors));

    const enhancedExtras = parsedExtras.actors.map((extra) => enhanceParsedExtra(actor as TSyncCharacterActor, extra));
    logger.debug("Enhanced Parsed Extras:", foundry.utils.duplicate(enhancedExtras));

    const ddbCompanionFactory = new DDBCompanionFactory("", {
      actor,
      data: enhancedExtras,
      noCompendiums: true,
    });
    await ddbCompanionFactory.init();
    await ddbCompanionFactory.updateOrCreateCompanions({ folderOverride: folder });

  } catch (err) {
    logger.error("Failure parsing extra", err);
    if (err instanceof Error) logger.error(err.stack);
  } finally {
    revertExtraMunchDefaults(munchSettings);
  }
}
