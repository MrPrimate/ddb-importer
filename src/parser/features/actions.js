import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import utils from "../../utils.js";
import parseTemplateString from "../templateStrings.js";
import { fixFeatures, stripHtml, addFeatEffects, addExtraEffects } from "./special.js";
import { getInfusionActionData } from "../inventory/infusions.js";

function getResourceFlags(character, action, flags) {
  const linkItems = utils.isModuleInstalledAndActive("link-item-resource-5e");
  const resourceType = getProperty(character, "flags.ddbimporter.resources.type");
  if (resourceType !== "disable" && linkItems) {
    const hasResourceLink = getProperty(flags, "link-item-resource-5e.resource-link");
    Object.keys(character.data.resources).forEach((resource) => {
      const detail = character.data.resources[resource];
      if (action.name === detail.label) {
        setProperty(flags, "link-item-resource-5e.resource-link", resource);
        character.data.resources[resource] = { value: 0, max: 0, sr: false, lr: false, label: "" };
      } else if (hasResourceLink === resource) {
        setProperty(flags, "link-item-resource-5e.resource-link", undefined);
      }
    });
  }
  return flags;
}

function addFlagHints(ddb, character, action, feature) {
  const klassAction = ddb.character.actions.class
    .filter((ddbAction) => utils.findClassByFeatureId(ddb, ddbAction.componentId))
    .find((ddbAction) => {
      const name = utils.getName(ddbAction, character);
      return name === feature.name;
    });
  const raceAction = ddb.character.actions.race
    .some((ddbAction) => {
      const name = utils.getName(ddbAction, character);
      return name === feature.name;
    });
  const featAction = ddb.character.actions.feat
    .some((ddbAction) => {
      const name = utils.getName(ddbAction, character);
      return name === feature.name;
    });

  // obsidian and klass names (used in effect enrichment)
  if (klassAction) {
    const klass = utils.findClassByFeatureId(ddb, klassAction.componentId);
    setProperty(feature.flags, "obsidian.source.type", "class");
    setProperty(feature.flags, "obsidian.source.text", klass.definition.name);
    setProperty(feature.flags, "ddbimporter.class", klass.definition.name);
    const subClassName = hasProperty(klass, "subclassDefinition.name") ? klass.subclassDefinition.name : undefined;
    setProperty(feature.flags, "ddbimporter.subclass", subClassName);
  } else if (raceAction) {
    feature.flags.obsidian.source.type = "race";
  } else if (featAction) {
    feature.flags.obsidian.source.type = "feat";
  }

  // scaling details
  let klassActionComponent = utils.findComponentByComponentId(ddb, action.id);
  if (!klassActionComponent) klassActionComponent = utils.findComponentByComponentId(ddb, action.componentId);
  if (klassActionComponent) {
    setProperty(feature.flags, "ddbimporter.dndbeyond.levelScale", klassActionComponent.levelScale);
    setProperty(feature.flags, "ddbimporter.dndbeyond.levelScales", klassActionComponent.definition?.levelScales);
    setProperty(feature.flags, "ddbimporter.dndbeyond.limitedUse", klassActionComponent.definition?.limitedUse);
  }

  // better rolls
  if (utils.isModuleInstalledAndActive("betterrolls5e")) {
    if (feature.data.uses?.max) {
      feature.flags.betterRolls5e = {
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
  }

  // resource flag hints
  feature.flags = getResourceFlags(character, action, feature.flags);

  return feature;
}

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

  // when the action type is not set to melee or ranged we don't apply the mod to damage
  const meleeOrRangedAction = action.attackTypeRange || action.rangeId;
  const modBonus = (action.statId || action.abilityModifierStatId) && !action.isOffhand && meleeOrRangedAction ? " + @mod" : "";
  const fixedBonus = action.dice?.fixedValue ? ` + ${action.dice.fixedValue}` : "";
  const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");

  if (action.dice) {
    if (action.dice.diceString) {
      const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
      const damageString = utils.parseDiceString(action.dice.diceString, modBonus + fixedBonus, damageTag).diceString;
      damage = {
        parts: [[damageString, damageType]],
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

/**
 * Some features have actions that use dice and mods that are defined on the character class feature
 * this attempts to parse out the damage dice and any ability modifier.
 * This relies on the parsing of templateStrings for the ability modifier detection.
 * @param {*} ddb
 * @param {*} character
 * @param {*} action
 * @param {*} feat
 */
function getLevelScaleDice(ddb, character, action, feat) {
  let parts = ddb.character.classes
    .filter((cls) => cls.classFeatures.some((feature) =>
      feature.definition.id == action.componentId &&
      feature.definition.entityTypeId == action.componentTypeId &&
      feature.levelScale?.dice?.diceString
    ))
    .map((cls) => {
      const feature = cls.classFeatures.find((feature) =>
        feature.definition.id == action.componentId &&
        feature.definition.entityTypeId == action.componentTypeId
      );
      const parsedString = character.flags.ddbimporter.dndbeyond.templateStrings.find((templateString) =>
        templateString.id == action.id &&
        templateString.entityTypeId == action.entityTypeId
      );
      let part = feature.levelScale.dice.diceString;
      if (parsedString) {
        const modifier = parsedString.definitions.find((definition) => definition.type === "modifier");
        if (modifier) {
          feat.data.ability = modifier.subType;
          part = `${part} + @mod`;
        }
      }
      return [part, ""];
    });

  feat.data.damage = {
    parts: parts,
    versatile: "",
  };

  return feat;
}

function martialArtsDamage(ddb, action) {
  const damageType = DICTIONARY.actions.damageType.find((type) => type.id === action.damageTypeId).name;
  const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");

  let damageBonus = utils.filterBaseModifiers(ddb, "damage", "unarmed-attacks").reduce((prev, cur) => prev + cur.value, 0);
  if (damageBonus === 0) {
    damageBonus = "";
  } else {
    damageBonus = ` + ${damageBonus}`;
  }

  // are we dealing with martial arts?
  if (isMartialArtists(ddb.character.classes)) {
    const die = ddb.character.classes
      .filter((cls) => isMartialArtists([cls]))
      .map((cls) => {
        const feature = cls.classFeatures.find((feature) => feature.definition.name === "Martial Arts");

        if (feature && feature.levelScale && feature.levelScale.dice && feature.levelScale.dice.diceString) {
          if (action.dice?.diceValue > feature.levelScale.dice.diceValue) {
            return action.dice.diceString;
          }
          return feature.levelScale.dice.diceString;
        } else if (action.dice !== null) {
          // On some races bite is considered a martial art, damage
          // is different and on the action itself
          return action.dice.diceString;
        } else {
          return "1";
        }
      });

    const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
    const damageString = utils.parseDiceString(die, `${damageBonus} + @mod`, damageTag).diceString;

    // set the weapon damage
    return {
      parts: [[damageString, damageType]],
      versatile: "",
    };
  } else if (action.dice !== null) {
    // The Lizardfolk jaws have a different base damage, its' detailed in
    // dice so lets capture that for actions if it exists
    const damageTag = (globalDamageHints && damageType) ? `[${damageType}]` : "";
    const damageString = utils.parseDiceString(action.dice.diceString, `${damageBonus} + @mod`, damageTag).diceString;
    return {
      parts: [[damageString, damageType]],
      versatile: "",
    };
  } else {
    // default to basics
    return {
      parts: [[`1${damageBonus} + @mod`, damageType]],
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
    let maxUses = (action.limitedUse.maxUses && action.limitedUse.maxUses !== -1) ? action.limitedUse.maxUses : 0;

    if (action.limitedUse.statModifierUsesId) {
      const ability = DICTIONARY.character.abilities.find(
        (ability) => ability.id === action.limitedUse.statModifierUsesId
      ).value;

      switch (action.limitedUse.operator) {
        case 2: {
          maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
          break;
        }
        case 1:
        default:
          maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
      }
    }

    if (action.limitedUse.useProficiencyBonus) {
      switch (action.limitedUse.proficiencyBonusOperator) {
        case 2: {
          maxUses *= character.data.attributes.prof;
          break;
        }
        case 1:
        default:
          maxUses += character.data.attributes.prof;
      }
    }

    const finalMaxUses = (maxUses) ? parseInt(maxUses) : null;

    return {
      value: (finalMaxUses !== null && finalMaxUses != 0) ? maxUses - action.limitedUse.numberUsed : null,
      max: (finalMaxUses != 0) ? finalMaxUses : null,
      per: resetType ? resetType.value : "",
    };
  } else {
    return {
      value: null,
      max: null,
      per: "",
    };
  }
}

function getDescription(ddb, character, action) {
  const useFull = game.settings.get("ddb-importer", "character-update-policy-use-full-description");
  let snippet = action.snippet ? parseTemplateString(ddb, character, action.snippet, action).text : "";
  const description = action.description ? parseTemplateString(ddb, character, action.description, action).text : "";
  if (stripHtml(description).trim() === stripHtml(snippet).trim()) snippet = "";
  const fullDescription = description !== "" ? description + (snippet !== "" ? "<h3>Summary</h3>" + snippet : "") : snippet;
  const value = !useFull && snippet.trim() !== "" ? snippet : fullDescription;
  const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
  return {
    value: value,
    chat: chatAdd ? snippet : "",
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
        amount: 1,
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


function calculateActionAttackAbilities(ddb, character, action, weapon) {
  let defaultAbility;

  if (action.abilityModifierStatId && !([1, 2].includes(action.abilityModifierStatId) && action.isMartialArts)) {
    defaultAbility = DICTIONARY.character.abilities.find(
      (stat) => stat.id === action.abilityModifierStatId
    ).value;
    weapon.data.ability = defaultAbility;
  } else if (action.isMartialArts) {
    weapon.data.ability =
      action.isMartialArts && isMartialArtists(ddb.character.classes)
        ? character.flags.ddbimporter.dndbeyond.effectAbilities.dex.value >= character.flags.ddbimporter.dndbeyond.effectAbilities.str.value
          ? "dex"
          : "str"
        : "str";
  } else {
    weapon.data.ability = "";
  }
  if (action.isMartialArts) {
    weapon.data.damage = martialArtsDamage(ddb, action);
    weapon.data.attackBonus = utils.filterBaseModifiers(ddb, "bonus", "unarmed-attacks").reduce((prev, cur) => prev + cur.value, 0);
  } else {
    weapon.data.damage = getDamage(action);
  }
  return weapon;
}

function getAttackType(ddb, character, action, weapon) {
  // lets see if we have a save stat for things like Dragon born Breath Weapon
  if (action.saveStatId) {
    weapon = calculateSaveAttack(action, weapon);
  } else if (action.actionType === 1) {
    if (action.attackTypeRange === 2) {
      weapon.data.actionType = "rwak";
    } else {
      weapon.data.actionType = "mwak";
    }
    weapon = calculateActionAttackAbilities(ddb, character, action, weapon);
  } else {
    if (action.rangeId && action.rangeId === 1) {
      weapon.data.actionType = "mwak";
    } else if (action.rangeId && action.rangeId === 2) {
      weapon.data.actionType = "rwak";
    } else {
      weapon.data.actionType = "other";
    }
    weapon = calculateActionAttackAbilities(ddb, character, action, weapon);
  }
  return weapon;
}

function getAttackAction(ddb, character, action) {
  const actionType = game.settings.get("ddb-importer", "character-update-policy-use-actions-as-features")
    ? "feat"
    : "weapon";
  let feature = {
    name: utils.getName(action, character),
    type: actionType,
    data: JSON.parse(utils.getTemplate(actionType)),
    flags: {
      ddbimporter: {
        id: action.id,
        entityTypeId: action.entityTypeId,
        action: true,
        componentId: action.componentId,
        componentTypeId: action.componentTypeId,
      },
      infusions: { infused: false },
      obsidian: {
        source: {
          type: "other",
        },
      },
    },
  };
  logger.debug(`Parsing action: ${feature.name} as ${actionType}`);
  if (action.infusionFlags) {
    setProperty(feature, "flags.infusions", action.infusionFlags);
  }

  try {
    if (action.isMartialArts) {
      feature.flags.ddbimporter.dndbeyond = {
        type: "Martial Arts",
      };
    }

    feature.data.proficient = action.isProficient ? 1 : 0;
    feature.data.description = getDescription(ddb, character, action);
    feature.data.equipped = true;
    feature.data.rarity = "";
    feature.data.identified = true;
    feature.data.activation = getActivation(action);
    feature = calculateRange(action, feature);
    feature = getAttackType(ddb, character, action, feature);
    feature.data.weaponType = getWeaponType(action);
    feature.data.uses = getLimitedUse(action, character);
    feature.data.consume = getResource(character, action);

    feature = addFlagHints(ddb, character, action, feature);
    feature = addFeatEffects(ddb, character, action, feature);

  } catch (err) {
    logger.warn(
      `Unable to Import Attack Action: ${action.name}, please log a bug report. Err: ${err.message}`,
      "extension"
    );
  }

  return feature;
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
    getInfusionActionData(ddb),
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
    getInfusionActionData(ddb),
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
        name: utils.getName(action, character),
        type: "feat",
        data: JSON.parse(utils.getTemplate("feat")),
        flags: {
          ddbimporter: {
            id: action.id,
            entityTypeId: action.entityTypeId,
            componentId: action.componentId,
            componentTypeId: action.componentTypeId,
          },
          infusions: { infused: false },
          obsidian: {
            source: {
              type: "other",
            },
          }
        },
      };
      if (action.infusionFlags) {
        setProperty(feat, "flags.infusions", action.infusionFlags);
      }
      feat.data.activation = getActivation(action);
      feat.data.description = getDescription(ddb, character, action);
      feat.data.uses = getLimitedUse(action, character);
      feat.data.consume = getResource(character, action);

      feat = calculateRange(action, feat);
      feat = getAttackType(ddb, character, action, feat);

      if (!feat.data.damage?.parts) {
        logger.debug("Running level scale parser");
        feat = getLevelScaleDice(ddb, character, action, feat);
      }

      feat = addFlagHints(ddb, character, action, feat);
      feat = addFeatEffects(ddb, character, action, feat);

      return feat;
    });

  return actions;
}

export default async function parseActions(ddb, character) {
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
  const results = await addExtraEffects(actions, character);
  return results;
}
