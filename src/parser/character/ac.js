import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";
import { generateFixedACEffect, generateBonusACEffect } from "../../effects/acEffects.js";
import { getAllClassFeatures } from "./filterModifiers.js";

/**
 * This excludes shields
 * @param {} data
 */
export function isArmored(data) {
  return (
    data.character.inventory.filter(
      (item) => item.equipped && item.definition.armorClass && item.definition.armorTypeId !== 4
    ).length >= 1
  );
}

function getMinimumBaseAC(modifiers) {
  let hasBaseArmor = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "minimum-base-armor" && modifier.isGranted
  );
  let baseAC = [];
  hasBaseArmor.forEach((base) => {
    baseAC.push(base.value);
  });
  return baseAC;
}

function getBaseArmor(ac, armorType, name = "Racial") {
  return {
    definition: {
      name: `Base Armor - ${name}`,
      type: armorType,
      armorClass: ac,
      armorTypeId: DICTIONARY.equipment.armorType.find((id) => id.name === armorType).id,
      grantedModifiers: [],
      canAttune: false,
      filterType: "Armor",
    },
    isAttuned: false,
  };
}

function getEquippedAC(equippedGear) {
  return equippedGear.reduce((prev, item) => {
    let ac = 0;
    // regular armor
    if (item.definition.armorClass) {
      ac += item.definition.armorClass;
    }

    // magical armor
    const usingItemEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

    const daeItemEffects = (usingItemEffects
      && item.equipped && item.definition.filterType !== "Armor"
    );

    if (!daeItemEffects && item.definition.grantedModifiers) {
      let isAvailable = false;
      // does an item need attuning
      if (item.definition.canAttune === true) {
        if (item.isAttuned === true) {
          isAvailable = true;
        }
      } else {
        isAvailable = true;
      }

      if (isAvailable) {
        item.definition.grantedModifiers.forEach((modifier) => {
          if (modifier.type === "bonus" && modifier.subType === "armor-class") {
            // add this to armor AC
            ac += modifier.value;
          }
        });
      }
    }
    return prev + ac;
  }, 0);
}

// returns an array of ac values from provided array of modifiers
function getUnarmoredAC(modifiers, character) {
  let unarmoredACValues = [];
  let isUnarmored = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "unarmored-armor-class" && modifier.isGranted
  );
  // if (isUnarmored.length === 0) {
  //   // Some items will have an unarmoured bonus, but won't set a base, so if we are in this
  //   // situation, we add a default base ac
  //   isUnarmored.push({
  //     statId: 2,
  //     value: 0,
  //   });
  // }

  const ignoreDex = modifiers.some((modifier) => modifier.type === "ignore" && modifier.subType === "unarmored-dex-ac-bonus");

  const maxUnamoredDexMods = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "ac-max-dex-modifier" && modifier.isGranted
  ).map((mods) => mods.value);
  const maxUnamoredDexMod = ignoreDex ? 0 : Math.min(...maxUnamoredDexMods, 20);

  // console.log(`Max Dex: ${maxUnamoredDexMod}`);
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;

  isUnarmored.forEach((unarmored) => {
    let unarmoredACValue = 10;
    // +DEX
    // for a case of setting unarmoured ac, the dex won't detract
    unarmoredACValue += Math.max(0, Math.min(characterAbilities.dex.mod, maxUnamoredDexMod));
    // +WIS or +CON, if monk or barbarian, draconic resilience === null

    // console.log(`Unarmoured AC Value: ${unarmoredACValue}`);
    // console.log(unarmored);

    if (unarmored.statId !== null) {
      let ability = DICTIONARY.character.abilities.find((ability) => ability.id === unarmored.statId);
      unarmoredACValue += characterAbilities[ability.value].mod;
    }
    if (unarmored.value) unarmoredACValue += unarmored.value;
    unarmoredACValues.push(unarmoredACValue);
  });
  // console.warn(unarmoredACValues);
  return unarmoredACValues;
}

function getDualWieldAC(data, modifiers) {
  const dualWielding = data.character.characterValues.some((cv) => {
    const equipped = data.character.inventory.some((item) => item.equipped && item.id == cv.valueId);
    const dualWielding = cv.typeId === 18;
    return equipped && dualWielding;
  });
  let dualWieldBonus = 0;

  if (dualWielding) {
    DDBHelper.filterModifiers(modifiers, "bonus", "dual-wield-armor-class", ["", null], true).forEach((bonus) => {
      dualWieldBonus += bonus.value;
    });
  }

  return dualWieldBonus;
}

// eslint-disable-next-line complexity
function calculateACOptions(data, character, calculatedArmor) {
  const characterAbilities = character.flags.ddbimporter.dndbeyond.effectAbilities;
  let actorBase = 10 + characterAbilities.dex.mod;
  // generated AC effects
  let effects = [];
  // array to assemble possible AC values
  let armorClassValues = [];
  // max holders
  let maxType = "Unarmored";
  let maxValue = actorBase;

  // the presumption here is that you can only wear a shield and a single
  // additional 'armor' piece. in DDB it's possible to equip multiple armor
  // types and it works out the best AC for you
  // we also want to handle unarmored for monks etc.
  // we might have multiple shields "equipped" by accident, so work out
  // the best one
  for (let armor = 0; armor < calculatedArmor.armors.length; armor++) {
    // getEquippedAC fetches any magical AC boost on the items passed
    let armorAC = getEquippedAC([calculatedArmor.armors[armor]]);
    let shieldMod = 0;

    if (calculatedArmor.shields.length !== 0) {
      let maxAC = armorAC;
      for (let shield = 0; shield < calculatedArmor.shields.length; shield++) {
        const combinedAC = getEquippedAC([calculatedArmor.armors[armor], calculatedArmor.shields[shield]]);
        if (combinedAC > maxAC) {
          shieldMod = combinedAC - armorAC;
          maxAC = combinedAC;
        }
      }
      armorAC = maxAC;
    }

    // Determine final AC values based on AC Type
    // Light Armor: AC + DEX
    // Medium Armor: AC + DEX (max 2)
    // Heavy Armor: AC only
    // Unarmored Defense: Dex mod already included in calculation

    // sometimes the type field can be blank in DDB
    if (!calculatedArmor.armors[armor].definition.type || calculatedArmor.armors[armor].definition.type === "") {
      const armourTypeId = calculatedArmor.armors[armor].definition.armorTypeId;
      const acType = DICTIONARY.equipment.armorType.find((a) => a.id === armourTypeId);
      if (acType) calculatedArmor.armors[armor].definition.type = acType.name;
    }
    let effect = null;
    let acValue;

    switch (calculatedArmor.armors[armor].definition.type) {
      case "Natural Armor": {
        let acCalc = 0;
        // Tortles don't get to add an unarmored ac bonus for their shell
        const ignoreUnarmouredACBonus = DDBHelper.filterBaseModifiers(data, "ignore", "unarmored-dex-ac-bonus");
        if (ignoreUnarmouredACBonus) {
          acCalc = armorAC + calculatedArmor.miscACBonus;
          // console.log(armorAC);
          // console.log(gearAC);
          // console.log(miscACBonus);
        } else {
          acCalc = armorAC + calculatedArmor.miscACBonus + calculatedArmor.unarmoredACBonus;
        }
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + calculatedArmor.gearAC,
          type: "Natural",
          acCalc,
          shieldMod,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = generateFixedACEffect(acValue.value, `AC ${calculatedArmor.armors[armor].definition.name} (Natural): ${acValue.value}`, true);
        break;
      }
      case "Unarmored Defense": {
        const acCalc = armorAC + calculatedArmor.miscACBonus + calculatedArmor.unarmoredACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + calculatedArmor.gearAC,
          type: "Unarmored Defense",
          acCalc,
          shieldMod,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = generateFixedACEffect(acValue.value, `AC ${calculatedArmor.armors[armor].definition.name} (Unarmored Defense): ${acValue.value}`);
        break;
      }
      case "Unarmored": {
        const base = armorAC + calculatedArmor.miscACBonus + calculatedArmor.unarmoredACBonus;
        const acCalc = base + characterAbilities.dex.mod;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + calculatedArmor.gearAC,
          type: "Unarmored",
          acCalc,
          shieldMod,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = generateFixedACEffect(`${acValue.value} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name} (Unarmored): ${acValue.value}`, true, 15);
        break;
      }
      case "Heavy Armor": {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc,
          type: "Heavy",
          acCalc,
          shieldMod,
        };
        effect = generateFixedACEffect(acValue.value, `AC ${calculatedArmor.armors[armor].definition.name} (Heavy): ${acValue.value}`);
        break;
      }
      case "Medium Armor": {
        const maxDexMedium = Math.max(...DDBHelper.filterBaseModifiers(data, "set", "ac-max-dex-armored-modifier", ["", null], true)
          .map((mod) => mod.value), 2);
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + Math.min(maxDexMedium, characterAbilities.dex.mod),
          type: "Medium",
          acCalc,
          shieldMod,
        };
        effect = generateFixedACEffect(`${acCalc} + {@abilities.dex.mod, ${maxDexMedium}}kl`, `AC ${calculatedArmor.armors[armor].definition.name} (Medium): ${acValue.value}`);
        break;
      }
      case "Light Armor": {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + characterAbilities.dex.mod,
          type: "Light",
          acCalc,
          shieldMod,
        };
        effect = generateFixedACEffect(`${acCalc} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name} (Light): ${acValue.value}`);
        break;
      }
      default: {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + characterAbilities.dex.mod,
          type: "Other",
          acCalc,
          shieldMod,
        };
        effect = generateFixedACEffect(`${acCalc} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name}: ${acValue.value}`, false, 22);
        break;
      }
    }
    if (effect) {
      effect.flags.ddbimporter.itemId = calculatedArmor.armors[armor].id;
      effect.flags.ddbimporter.entityTypeId = calculatedArmor.armors[armor].entityTypeId;
      effects.push(effect);
    }
    armorClassValues.push(acValue);
    if (acValue.value >= maxValue) {
      maxType = acValue.type;
      maxValue = acValue.value;
    }
  }

  logger.debug("Final AC Choices:", armorClassValues);
  return {
    actorBase,
    armorClassValues,
    effects,
    maxType,
    maxValue,
  };
}


DDBCharacter.prototype._generateOverrideArmorClass = function _generateOverrideArmorClass(overRideAC) {
  const overRideEffect = generateFixedACEffect(overRideAC.value, `AC Override: ${overRideAC.value}`);

  this.raw.character.system.attributes.ac = {
    flat: overRideAC.value,
    calc: "flat",
    formula: "",
  };
  this.raw.character.effects = this.raw.character.effects.concat(overRideEffect);
  this.raw.character.flags.ddbimporter.acEffects = [overRideEffect];
  this.raw.character.flags.ddbimporter.baseAC = overRideAC.value;
  this.raw.character.flags.ddbimporter.autoAC = deepClone(this.raw.character.system.attributes.ac);
  this.raw.character.flags.ddbimporter.overrideAC = {
    flat: overRideAC.value,
    calc: "flat",
    formula: "",
  };
  this.raw.character.flags.ddbimporter.fixedAC = {
    type: "Number",
    label: "Armor Class",
    value: overRideAC.value,
  };
};


DDBCharacter.prototype._generateArmorClass = function _generateArmorClass() {
  const overRideAC = this.source.ddb.character.characterValues.find((val) => val.typeId === 1);

  if (overRideAC) {
    this._generateOverrideArmorClass(overRideAC);
    return;
  }

  // get a list of equipped armor
  // we make a distinction so we can loop over armor
  let equippedArmor = this.source.ddb.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType === "Armor"
  );
  let baseAC = 10;
  // for things like fighters fighting style
  let miscACBonus = 0;
  let bonusEffects = [];
  // lets get equipped gear
  const equippedGear = this.source.ddb.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType !== "Armor"
  );
  const unarmoredACBonus = DDBHelper
    .filterBaseModifiers(this.source.ddb, "bonus", "unarmored-armor-class")
    .reduce((prev, cur) => prev + cur.value, 0);

  // lets get the AC for all our non-armored gear, we'll add this later
  const gearAC = getEquippedAC(equippedGear);

  // While not wearing armor, lets see if we have special abilities
  if (!isArmored(this.source.ddb)) {
    // unarmored abilities from Class/Race?
    const unarmoredSources = [
      DDBHelper.getChosenClassModifiers(this.source.ddb),
      this.source.ddb.character.modifiers.race,
      this.source.ddb.character.modifiers.feat,
      DDBHelper.getActiveItemModifiers(this.source.ddb, true),
    ];
    unarmoredSources.forEach((modifiers) => {
      const unarmoredAC = Math.max(getUnarmoredAC(modifiers, this.raw.character));
      if (unarmoredAC) {
        // we add this as an armored type so we can get magical item bonuses
        // e.g. ring of protection
        equippedArmor.push(getBaseArmor(unarmoredAC, "Unarmored Defense", "Unarmored defense"));
      }
    });
  } else {
    // check for things like fighters fighting style defense
    const armorBonusSources = [DDBHelper.getChosenClassModifiers(this.source.ddb), this.source.ddb.character.modifiers.race].flat();
    const armoredBonuses = armorBonusSources.filter(
      (modifier) => modifier.subType === "armored-armor-class" && modifier.isGranted
    );
    const effect = generateBonusACEffect(armoredBonuses, "AC: Armored Misc Bonuses", "armored-armor-class", null);
    if (effect.changes.length > 0) bonusEffects.push(effect);
  }

  // Generic AC bonuses like Warforfed Integrated Protection
  // item modifiers are loaded by ac calcs
  const miscModifiers = [
    DDBHelper.getChosenClassModifiers(this.source.ddb),
    DDBHelper.getModifiers(this.source.ddb, "race"),
    DDBHelper.getModifiers(this.source.ddb, "background"),
    DDBHelper.getModifiers(this.source.ddb, "feat")
  ];

  DDBHelper.filterModifiers(miscModifiers, "bonus", "armor-class", ["", null], true).forEach((bonus) => {
    const component = DDBHelper.findComponentByComponentId(this.source.ddb, bonus.componentId);
    const name = component ? component.definition?.name ?? component.name : `AC: Misc (${bonus.friendlySubtypeName})`;
    const effect = generateBonusACEffect([bonus], name, "armor-class", null);
    if (effect.changes.length > 0) bonusEffects.push(effect);
  });

  this.source.ddb.character.characterValues.filter((value) =>
    (value.typeId === 3 || value.typeId === 2)
    && value.value !== 0
  ).forEach((custom) => {
    const name = custom.notes && custom.notes.trim() !== "" ? custom.notes : "AC: Custom Bonus";
    const effect = generateBonusACEffect([], name, "custom", null);
    const key = game.modules.get("dae")?.active
      ? "system.attributes.ac.value"
      : "system.attributes.ac.bonus";
    effect.changes.push({
      key,
      value: custom.value,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 30,
    });
    bonusEffects.push(effect);
  });

  miscACBonus += getDualWieldAC(this.source.ddb, miscModifiers);

  // Each racial armor appears to be slightly different!
  // We care about Tortles and Lizardfolk here as they can use shields, but their
  // modifier is set differently
  switch (this.source.ddb.character.race.fullName) {
    case "Lizardfolk":
      baseAC = Math.max(getUnarmoredAC(this.source.ddb.character.modifiers.race, this.raw.character));
      equippedArmor.push(getBaseArmor(baseAC, "Natural Armor", this.source.ddb.character.race.fullName));
      break;
    case "Autognome":
    case "Thri-kreen":
    case "Loxodon":
    case "Tortle":
      baseAC = Math.max(getMinimumBaseAC(this.source.ddb.character.modifiers.race, this.raw.character), getUnarmoredAC(this.source.ddb.character.modifiers.race, this.raw.character));
      equippedArmor.push(getBaseArmor(baseAC, "Natural Armor", this.source.ddb.character.race.fullName));
      break;
    default:
      equippedArmor.push(getBaseArmor(baseAC, "Unarmored"));
  }

  const shields = equippedArmor.filter((shield) => shield.definition.armorTypeId === 4);
  const armors = equippedArmor.filter((armour) => armour.definition.armorTypeId !== 4);

  logger.debug("Calculated GearAC: " + gearAC);
  logger.debug("Unarmoured AC Bonus:" + unarmoredACBonus);
  logger.debug("Calculated MiscACBonus: " + miscACBonus);
  logger.debug("Equipped AC Options: ", equippedArmor);
  logger.debug("Armors: ", armors);
  logger.debug("Shields: ", shields);

  const calculatedArmor = {
    gearAC,
    unarmoredACBonus,
    miscACBonus,
    equippedArmor,
    armors,
    shields,
  };
  const results = calculateACOptions(this.source.ddb, this.raw.character, calculatedArmor);

  logger.debug("Calculated AC Results:", results);
  // get the max AC we can use from our various computed values
  // const max = Math.max(...results.armorClassValues.map((type) => type.value));

  //
  // DND5E.armorClasses = {
  //   "default": {


  // const draconic = ddb.classes[0].classFeatures[1].definition
  const classFeatures = getAllClassFeatures(this.source.ddb.character);
  logger.debug("Class features", classFeatures);

  let calc = "default";
  let flat = null;
  if (classFeatures.some((kf) =>
    kf.className === "Sorcerer"
    && kf.subclassName === "Draconic Bloodline"
    && kf.name === "Draconic Resilience"
  )) calc = "draconic";

  if (classFeatures.some((kf) =>
    kf.className === "Monk"
    && kf.subclassName === null
    && kf.name === "Unarmored Defense"
  )) calc = "unarmoredMonk";

  if (classFeatures.some((kf) =>
    kf.className === "Barbarian"
    && kf.subclassName === null
    && kf.name === "Unarmored Defense"
  )) calc = "unarmoredBarb";

  if (results.maxType === "Natural") {
    calc = "natural";
    flat = results.actorBase;
  }

  logger.debug("AC Results:", {
    fixed: {
      type: "Number",
      label: "Armor Class",
      value: results.maxValue,
    },
    base: results.actorBase,
    effects: results.effects,
    bonusEffects: bonusEffects,
    override: {
      flat: results.maxValue,
      calc: "flat",
      formula: "",
    },
    auto: {
      flat,
      calc,
      formula: "",
    },
  });

  this.raw.character.system.attributes.ac = {
    flat,
    calc,
    formula: "",
  };
  this.raw.character.effects = this.raw.character.effects.concat(bonusEffects);

  this.raw.character.flags.ddbimporter.acEffects = results.effects;
  this.raw.character.flags.ddbimporter.baseAC = results.actorBase;
  this.raw.character.flags.ddbimporter.autoAC = deepClone(this.raw.character.system.attributes.ac);
  this.raw.character.flags.ddbimporter.overrideAC = {
    flat: results.maxValue,
    calc: "flat",
    formula: "",
  };

};
