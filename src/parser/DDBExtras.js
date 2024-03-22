import logger from "../logger.js";
import DDBMonsterFactory from "./DDBMonsterFactory.js";
import { getAbilityMods } from "./monster/helpers.js";
import DICTIONARY from "../dictionary.js";
import SETTINGS from "../settings.js";
import DDBCompanionFactory from "./companions/DDBCompanionFactory.js";
import FolderHelper from "../lib/FolderHelper.js";

function getCustomValue(ddbCharacter, typeId, valueId, valueTypeId) {
  const characterValues = ddbCharacter.characterValues;
  const customValue = characterValues.find(
    (value) => value.valueId == valueId && value.valueTypeId == valueTypeId && value.typeId == typeId
  );

  if (customValue) {
    return customValue.value;
  }
  return null;
}

function generateBeastCompanionEffects(extra, characterProficiencyBonus) {
  // beast master get to add proficiency bonus to current attacks, damage, ac
  // and saving throws and skills it is proficient in.
  // extra.system.details.cr = actor.system.flags.ddbimporter.dndbeyond.totalLevels;

  let effect = {
    changes: [
      {
        key: "data.bonuses.rwak.attack",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `+${characterProficiencyBonus}`,
        priority: 20,
      },
      {
        key: "data.bonuses.rwak.damage",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `+${characterProficiencyBonus}`,
        priority: 20,
      },
      {
        key: "data.bonuses.mwak.attack",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `+${characterProficiencyBonus}`,
        priority: 20,
      },
      {
        key: "data.bonuses.mwak.damage",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `+${characterProficiencyBonus}`,
        priority: 20,
      },
    ],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    tint: "",
    disabled: false,
    selectedKey: [],
  };
  effect.name = "Beast Companion Effects";
  DICTIONARY.character.abilities.filter((ability) => extra.system.abilities[ability.value].proficient >= 1).forEach((ability) => {
    const boost = {
      key: `data.abilities.${ability.value}.save`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: characterProficiencyBonus,
      priority: 20,
    };
    effect.selectedKey.push(`data.abilities.${ability.value}.save`);
    effect.changes.push(boost);
  });
  DICTIONARY.character.skills.filter((skill) => extra.system.skills[skill.name].prof >= 1).forEach((skill) => {
    const boost = {
      key: `data.skills.${skill.name}.mod`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: characterProficiencyBonus,
      priority: 20,
    };
    effect.selectedKey.push(`data.skills.${skill.name}.mod`);
    effect.changes.push(boost);
  });
  extra.effects = [effect];
  return extra;
}

function generateArtificerDamageEffect(actor, extra) {
  // artificer uses the actors spell attack bonus, so is a bit trickier
  // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
  extra.system.details.cr = actor.flags.ddbimporter.dndbeyond.totalLevels;

  let effect = {
    changes: [
      {
        key: "data.bonuses.rwak.damage",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "+ @prof",
        priority: 20,
      },
      {
        key: "data.bonuses.mwak.damage",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "+ @prof",
        priority: 20,
      },
    ],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    tint: "",
    disabled: false,
    selectedKey: [],
  };
  effect.name = "Artificer Extra Effects";
  extra.effects = [effect];
  return extra;
}

const creatureGroupMatrix = [
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

function getCreatureAnimationType(name, creatureGroup) {
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
  switch (name) {
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

function setExtraMunchDefaults() {
  let munchSettings = [];

  SETTINGS.MUNCH_DEFAULTS.forEach((setting) => {
    logger.debug(`Loading extras munch settings ${setting.name}`);
    setting["chosen"] = game.settings.get("ddb-importer", setting.name);
    munchSettings.push(setting);
  });

  munchSettings.forEach((setting) => {
    game.settings.set("ddb-importer", setting.name, setting.needed);
  });

  return munchSettings;

}

function revertExtraMunchDefaults(munchSettings) {
  munchSettings.forEach((setting) => {
    logger.debug(`Returning ${setting.name} to ${setting.chosen}`);
    game.settings.set("ddb-importer", setting.name, setting.chosen);
  });
}

function addOwnerSkillProficiencies(ddbCharacter, mock) {
  let newSkills = [];
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find(
    (cr) => cr.id == mock.challengeRatingId
  ).proficiencyBonus;

  DICTIONARY.character.skills.forEach((skill) => {
    const existingSkill = mock.skills.find((mockSkill) => skill.valueId === mockSkill.skillId);
    const characterProficient = ddbCharacter.data.character.system.skills[skill.name].value;
    const ability = DICTIONARY.character.abilities.find((ab) => ab.value === skill.ability);
    const stat = mock.stats.find((stat) => stat.statId === ability.id).value || 10;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;

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

function addOwnerSaveProficiencies(ddbCharacter, mock) {
// add owner save profs
  let newSaves = [];
  DICTIONARY.character.abilities.forEach((ability) => {
    const existingProficient = mock.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
    const characterProficient = ddbCharacter.abilities.withEffects[ability.value].proficient;

    if (existingProficient || characterProficient) {
      const bonus = {
        bonusModifier: null,
        statId: ability.id,
      };
      newSaves.push(bonus);
    }
  });
  mock.savingThrows = newSaves;
  return mock;
}

function addAverageHitPoints(ddbCharacterData, actor, creature, mock) {
  // hp
  const hpMaxChange = getCustomValue(ddbCharacterData, 43, creature.id, creature.entityTypeId);
  if (hpMaxChange) mock.averageHitPoints = hpMaxChange;

  // assume this is beast master
  if (mock.creatureFlags.includes("HPLM")) {
    const ranger = ddbCharacterData.classes.find((klass) => klass.definition.id === 5);
    const level = ranger ? ranger.level : 0;
    mock.averageHitPoints = Math.max(mock.averageHitPoints, 4 * level);
  }

  // homunculus servant
  // Max Hit Points Base Artificer Level
  if (mock.creatureFlags.includes("MHPBAL")) {
    const artificer = ddbCharacterData.classes.find((klass) => klass.definition.name === "Artificer");
    if (artificer) {
      mock.averageHitPoints = parseInt(artificer.level);
      foundry.utils.setProperty(mock, "hitPointDice.diceCount", artificer.level);
      foundry.utils.setProperty(mock, "hitPointDice.diceString", `${artificer.level}d${mock.hitPointDice.diceValue}`);
    }
  }

  if (mock.creatureFlags.includes("AHM")) {
    const artificer = ddbCharacterData.classes.find((klass) => klass.definition.name === "Artificer");
    if (artificer) {
      mock.averageHitPoints = parseInt(5 * artificer.level);
    }
  }

  // Max Hit Points Add Int Modifier
  if (mock.creatureFlags.includes("MHPAIM")) {
    mock.averageHitPoints += parseInt(actor.system.abilities.int.mod);
  }

  // Max Hit Points Add Monster CON Modifier
  if (mock.creatureFlags.includes("MHPAMCM")) {
    const monsterConModifier = getAbilityMods(mock, CONFIG.DDB);
    mock.averageHitPoints += parseInt(monsterConModifier.con);
  }

  return mock;
}

function addCreatureStats(mock, actor) {
  const creatureStats = mock.stats.filter((stat) => !mock.creatureGroup.ownerStats.includes(stat.statId));
  const characterStats = mock.stats
    .filter((stat) => mock.creatureGroup.ownerStats.includes(stat.statId))
    .map((stat) => {
      const value = actor.system.abilities[DICTIONARY.character.abilities.find((a) => a.id === stat.statId).value].value;
      return { name: null, statId: stat.statId, value: value };
    });

  mock.stats = creatureStats.concat(characterStats);
  return mock;
}

function addCreatureFlags(creature, mock) {
  const creatureGroup = CONFIG.DDB.creatureGroups.find((group) => group.id == creature.groupId);
  let creatureFlags = creatureGroup.flags;

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

  return mock;

}

function transformExtraToMonsterData(ddbCharacter, actor, creature) {
  let ddbCharacterData = ddbCharacter.source.ddb.character;
  logger.debug("Extra data", creature);
  let mock = foundry.utils.duplicate(creature.definition);
  mock.id = creature.id;
  mock.entityTypeId = creature.entityTypeId;
  mock = addCreatureFlags(creature, mock);

  if (creature.name) mock.name = creature.name;

  // creature group
  mock.automatedEvcoationAnimation = getCreatureAnimationType(mock.name, mock.creatureGroup);

  // size
  const sizeChange = getCustomValue(ddbCharacterData, 46, creature.id, creature.entityTypeId);
  if (sizeChange) mock.sizeId = sizeChange;

  // hp
  mock = addAverageHitPoints(ddbCharacterData, actor, creature, mock);
  mock.removedHitPoints = creature.removedHitPoints;
  mock.temporaryHitPoints = creature.temporaryHitPoints;

  // creature type
  const typeChange = getCustomValue(ddbCharacterData, 44, creature.id, creature.entityTypeId);
  if (typeChange) mock.typeId = typeChange;

  // ac
  const acChange = getCustomValue(ddbCharacterData, 42, creature.id, creature.entityTypeId);
  if (acChange) mock.armorClass = acChange;

  // alignment
  const alignmentChange = getCustomValue(ddbCharacterData, 45, creature.id, creature.entityTypeId);
  if (alignmentChange) mock.alignmentId = alignmentChange;

  // notes
  const extraNotes = getCustomValue(ddbCharacterData, 47, creature.id, creature.entityTypeId);
  if (extraNotes) mock.characteristicsDescription += `\n\n${extraNotes}`;

  // stats
  mock = addCreatureStats(mock, actor);

  // ownership the same as actor
  mock.ownership = actor.ownership;

  if (mock.creatureGroup.description !== "") {
    mock.characteristicsDescription = `${mock.creatureGroup.description}\n\n${mock.characteristicsDescription}`;
  }

  if (mock.creatureGroup.specialQualityTitle) {
    mock.specialTraitsDescription = `${mock.specialTraitsDescription} <p><em><strong>${mock.creatureGroup.specialQualityTitle}.</strong></em> ${mock.creatureGroup.specialQualityText}</p>`;
  }

  // Armor Add Proficiency Bonus
  if (mock.creatureFlags.includes("ACPB")) {
    mock.armorClass += actor.system.attributes.prof;
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

function enhanceParsedExtra(actor, extra) {
  const damageDiceExpression = /(\d*d\d+\s*\+*\s*)+/;
  const characterProficiencyBonus = actor.system.attributes.prof;
  const artificerBonusGroup = [10, 12];

  if (
    extra.flags?.ddbimporter?.creatureFlags?.includes("ARPB") // Attack Rolls Add Proficiency Bonus
    && extra.flags?.ddbimporter?.creatureFlags?.includes("PSPB") // Proficient Skills Add Proficiency Bonus
  ) {
    if (extra.flags?.ddbimporter?.creatureGroupId === 3) {
      extra = generateBeastCompanionEffects(extra, characterProficiencyBonus);
    } else if (artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroupId)) {
      // artificer uses the actors spell attack bonus, so is a bit trickier
      // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
      extra = generateArtificerDamageEffect(actor, extra, characterProficiencyBonus);
    } else {
      // who knows!
      extra.system.details.cr = actor.flags.ddbimporter.dndbeyond.totalLevels;
    }
  }

  if (
    // Damage Rolls Add Proficiency Bonus
    (extra.flags?.ddbimporter?.creatureFlags?.includes("DRPB") && extra.flags?.ddbimporter?.creatureGroupId !== 3)
    // is this a artificer infusion? the infusion call actually adds this creature group, but we don't fetch that yet.
    || extra.flags?.ddbimporter?.creatureGroupId === 12
  ) {
    extra.items = extra.items.map((item) => {
      if (item.type === "weapon") {
        let characterAbility;

        item.system.damage.parts = item.system.damage.parts.map((part) => {
          const match = part[0].match(damageDiceExpression);
          if (match) {
            let dice = match[0];
            // the artificer creatures have the initial prof built in, lets replace it
            if (artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroupId)) {
              characterAbility = "int";
              dice = match[1].trim().endsWith("+") ? match[1].trim().slice(0, -1) : match[1];
            }
            part[0] = `${dice.trim()}`;
          }

          return part;
        });

        if (characterAbility) {
          const ability = item.system.ability;
          const mod = parseInt(extra.system.abilities[ability].mod);
          const characterMod = parseInt(actor.system.abilities[characterAbility].mod);
          // eslint-disable-next-line no-eval
          const globalMod = parseInt(eval(actor.system.bonuses.rsak.attack || 0));
          item.system.attack.bonus = characterMod + globalMod - mod;
        }
      }
      return item;
    });
  }

  return extra;
}

export async function generateCharacterExtras(html, ddbCharacter, actor) {
  const munchSettings = setExtraMunchDefaults();

  try {
    logger.debug("ddbCharacter", ddbCharacter);
    if (ddbCharacter.source.ddb.character.creatures.length === 0) return;

    const folder = await FolderHelper.getOrCreateFolder(actor.folder, "Actor", `[Extras] ${actor.name}`);

    const extractedCreatures = ddbCharacter.source.ddb.character.creatures
      .map((creature) => transformExtraToMonsterData(ddbCharacter, actor, creature))
      .map((creature) => {
        creature.folder = folder.id;
        return creature;
      });

    logger.debug("Extracted creatures", foundry.utils.duplicate(extractedCreatures));
    const monsterFactory = new DDBMonsterFactory({ ddbData: extractedCreatures, extra: true });
    const parsedExtras = await monsterFactory.parse();
    logger.debug("Parsed Extras:", foundry.utils.duplicate(parsedExtras.actors));

    const enhancedExtras = parsedExtras.actors.map((extra) => enhanceParsedExtra(actor, extra));
    logger.debug("Enhanced Parsed Extras:", foundry.utils.duplicate(enhancedExtras));

    const ddbCompanionFactory = new DDBCompanionFactory(ddbCharacter, "", { actor, data: enhancedExtras });
    await ddbCompanionFactory.updateOrCreateCompanions({ folderOverride: folder });

  } catch (err) {
    logger.error("Failure parsing extra", err);
    logger.error(err.stack);
  } finally {
    revertExtraMunchDefaults(munchSettings);
  }
}
