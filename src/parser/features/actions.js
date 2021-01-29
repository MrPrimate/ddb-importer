import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import utils from "../../utils.js";
import parseTemplateString from "../templateStrings.js";
import { fixFeatures } from "./special.js";

// get actions from ddb.character.customActions
function getCustomActions(ddb, displayedAsAttack) {
  const customActions = ddb.character.customActions
    .filter((action) => action.displayAsAttack === displayedAsAttack)
    .map((action) => {
      action.dice = {
        diceString: action.diceCount && action.diceType ? `${action.diceCount}d${action.diceType}` : null,
        fixedValue: action.fixedValue,
      };

      const range = {
        aoeType: action.aoeType,
        aoeSize: action.aoeSize,
        range: action.range,
        long: action.longRange,
      };
      action.range = range;

      if (action.statId) action.abilityModifierStatId = action.statId;

      action.activation = {
        activationTime: action.activationTime,
        activationType: action.activationType,
      };

      return action;
    });

  return customActions;
}

function isMartialArtists(classes) {
  return classes.some((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
}

function getDamage(action) {
  let damage = {};
  const damageType = action.damageTypeId
    ? DICTIONARY.actions.damageType.find((type) => type.id === action.damageTypeId).name
    : null;
  const modBonus = (action.statId || action.abilityModifierStatId) && !action.isOffhand ? " + @mod" : "";
  const fixedBonus = action.dice?.fixedValue ? ` + ${action.dice.fixedValue}` : "";

  if (action.dice) {
    if (action.dice.diceString) {
      damage = {
        parts: [[action.dice.diceString + modBonus + fixedBonus, damageType]],
        versatile: "",
      };
    } else if (fixedBonus) {
      damage = {
        parts: [[fixedBonus + modBonus, damageType]],
        versatile: "",
      };
    }
  }

  return damage;
}

function martialArtsDamage(ddb, action) {
  const damageType = DICTIONARY.actions.damageType.find((type) => type.id === action.damageTypeId).name;

  // are we dealing with martial arts?
  if (action.isMartialArts && isMartialArtists(ddb.character.classes)) {
    const die = ddb.character.classes
      .filter((cls) => isMartialArtists([cls]))
      .map((cls) => {
        const feature = cls.classFeatures.find((feature) => feature.definition.name === "Martial Arts");

        if (feature && feature.levelScale && feature.levelScale.dice && feature.levelScale.dice.diceString) {
          return feature.levelScale.dice.diceString;
        } else if (action.dice !== null) {
          // On some races bite is considered a martial art, damage
          // is different and on the action itself
          return action.dice.diceString;
        } else {
          return "1";
        }
      });

    // set the weapon damage
    return {
      parts: [[die + " + @mod", damageType]],
      versatile: "",
    };
  } else if (action.dice !== null) {
    // The Lizardfolk jaws have a different base damage, its' detailed in
    // dice so lets capture that for actions if it exists
    return {
      parts: [[action.dice.diceString + " + @mod", damageType]],
      versatile: "",
    };
  } else {
    // default to basics
    return {
      parts: [["1 + @mod", damageType]],
      versatile: "",
    };
  }
}

function getLimitedUse(action, character) {
  if (
    action.limitedUse &&
    (action.limitedUse.maxUses || action.limitedUse.statModifierUsesId || action.limitedUse.useProficiencyBonus)
  ) {
    const resetType = DICTIONARY.resets.find((type) => type.id === action.limitedUse.resetType);
    let maxUses;

    if (action.limitedUse.statModifierUsesId) {
      const ability = DICTIONARY.character.abilities.find(
        (ability) => ability.id === action.limitedUse.statModifierUsesId
      ).value;
      maxUses = character.data.abilities[ability].mod;
      if (action.limitedUse.maxUses) maxUses += action.limitedUse.maxUses;
    } else if (action.limitedUse.useProficiencyBonus) {
      const multiplier = action.limitedUse.proficiencyBonusOperator ? action.limitedUse.proficiencyBonusOperator : 1;
      if (action.limitedUse.operator === 1) {
        maxUses = (character.data.attributes.prof * multiplier) + action.limitedUse.maxUses;
      } else {
        maxUses = character.data.attributes.prof;
      }
    } else {
      maxUses = action.limitedUse.maxUses;
    }
    return {
      value: maxUses - action.limitedUse.numberUsed,
      max: (maxUses) ? parseInt(maxUses) : null,
      per: resetType ? resetType.value : "",
    };
  } else {
    return {};
  }
}

function getDescription(ddb, character, action) {
  const snippet = action.snippet ? parseTemplateString(ddb, character, action.snippet, action) : "";
  const description = action.description ? parseTemplateString(ddb, character, action.description, action) : "";
  return {
    value: description !== "" ? description + (snippet !== "" ? "<h3>Summary</h3>" + snippet : "") : snippet,
    chat: snippet,
    unidentified: "",
  };
}

function getActivation(action) {
  if (action.activation) {
    const actionType = DICTIONARY.actions.activationTypes.find((type) => type.id === action.activation.activationType);
    const activation = !actionType
      ? {}
      : {
          type: actionType.value,
          cost: action.activation.activationTime || 1,
          condition: "",
        };
    return activation;
  }
  return {};
}

function getResource(character, action) {
  let consume = {
    "type": "",
    "target": "",
    "amount": null
  };
  Object.keys(character.data.resources).forEach((resource) => {
    const detail = character.data.resources[resource];
    if (action.name === detail.label) {
      consume = {
        type: "attribute",
        target: `resources.${resource}.value`,
        amount: null,
      };
    }
  });
  return consume;
}

function getWeaponType(action) {
  const entry = DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === action.attackSubtype);
  const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === action.attackTypeRange);
  return entry ? entry.value : range ? `simple${range.value}` : "simpleM";
}

function calculateRange(action, weapon) {
  if (action.range && action.range.aoeType && action.range.aoeSize) {
    weapon.data.range = { value: null, units: "self", long: "" };
    weapon.data.target = {
      value: action.range.aoeSize,
      type: DICTIONARY.actions.aoeType.find((type) => type.id === action.range.aoeType)?.value,
      units: "ft",
    };
  } else if (action.range && action.range.range) {
    weapon.data.range = {
      value: action.range.range,
      units: "ft.",
      long: action.range.long || "",
    };
  } else {
    weapon.data.range = { value: 5, units: "ft.", long: "" };
  }
  return weapon;
}

function calculateSaveAttack(action, weapon) {
  weapon.data.actionType = "save";
  weapon.data.damage = getDamage(action);

  const fixedDC = (action.fixedSaveDc) ? action.fixedSaveDc : null;
  const scaling = (fixedDC) ? fixedDC : (action.abilityModifierStatId) ? DICTIONARY.character.abilities.find((stat) => stat.id === action.abilityModifierStatId).value : "spell";

  const saveAbility = (action.saveStatId)
    ? DICTIONARY.character.abilities.find((stat) => stat.id === action.saveStatId).value
    : "";

  weapon.data.save = {
    ability: saveAbility,
    dc: fixedDC,
    scaling: scaling,
  };
  if (action.abilityModifierStatId) {
    weapon.data.ability = DICTIONARY.character.abilities.find((stat) => stat.id === action.abilityModifierStatId).value;
  }
  return weapon;
}

function calculateActionTypeOne(ddb, character, action, weapon) {
  weapon.data.actionType = "mwak";

  if (action.isMartialArts) {
    weapon.data.ability =
      action.isMartialArts && isMartialArtists(ddb.character.classes)
        ? character.data.abilities.dex.value >= character.data.abilities.str.value
          ? "dex"
          : "str"
        : "str";
    weapon.data.damage = martialArtsDamage(ddb, action);
  } else {
    // type 3
    if (action.abilityModifierStatId) {
      weapon.data.ability = DICTIONARY.character.abilities.find(
        (stat) => stat.id === action.abilityModifierStatId
      ).value;
    } else {
      weapon.data.ability = "";
    }
    weapon.data.damage = getDamage(action);
  }
  return weapon;
}

function getAttackType(ddb, character, action, weapon) {
  // lets see if we have a save stat for things like Dragon born Breath Weapon
  if (action.saveStatId) {
    weapon = calculateSaveAttack(action, weapon);
  } else if (action.actionType === 1) {
    weapon = calculateActionTypeOne(ddb, character, action, weapon);
  } else {
    if (action.rangeId && action.rangeId === 1) {
      weapon.data.actionType = "mwak";
    } else if (action.rangeId && action.rangeId === 2) {
      weapon.data.actionType = "rwak";
    } else {
      weapon.data.actionType = "other";
    }

    if (action.isMartialArts) {
      weapon.data.ability =
        action.isMartialArts && isMartialArtists(ddb.character.classes)
          ? character.data.abilities.dex.value >= character.data.abilities.str.value
            ? "dex"
            : "str"
          : "str";
      weapon.data.damage = martialArtsDamage(ddb, action);
    } else {
      if (action.abilityModifierStatId) {
        weapon.data.ability = DICTIONARY.character.abilities.find(
          (stat) => stat.id === action.abilityModifierStatId
        ).value;
      } else {
        weapon.data.ability = "";
      }
      weapon.data.damage = getDamage(action);
    }
  }
  return weapon;
}

function getAttackAction(ddb, character, action) {
  let weapon = {
    name: action.name,
    type: "weapon",
    data: JSON.parse(utils.getTemplate("weapon")),
    flags: {
      ddbimporter: {
        id: action.id,
        entityTypeId: action.entityTypeId,
        action: true,
      }
    },
  };
  logger.debug(`Getting Attack Action ${action.name}`);

  try {
    if (action.isMartialArts) {
      weapon.flags.ddbimporter.dndbeyond = {
        type: "Martial Arts",
      };
    }

    weapon.data.proficient = action.isProficient ? 1 : 0;
    weapon.data.description = getDescription(ddb, character, action);
    weapon.data.equipped = true;
    weapon.data.rarity = "common";
    weapon.data.identified = true;
    weapon.data.activation = getActivation(action);
    weapon = calculateRange(action, weapon);
    weapon = getAttackType(ddb, character, action, weapon);
    weapon.data.weaponType = getWeaponType(action);
    weapon.data.uses = getLimitedUse(action, character);
    weapon.data.consume = getResource(character, action);

    if (weapon.data.uses?.max) {
      weapon.flags.betterRolls5e = {
        "quickCharges": {
          "value": {
            "use": true,
            "resource": true
          },
          "altValue": {
            "use": true,
            "resource": true
          }
        }
      };
    }
  } catch (err) {
    utils.log(
      `Unable to Import Attack Action: ${action.name}, please log a bug report. Err: ${err.message}`,
      "extension"
    );
  }

  return weapon;
}

/**
 * Everyone has an Unarmed Strike
 * @param {*} ddb
 */
function getUnarmedStrike(ddb, character) {
  const unarmedStrikeMock = {
    limitedUse: null,
    name: "Unarmed Strike",
    description: null,
    snippet:
      "Instead of using a weapon to make a melee weapon attack, you can use an unarmed strike: a punch, kick, head-butt, or similar forceful blow (none of which count as weapons). On a hit, an unarmed strike deals bludgeoning damage equal to 1 + your Strength modifier. You are proficient with your unarmed strikes.",
    abilityModifierStatId: null,
    attackTypeRange: 1,
    actionType: 1,
    attackSubtype: 3,
    dice: null,
    value: 1,
    damageTypeId: 1,
    isMartialArts: true,
    isProficient: true,
    displayAsAttack: true,
    range: {
      range: null,
      longRange: null,
      aoeType: null,
      aoeSize: null,
      hasAoeSpecialDescription: false,
    },
    activation: {
      activationTime: 1,
      activationType: 1,
    },
    id: "unarmedStrike",
  };
  const unarmedStrike = getAttackAction(ddb, character, unarmedStrikeMock);
  return unarmedStrike;
}

/**
 * Try and parse attack actions - this will at the moment only really support basic melee attacks
 * @param {*} ddb
 * @param {*} character
 */
function getAttackActions(ddb, character) {
  return [
    // do class options here have a class id, needed for optional class features
    ddb.character.actions.class.filter((action) => utils.findClassByFeatureId(ddb, action.componentId)),
    ddb.character.actions.race,
    ddb.character.actions.feat,
    getCustomActions(ddb, true),
  ]
    .flat()
    .filter((action) => action.displayAsAttack)
    .map((action) => {
      return getAttackAction(ddb, character, action);
    });
}

/**
 * Lets Parse remaining actions
 * @param {*} ddb
 * @param {*} items
 */
function getOtherActions(ddb, character, items) {
  const actions = [
    // do class options here have a class id, needed for optional class features
    ddb.character.actions.class.filter((action) => utils.findClassByFeatureId(ddb, action.componentId)),
    ddb.character.actions.race,
    ddb.character.actions.feat,
    getCustomActions(ddb, false),
  ]
    .flat()
    .filter((action) => action.name && action.name !== "")
    .filter(
      (action) =>
        // lets grab other actions and add, make sure we don't get attack based ones that haven't parsed
        !action.displayAsAttack ||
        (action.displayAsAttack === true && !items.some((attack) => attack.name === action.name))
    )
    .map((action) => {
      logger.debug(`Getting Other Action ${action.name}`);
      let feat = {
        name: action.name,
        type: "feat",
        data: JSON.parse(utils.getTemplate("feat")),
        flags: {
          ddbimporter: {
            id: action.id,
          }
        },
      };
      feat.data.activation = getActivation(action);
      feat.data.description = getDescription(ddb, character, action);
      feat.data.uses = getLimitedUse(action, character);
      feat.data.consume = getResource(character, action);

      feat = calculateRange(action, feat);
      feat = getAttackType(ddb, character, action, feat);

      if (feat.data.uses?.max) {
        feat.flags.betterRolls5e = {
          quickCharges: {
            value: {
              use: true,
              resource: true
            },
            altValue: {
              use: true,
              resource: true
            }
          }
        };
      }

      return feat;
    });

  // FUTURE ENHANCEMENT: We maybe able to look up other entities here to get details for things like Sneak Attack
  return actions;
}

export default function parseActions(ddb, character) {
  let actions = [
    // Get Attack Actions that we know about, typically natural attacks etc
    ...getAttackActions(ddb, character),
    // Everyone has an Unarmed Strike
    getUnarmedStrike(ddb, character),
  ];
  actions = [
    ...actions,
    // Try and parse other relevant actions
    ...getOtherActions(ddb, character, actions),
  ];

  // sort alphabetically, then by action type
  actions.sort().sort((a, b) => {
    if (!a.data.activation.activationType) {
      return 1;
    } else if (!b.data.activation.activationType) {
      return -1;
    } else {
      const aActionTypeID = DICTIONARY.actions.activationTypes.find(
        (type) => type.value === a.data.activation.activationType
      ).id;
      const bActionTypeID = DICTIONARY.actions.activationTypes.find(
        (type) => type.value === b.data.activation.activationType
      ).id;
      if (aActionTypeID > bActionTypeID) {
        return 1;
      } else if (aActionTypeID < bActionTypeID) {
        return -1;
      } else {
        return 0;
      }
    }
  });

  fixFeatures(actions);
  return actions;
}
