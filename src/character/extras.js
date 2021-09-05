import logger from "../logger.js";
import utils from "../utils.js";
import { parseMonsters } from "../muncher/monster/monster.js";
import { copySupportedItemFlags, srdFiddling } from "../muncher/import.js";
import { buildNPC, generateIconMap, copyExistingMonsterImages } from "../muncher/importMonster.js";
import { DDB_CONFIG } from "../ddbConfig.js";
import { ABILITIES, getAbilityMods } from "../muncher/monster/abilities.js";
import { SKILLS } from "../muncher/monster/skills.js";

const MUNCH_DEFAULTS = [
  { name: "munching-policy-update-existing", needed: true },
  { name: "munching-policy-use-srd", needed: false },
  { name: "munching-policy-use-inbuilt-icons", needed: true },
  { name: "munching-policy-use-srd-icons", needed: false },
  { name: "munching-policy-download-images", needed: true },
  { name: "munching-policy-remote-images", needed: false },
  { name: "munching-policy-use-dae-effects", needed: false },
  { name: "munching-policy-hide-description", needed: false },
  { name: "munching-policy-monster-items", needed: false },
  { name: "munching-policy-update-images", needed: false },
  { name: "munching-policy-dae-copy", needed: false },
];

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

async function updateExtras(extras, existingExtras) {
  return Promise.all(
    extras
      .filter((extra) =>
        existingExtras.some(
          (exist) =>
            exist.flags?.ddbimporter?.id === extra.flags.ddbimporter.id &&
            extra.flags?.ddbimporter?.entityTypeId === extra.flags.ddbimporter.entityTypeId
        )
      )
      .map(async (extra) => {
        const existingExtra = await existingExtras.find(
          (exist) =>
            exist.flags?.ddbimporter?.id === extra.flags.ddbimporter.id &&
            extra.flags?.ddbimporter?.entityTypeId === extra.flags.ddbimporter.entityTypeId
        );
        extra._id = existingExtra._id;
        logger.info(`Updating extra ${extra.name}`);
        await copySupportedItemFlags(existingExtra, extra);
        // await Actor.update(extra);
        await buildNPC(extra, false, true, true);
        return extra;
      })
  );
}

async function createExtras(extras, existingExtras, folderId) {
  return Promise.all(
    extras
      .filter(
        (extra) =>
          !existingExtras.some(
            (exist) =>
              exist.flags?.ddbimporter?.id === extra.flags.ddbimporter.id &&
              extra.flags?.ddbimporter?.entityTypeId === extra.flags.ddbimporter.entityTypeId
          )
      )
      .map(async (extra) => {
        if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Cannot create Extra ${extra.name}`);
        } else {
          logger.info(`Creating Extra ${extra.name}`);
          extra.folder = folderId;
          const importedExtra = await buildNPC(extra, false, false, true);
          return importedExtra;
        }
        return extra;
      })
  );
}

function generateBeastCompanionEffects(extra, characterProficiencyBonus) {
  // beast master get to add proficiency bonus to current attacks, damage, ac
  // and saving throws and skills it is proficient in.
  // extra.data.details.cr = actor.data.flags.ddbimporter.dndbeyond.totalLevels;

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
    label: "Beast Companion Effects",
    tint: "",
    disabled: false,
    selectedKey: [],
  };
  ABILITIES.filter((ability) => extra.data.abilities[ability.value].proficient >= 1).forEach((ability) => {
    const boost = {
      key: `data.abilities.${ability.value}.save`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: characterProficiencyBonus,
      priority: 20,
    };
    effect.selectedKey.push(`data.abilities.${ability.value}.save`);
    effect.changes.push(boost);
  });
  SKILLS.filter((skill) => extra.data.skills[skill.name].prof >= 1).forEach((skill) => {
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

function generateArtificerEffects(actor, extra, characterProficiencyBonus) {
  // artificer uses the actors spell attack bonus, so is a bit trickier
  // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
  extra.data.details.cr = actor.data.flags.ddbimporter.dndbeyond.totalLevels;

  let effect = {
    changes: [
      {
        key: "data.bonuses.rwak.damage",
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
    label: "Artificer Extra Effects",
    tint: "",
    disabled: false,
    selectedKey: [],
  };
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

export async function characterExtras(html, characterData, actor) {
  let munchSettings = [];
  let ddbCharacter = characterData.ddb.character;

  MUNCH_DEFAULTS.forEach((setting) => {
    logger.debug(`Loading extras munch settings ${setting.name}`);
    setting["chosen"] = game.settings.get("ddb-importer", setting.name);
    munchSettings.push(setting);
  });

  munchSettings.forEach((setting) => {
    game.settings.set("ddb-importer", setting.name, setting.needed);
  });

  try {
    logger.debug(characterData);
    if (ddbCharacter.creatures.length === 0) return;

    const folder = await utils.getOrCreateFolder(actor.folder, "Actor", `[Extras] ${actor.name}`);

    // eslint-disable-next-line complexity
    let creatures = ddbCharacter.creatures.map((creature) => {
      logger.debug("Extra data", creature);
      let mock = JSON.parse(JSON.stringify(creature.definition));
      const proficiencyBonus = DDB_CONFIG.challengeRatings.find(
        (cr) => cr.id == mock.challengeRatingId
      ).proficiencyBonus;
      const creatureGroup = DDB_CONFIG.creatureGroups.find((group) => group.id == creature.groupId);
      let creatureFlags = creatureGroup.flags;

      mock.id = creature.id;
      mock.entityTypeId = creature.entityTypeId;

      if (creature.definition.name === "Homunculus Servant") {
        creatureFlags = creatureFlags.concat(["MHPAMCM", "MHPAIM", "MHPBAL", "ARPB", "PSPB"]);
      }
      mock.creatureFlags = creatureFlags;
      mock.removedHitPoints = creature.removedHitPoints;
      mock.temporaryHitPoints = creature.temporaryHitPoints;
      mock.creatureGroup = creature.groupId;

      if (creature.name) mock.name = creature.name;

      // creature group
      mock.automatedEvcoationAnimation = getCreatureAnimationType(mock.name, creatureGroup);

      // size
      const sizeChange = getCustomValue(ddbCharacter, 46, creature.id, creature.entityTypeId);
      if (sizeChange) mock.sizeId = sizeChange;

      // hp
      const hpMaxChange = getCustomValue(ddbCharacter, 43, creature.id, creature.entityTypeId);
      if (hpMaxChange) mock.averageHitPoints = hpMaxChange;

      // creature type
      const typeChange = getCustomValue(ddbCharacter, 44, creature.id, creature.entityTypeId);
      if (typeChange) mock.typeId = typeChange;

      // ac
      const acChange = getCustomValue(ddbCharacter, 42, creature.id, creature.entityTypeId);
      if (acChange) mock.armorClass = acChange;

      // alignment
      const alignmentChange = getCustomValue(ddbCharacter, 45, creature.id, creature.entityTypeId);
      if (alignmentChange) mock.alignmentId = alignmentChange;

      // notes
      const extraNotes = getCustomValue(ddbCharacter, 47, creature.id, creature.entityTypeId);
      if (extraNotes) mock.characteristicsDescription += `\n\n${extraNotes}`;

      const creatureStats = mock.stats.filter((stat) => !creatureGroup.ownerStats.includes(stat.statId));
      const characterStats = mock.stats
        .filter((stat) => creatureGroup.ownerStats.includes(stat.statId))
        .map((stat) => {
          const value = actor.data.data.abilities[ABILITIES.find((a) => a.id === stat.statId).value].value;
          return { name: null, statId: stat.statId, value: value };
        });

      mock.stats = creatureStats.concat(characterStats);

      // permissions the same as
      mock.permission = actor.data.permission;
      mock.folder = folder.id;

      if (creatureGroup.description !== "") {
        mock.characteristicsDescription = `${creatureGroup.description}\n\n${mock.characteristicsDescription}`;
      }

      if (creatureGroup.specialQualityTitle) {
        mock.specialTraitsDescription = `${mock.specialTraitsDescription} <p><em><strong>${creatureGroup.specialQualityTitle}.</strong></em> ${creatureGroup.specialQualityText}</p>`;
      }

      if (creatureFlags.includes("ACPB")) {
        mock.armorClass += actor.data.data.attributes.prof;
      }

      // assume this is beast master
      if (creatureFlags.includes("HPLM")) {
        const ranger = ddbCharacter.classes.find((klass) => klass.definition.id === 5);
        const level = ranger ? ranger.level : 0;
        mock.averageHitPoints = Math.max(mock.averageHitPoints, 4 * level);
      }

      // homunculus servant
      if (creatureFlags.includes("MHPBAL")) {
        const artificer = ddbCharacter.classes.find((klass) => klass.definition.name === "Artificer");
        mock.averageHitPoints = parseInt(artificer.level);
      }

      if (creatureFlags.includes("AHM")) {
        const artificer = ddbCharacter.classes.find((klass) => klass.definition.name === "Artificer");
        mock.averageHitPoints = parseInt(5 * artificer.level);
      }

      if (creatureFlags.includes("MHPAIM")) {
        mock.averageHitPoints += parseInt(actor.data.data.abilities.int.mod);
      }

      if (creatureFlags.includes("MHPAMCM")) {
        const monsterConModifier = getAbilityMods(mock, DDB_CONFIG);
        mock.averageHitPoints += parseInt(monsterConModifier.con);
      }

      // add owner skill profs
      if (creatureFlags.includes("EOSKP")) {
        let newSkills = [];

        SKILLS.forEach((skill) => {
          const existingSkill = mock.skills.find((mockSkill) => skill.valueId === mockSkill.skillId);
          const characterProficient = characterData.character.character.data.skills[skill.name].value;

          const ability = ABILITIES.find((ab) => ab.value === skill.ability);
          const stat = mock.stats.find((stat) => stat.statId === ability.id).value || 10;
          const mod = DDB_CONFIG.statModifiers.find((s) => s.value == stat).modifier;

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
      }

      // add owner save profs
      if (creatureFlags.includes("EOSVP")) {
        let newSaves = [];
        ABILITIES.forEach((ability) => {
          const existingProficient = mock.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
          const characterProficient = characterData.character.character.data.abilities[ability.value].proficient;

          if (existingProficient || characterProficient) {
            const bonus = {
              bonusModifier: null,
              statId: ability.id,
            };
            newSaves.push(bonus);
          }
        });
        mock.savingThrows = newSaves;
      }

      if (creatureFlags.includes("CULGA")) {
        mock.isLegendary = false;
        mock.legendaryActionsDescription = "";
      }

      if (creatureFlags.includes("CULRA")) {
        mock.hasLair = false;
        mock.lairDescription = "";
      }

      logger.debug(mock);
      return mock;
    });
    let parsedExtras = await parseMonsters(creatures, true);
    parsedExtras = parsedExtras.actors;
    logger.debug(parsedExtras);

    const damageDiceExpression = /(\d*d\d+\s*\+*\s*)+/;
    const characterProficiencyBonus = actor.data.data.attributes.prof;
    const artificerBonusGroup = [10, 12];

    parsedExtras = parsedExtras.map((extra) => {
      if (
        extra.flags?.ddbimporter?.creatureFlags?.includes("ARPB") &&
        extra.flags?.ddbimporter?.creatureFlags?.includes("PSPB")
      ) {
        if (extra.flags?.ddbimporter?.creatureGroup === 3) {
          extra = generateBeastCompanionEffects(extra, characterProficiencyBonus);
        } else if (artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroup)) {
          // artificer uses the actors spell attack bonus, so is a bit trickier
          // we remove damage bonus later, and will also have to calculate additional attack bonus for each attack
          extra = generateArtificerEffects(actor, extra, characterProficiencyBonus);
        } else {
          // who knows!
          extra.data.details.cr = actor.data.flags.ddbimporter.dndbeyond.totalLevels;
        }
      }

      if (
        (extra.flags?.ddbimporter?.creatureFlags?.includes("DRPB") && extra.flags?.ddbimporter?.creatureGroup !== 3) ||
        // is this a artificer infusion? the infusion call actually adds this creature group, but we don't fetch that yet.
        extra.flags?.ddbimporter?.creatureGroup === 12
      ) {
        extra.items = extra.items.map((item) => {
          if (item.type === "weapon") {
            let characterAbility;

            item.data.damage.parts = item.data.damage.parts.map((part) => {
              const match = part[0].match(damageDiceExpression);
              if (match) {
                let dice = match[0];
                // the artificer creatures have the initial prof built in, lets replace it
                if (artificerBonusGroup.includes(extra.flags?.ddbimporter?.creatureGroup)) {
                  characterAbility = "int";
                  dice = match[1].trim().endsWith("+") ? match[1].trim().slice(0, -1) : match[1];
                }
                part[0] = `${dice.trim()}`;
              }

              return part;
            });

            if (characterAbility) {
              const ability = item.data.ability;
              const mod = parseInt(extra.data.abilities[ability].mod);
              const characterMod = parseInt(actor.data.data.abilities[characterAbility].mod);
              // eslint-disable-next-line no-eval
              const globalMod = parseInt(eval(actor.data.data.bonuses.rsak.attack || 0));
              item.data.attackBonus = characterMod + globalMod - mod;
            }
          }
          return item;
        });
      }

      return extra;
    });

    logger.debug("Parsed Extras:", parsedExtras);

    const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
    // const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");

    const existingExtras = await game.actors.contents
      .filter((extra) => extra.data.folder === folder.id)
      .map((extra) => extra.data);

    if (!updateBool || !updateImages) {
      if (!updateImages) {
        logger.debug("Copying monster images across...");
        parsedExtras = copyExistingMonsterImages(parsedExtras, existingExtras);
      }
    }

    let finalExtras = await srdFiddling(parsedExtras, "monsters");
    await generateIconMap(finalExtras);

    if (updateBool) await updateExtras(finalExtras, existingExtras);
    const importedExtras = await createExtras(finalExtras, existingExtras, folder.id);

    const currentAutomatedEvocationSettings = {
      isLocal: actor.getFlag("automated-evocations", "isLocal"),
      companions: actor.getFlag("automated-evocations", "isLocal"),
    };

    const companions = existingExtras.concat(importedExtras).map((extra) => {
      return {
        id: extra.id ? extra.id : extra._id,
        number: 1,
        animation: extra.data.flags?.ddbimporter?.automatedEvcoationAnimation
          ? extra.data.flags?.ddbimporter?.automatedEvcoationAnimation
          : "magic1",
      };
    });
    const newAutomatedEvocationSettings = {
      isLocal: true,
      companions,
    };
    const mergedSettings = mergeObject(currentAutomatedEvocationSettings, newAutomatedEvocationSettings);

    actor.setFlag("automated-evocations", "isLocal", mergedSettings.isLocal);
    actor.setFlag("automated-evocations", "companions", mergedSettings.companions);
  } catch (err) {
    logger.error("Failure parsing extra", err);
    logger.error(err.stack);
  } finally {
    munchSettings.forEach((setting) => {
      logger.debug(`Returning ${setting.name} to ${setting.chosen}`);
      game.settings.set("ddb-importer", setting.name, setting.chosen);
    });
  }
}
