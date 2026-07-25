import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBCharacter, { IDDBACResults, IDDBACValue, IDDBCalculatedArmor, type IDDBArmorEntry } from "../DDBCharacter";
import { ACBonusEffects } from "../enrichers/effects/_module";
import { DDBDataUtils, DDBModifiers, FilterModifiers } from "../lib/_module";

// Passing a null restrictions list disables restriction filtering entirely in
// DDBModifiers.filterModifiers (an empty array would instead filter out every
// modifier). The generateBonusACEffect signature does not yet admit null in
// the strict migration, so keep the load-bearing runtime null behind a
// targeted cast.
const NULL_RESTRICTIONS = null as unknown as string[];

/**
 * Checks if the character is armored, excluding shields.
 *
 * @returns {boolean} - Whether the character is armored.
 */
DDBCharacter.prototype.isArmored = function isArmored(this: DDBCharacter) {
  const inventory = this.source?.ddb.character.inventory ?? [];
  return (
    inventory.filter(
      (item) => item.equipped && item.definition.armorClass && item.definition.armorTypeId !== 4,
    ).length >= 1
  );
};

/**
 * Checks if the character is unarmored, excluding shields.
 *
 * @returns {boolean} - Whether the character is unarmored.
 */
DDBCharacter.prototype.isUnArmored = function isUnArmored(this: DDBCharacter) {
  return !this.isArmored();
};

function getMinimumBaseAC(modifiers: IDDBModifier[]): number[] {
  const hasBaseArmor = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "minimum-base-armor" && modifier.isGranted,
  );
  const baseAC: number[] = [];
  hasBaseArmor.forEach((base) => {
    baseAC.push(Number(base.value));
  });
  return baseAC;
}

function getBaseArmor(ac: number, armorType: string, name = "Racial", formula: string | null = null) {
  return {
    definition: {
      name: `Base Armor - ${name}`,
      type: armorType,
      armorClass: ac,
      armorTypeId: DICTIONARY.equipment.armorType.find((id) => id.name === armorType)?.id ?? 0,
      grantedModifiers: [] as IDDBModifier[],
      canAttune: false,
      filterType: "Armor",
      formula,
    },
    isAttuned: false,
  };
}

// accepts real inventory items or the synthetic base-armor entries built above
function getEquippedAC(equippedGear: (IDDBInventoryItem | IDDBArmorEntry)[]): number {
  return equippedGear.reduce((prev: number, item) => {
    let ac = 0;
    // regular armor
    if (item.definition.armorClass) {
      ac += item.definition.armorClass;
    }

    // magical armor
    const itemEffects = item.equipped && item.definition.filterType !== "Armor";

    if (!itemEffects && item.definition.grantedModifiers) {
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
        item.definition.grantedModifiers.forEach((modifier: IDDBModifier) => {
          if (modifier.type === "bonus" && modifier.subType === "armor-class") {
            // add this to armor AC
            ac += Number(modifier.value);
          }
        });
      }
    }
    return prev + ac;
  }, 0);
}

// returns an array of ac values from provided array of modifiers
function getUnarmoredAC(modifiers: IModifiersMod[], character: I5ePCData): number[] {
  const unarmoredACValues: number[] = [];
  const characterAbilities = character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
  if (!characterAbilities) {
    logger.warn("getUnarmoredAC: no effect abilities found on character flags, skipping unarmored AC calculation");
    return unarmoredACValues;
  }
  const isUnarmored = modifiers.filter(
    (modifier) => modifier.type === "set" && modifier.subType === "unarmored-armor-class" && modifier.isGranted,
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
    (modifier) => modifier.type === "set" && modifier.subType === "ac-max-dex-modifier" && modifier.isGranted,
  ).map((mods) => Number(mods.value));
  const maxUnamoredDexMod = ignoreDex ? 0 : Math.min(...maxUnamoredDexMods, 20);

  // console.log(`Max Dex: ${maxUnamoredDexMod}`);
  isUnarmored.forEach((unarmored) => {
    let unarmoredACValue = 10;
    // +DEX
    // for a case of setting unarmoured ac, the dex won't detract
    unarmoredACValue += Math.max(0, Math.min(utils.calculateModifier(characterAbilities.dex.value ?? 10), maxUnamoredDexMod));
    // +WIS or +CON, if monk or barbarian, draconic resilience === null

    // console.log(`Unarmoured AC Value: ${unarmoredACValue}`);
    // console.log(unarmored);

    if (unarmored.statId !== null) {
      const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === unarmored.statId);
      if (ability) {
        unarmoredACValue += utils.calculateModifier(characterAbilities[ability.value].value ?? 10);
      } else {
        logger.warn(`getUnarmoredAC: no ability found for stat id ${unarmored.statId}, ignoring stat modifier`);
      }
    }
    if (unarmored.value) unarmoredACValue += Number(unarmored.value);
    unarmoredACValues.push(unarmoredACValue);
  });
  // console.warn(unarmoredACValues);
  return unarmoredACValues;
}

function getDualWieldAC(data: IDDBData, modifiers: IDDBModifier[]) {
  const dualWielding = data.character.characterValues.some((cv) => {
    // loose equality intentional: DDB sends characterValues.valueId as a string, item.id is a number
    const equipped = data.character.inventory.some((item) => item.equipped && item.id == cv.valueId);
    const dualWielding = cv.typeId === 18;
    return equipped && dualWielding;
  });
  let dualWieldBonus = 0;

  if (dualWielding) {
    DDBModifiers.filterModifiersOld(modifiers, "bonus", "dual-wield-armor-class", ["", null]).forEach((bonus) => {
      dualWieldBonus += parseInt(String(bonus.value));
    });
  }

  return dualWieldBonus;
}

// To Do: Rework AC functions as class functions to help reduce complexity in calculation.

function calculateACOptions(data: IDDBData, character: I5ePCData, calculatedArmor: IDDBCalculatedArmor): IDDBACResults {
  const characterAbilities = character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
  if (!characterAbilities) {
    logger.warn("calculateACOptions: no effect abilities found on character flags, dexterity modifier defaults to +0");
  }
  // an unset ability score is treated as the neutral 10 (modifier +0)
  const dexModifier = utils.calculateModifier(characterAbilities?.dex.value ?? 10);
  let actorBase = 10 + dexModifier;
  // generated AC effects
  const effects: I5eEffectData[] = [];
  // array to assemble possible AC values
  const armorClassValues = [];
  // max holders
  let maxType = "Unarmored";
  let maxValue = actorBase;
  let maxData: IDDBACValue = {} as IDDBACValue;

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
    let effect: I5eEffectData;
    let acValue: IDDBACValue;

    switch (calculatedArmor.armors[armor].definition.type) {
      case "Natural Armor": {
        let acCalc;
        // Tortles don't get to add an unarmored ac bonus for their shell
        const ignoreUnarmouredACBonus = DDBModifiers.filterBaseModifiers(data, "ignore", { subType: "unarmored-dex-ac-bonus" });
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
          calculatedArmor,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = ACBonusEffects.generateFixedACEffect(String(acValue.value), `AC ${calculatedArmor.armors[armor].definition.name} (Natural): ${acValue.value}`, true);
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
          calculatedArmor,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = ACBonusEffects.generateFixedACEffect(String(acValue.value), `AC ${calculatedArmor.armors[armor].definition.name} (Unarmored Defense): ${acValue.value}`);
        break;
      }
      case "Unarmored": {
        const base = armorAC + calculatedArmor.miscACBonus + calculatedArmor.unarmoredACBonus;
        const acCalc = base + dexModifier;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + calculatedArmor.gearAC,
          type: "Unarmored",
          acCalc,
          shieldMod,
          calculatedArmor,
        };
        if (acCalc > actorBase) actorBase = acCalc - shieldMod;
        effect = ACBonusEffects.generateFixedACEffect(`${acValue.value} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name} (Unarmored): ${acValue.value}`, true, 15);
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
          calculatedArmor,
        };
        effect = ACBonusEffects.generateFixedACEffect(String(acValue.value), `AC ${calculatedArmor.armors[armor].definition.name} (Heavy): ${acValue.value}`);
        break;
      }
      case "Medium Armor": {
        const maxDexMedium = Math.max(
          ...DDBModifiers.filterBaseModifiers(data, "set", { subType: "ac-max-dex-armored-modifier", includeExcludedEffects: true }).map((mod) => parseInt(String(mod.value))),
          // ...DDBModifiers.filterBaseModifiers(data, "set", { subType: "ac-max-dex-modifier", includeExcludedEffects: true }).map((mod) => mod.value),
          2,
        );
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + Math.min(maxDexMedium, dexModifier),
          type: "Medium",
          acCalc,
          shieldMod,
          calculatedArmor,
        };
        effect = ACBonusEffects.generateFixedACEffect(`${acCalc} + {@abilities.dex.mod, ${maxDexMedium}}kl`, `AC ${calculatedArmor.armors[armor].definition.name} (Medium): ${acValue.value}`);
        break;
      }
      case "Light Armor": {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + dexModifier,
          type: "Light",
          acCalc,
          shieldMod,
          calculatedArmor,
        };
        effect = ACBonusEffects.generateFixedACEffect(`${acCalc} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name} (Light): ${acValue.value}`);
        break;
      }
      case "Custom": {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc,
          type: "Custom",
          acCalc,
          shieldMod,
          formula: calculatedArmor.armors[armor].definition.formula ?? undefined,
          calculatedArmor,
        };
        if (acValue.formula === undefined) {
          logger.warn(`calculateACOptions: custom armor ${acValue.name} has no formula, using an empty AC formula`);
        }
        effect = ACBonusEffects.generateFixedACEffect(acValue.formula ?? "", `AC ${acValue.name}: ${acValue.value}`, false, 22);
        break;
      }
      default: {
        const acCalc = armorAC + calculatedArmor.gearAC + calculatedArmor.miscACBonus;
        acValue = {
          name: calculatedArmor.armors[armor].definition.name,
          value: acCalc + dexModifier,
          type: "Other",
          acCalc,
          shieldMod,
          calculatedArmor,
        };
        effect = ACBonusEffects.generateFixedACEffect(`${acCalc} + @abilities.dex.mod`, `AC ${calculatedArmor.armors[armor].definition.name}: ${acValue.value}`, false, 22);
        break;
      }
    }
    if (effect) {
      const effectImporterFlags = effect.flags?.ddbimporter;
      if (effectImporterFlags) {
        effectImporterFlags.itemId = String(calculatedArmor.armors[armor].id);
        effectImporterFlags.entityTypeId = String(calculatedArmor.armors[armor].entityTypeId);
      } else {
        logger.warn(`calculateACOptions: generated AC effect for ${calculatedArmor.armors[armor].definition.name} is missing ddbimporter flags`);
      }
      effects.push(effect);
    }
    armorClassValues.push(acValue);
    if (acValue.value > maxValue
      || (acValue.type === "Unarmored Defense" && maxType !== "Natural" && acValue.value >= maxValue)
      || (acValue.type === "Natural" && acValue.value >= maxValue)
    ) {
      logger.debug("New max AC found:", {
        old: `${maxValue} ${maxType}`,
        new: `${acValue.value} ${acValue.type}`,
        oldMaxData: foundry.utils.deepClone(maxData),
        newMaxData: foundry.utils.deepClone(acValue),
      });
      maxType = acValue.type;
      maxValue = acValue.value;
      maxData = foundry.utils.deepClone(acValue) as typeof maxData;
    } else {
      logger.debug("Not updating max AC:", {
        current: `${maxValue} ${maxType}`,
        discarded: `${acValue.value} ${acValue.type}`,
        currentMaxData: foundry.utils.deepClone(maxData),
        discardedMaxData: foundry.utils.deepClone(acValue),
      });
    }
  }

  logger.debug("Final AC Choices:", armorClassValues);
  return {
    actorBase,
    armorClassValues,
    effects,
    maxType,
    maxValue,
    maxData,
  };
}


DDBCharacter.prototype._generateOverrideArmorClass = function _generateOverrideArmorClass(this: DDBCharacter, overRideAC: IDDBCharacterValue) {
  const overRideEffect = ACBonusEffects.generateFixedACEffect(String(overRideAC.value), `AC Override: ${overRideAC.value}`);
  const flatIntAc = parseInt(String(overRideAC.value));

  const attributes = this.raw.character.system.attributes;
  const importerFlags = this.raw.character.flags?.ddbimporter;
  if (!attributes || !importerFlags) {
    logger.warn("_generateOverrideArmorClass: missing character attributes or ddbimporter flags, cannot apply AC override");
    return;
  }

  attributes.ac = {
    flat: flatIntAc,
    calc: "flat",
    formula: "",
  };
  this.raw.character.effects = (this.raw.character.effects ?? []).concat(overRideEffect);
  importerFlags.acEffects = [overRideEffect];
  importerFlags.baseAC = flatIntAc;
  importerFlags.autoAC = foundry.utils.deepClone(attributes.ac);
  importerFlags.overrideAC = {
    flat: flatIntAc,
    calc: "flat",
    formula: "",
  };
  // this.raw.character.flags.ddbimporter.fixedAC = {
  //   type: "Number",
  //   label: "Armor Class",
  //   value: parseInt(String(overRideAC.value)),
  // };

  this.armor.results = {
    maxValue: flatIntAc,
    maxType: "override",
    // actorBase,
    // armorClassValues,
    // effects,
    // maxType,
    // maxValue,
    // maxData,
  };
};


DDBCharacter.prototype._generateArmorClass = function _generateArmorClass(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("_generateArmorClass: no DDB source data available, skipping AC generation");
    return;
  }
  const overRideAC = ddb.character.characterValues.find((val) => val.typeId === 1);

  if (overRideAC) {
    this._generateOverrideArmorClass(overRideAC);
    return;
  }

  // get a list of equipped armor
  // we make a distinction so we can loop over armor
  // Inventory items carry nullable definition fields (type, armorClass,
  // armorTypeId) that the synthetic IDDBArmorEntry shape declares as required.
  // The AC calculation handles blank/missing values at runtime (see the armour
  // type fixup in calculateACOptions), so bridge the two shapes with a
  // targeted cast rather than widening the armor interfaces in DDBCharacter.ts.
  const equippedArmor = ddb.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType === "Armor",
  ) as unknown as IDDBArmorEntry[];
  this.armor.equippedArmor = equippedArmor;
  let baseAC = 10;
  this.armor.baseAC = baseAC;
  // for things like fighters fighting style
  let miscACBonus = 0;
  this.armor.miscACBonus = miscACBonus;
  const bonusEffects: I5eEffectData[] = [];
  this.armor.bonusEffects = bonusEffects;
  // lets get equipped gear
  const equippedGear = ddb.character.inventory.filter(
    (item) => item.equipped && item.definition.filterType !== "Armor",
  );
  // see the shape-bridging cast note above
  this.armor.equippedGear = equippedGear as unknown as IDDBArmorEntry[];
  const unarmoredACBonus = DDBModifiers
    .filterBaseModifiers(ddb, "bonus", { subType: "unarmored-armor-class" })
    .reduce((prev, cur) => prev + parseInt(String(cur.value)), 0);
  this.armor.unarmoredACBonus = unarmoredACBonus;

  // lets get the AC for all our non-armored gear, we'll add this later
  const gearAC = getEquippedAC(equippedGear);
  this.armor.gearAC = gearAC;

  // While not wearing armor, lets see if we have special abilities
  if (this.isUnArmored()) {
    // unarmored abilities from Class/Race?
    const unarmoredSources = [
      DDBModifiers.getChosenClassModifiers(ddb),
      ddb.character.modifiers.race,
      ddb.character.modifiers.feat,
      DDBModifiers.getActiveItemModifiers(ddb, true),
    ];
    unarmoredSources.forEach((modifiers) => {
      const unarmoredAC = Math.max(...getUnarmoredAC(modifiers, this.raw.character));
      if (unarmoredAC) {
        // we add this as an armored type so we can get magical item bonuses
        // e.g. ring of protection
        equippedArmor.push(getBaseArmor(unarmoredAC, "Unarmored Defense", "Unarmored defense"));
      }
    });
  } else {
    // check for things like fighters fighting style defense
    const armorBonusSources = [DDBModifiers.getChosenClassModifiers(ddb), ddb.character.modifiers.race].flat() as IDDBModifier[];
    const armoredBonuses = armorBonusSources.filter(
      (modifier) => modifier.subType === "armored-armor-class" && modifier.isGranted,
    );
    const effect = ACBonusEffects.generateBonusACEffect(armoredBonuses, "AC: Armored Misc Bonuses", "armored-armor-class", NULL_RESTRICTIONS);
    if ((effect.system?.changes?.length ?? 0) > 0) bonusEffects.push(effect);
  }

  // Generic AC bonuses like Warforfed Integrated Protection
  // item modifiers are loaded by ac calcs
  const miscModifiers = [
    DDBModifiers.getChosenClassModifiers(ddb),
    DDBModifiers.getModifiers(ddb, "race"),
    DDBModifiers.getModifiers(ddb, "background"),
    DDBModifiers.getModifiers(ddb, "feat"),
  ].flat() as IDDBModifier[];
  this.armor.miscModifiers = miscModifiers;

  DDBModifiers.filterModifiersOld(miscModifiers, "bonus", "armor-class", ["", null]).forEach((bonus) => {
    const component = DDBDataUtils.findComponentByComponentId(ddb, bonus.componentId);
    const name = component
      ? component.definition?.name ?? (foundry.utils.getProperty(component, "name") as string)
      : `AC: Misc (${bonus.friendlySubtypeName})`;
    const effect = ACBonusEffects.generateBonusACEffect([bonus], name, "armor-class", NULL_RESTRICTIONS);
    if ((effect.system?.changes?.length ?? 0) > 0) bonusEffects.push(effect);
  });

  ddb.character.characterValues.filter((value) =>
    (value.typeId === 3 || value.typeId === 2)
    && value.value !== 0,
  ).forEach((custom) => {
    const name = custom.notes && custom.notes.trim() !== "" ? custom.notes : "AC: Custom Bonus";
    const effect = ACBonusEffects.generateBonusACEffect([], name, "custom", NULL_RESTRICTIONS);
    if (custom.value && ((Number.isInteger(custom.value) && Number.parseInt(String(custom.value)) !== 0) || `${custom.value}`.trim() !== "")) {
      effect.system ??= {};
      effect.system.changes ??= [];
      effect.system.changes.push({
        key: "system.attributes.ac.bonus",
        value: `+ ${custom.value}`,
        type: "add",
        priority: 30,
      });
    }
    if ((effect.system?.changes?.length ?? 0) > 0) bonusEffects.push(effect);
  });

  miscACBonus += getDualWieldAC(ddb, miscModifiers);
  this.armor.miscACBonus = miscACBonus;

  // Each racial armor appears to be slightly different!
  // We care about Tortles and Lizardfolk here as they can use shields, but their
  // modifier is set differently
  switch (ddb.character.race.fullName) {
    case "Lizardfolk":
      baseAC = Math.max(...getUnarmoredAC(ddb.character.modifiers.race, this.raw.character));
      equippedArmor.push(
        getBaseArmor(baseAC, "Natural Armor", ddb.character.race.fullName),
      );
      break;
    case "Autognome":
    case "Thri-kreen":
    case "Loxodon":
    case "Tortle":
      baseAC = Math.max(
        ...getMinimumBaseAC(ddb.character.modifiers.race),
        ...getUnarmoredAC(ddb.character.modifiers.race, this.raw.character),
      );
      equippedArmor.push(
        getBaseArmor(baseAC, "Natural Armor", ddb.character.race.fullName),
      );
      break;
    default:
      equippedArmor.push(getBaseArmor(baseAC, "Unarmored"));
  }

  if (ddb.character.feats.some((f) => f.definition.name === "Dragon Hide")) {
    baseAC = Math.max(...getUnarmoredAC(ddb.character.modifiers.feat, this.raw.character));
    equippedArmor.push(getBaseArmor(baseAC, "Custom", "Dragon Hide", "13 + @abilities.dex.mod"));
  }
  this.armor.baseAC = baseAC;

  const shields = equippedArmor.filter((shield) => shield.definition.armorTypeId === 4);
  const armors = equippedArmor.filter((armour) => armour.definition.armorTypeId !== 4);
  this.armor.shields = shields;
  this.armor.armors = armors;

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
  this.armor.calculatedArmor = calculatedArmor;
  const results = calculateACOptions(ddb, this.raw.character, calculatedArmor);
  this.armor.results = results;

  logger.debug("Calculated AC Results:", {
    calculatedArmor,
    results,
  });
  // get the max AC we can use from our various computed values
  // const max = Math.max(...results.armorClassValues.map((type) => type.value));

  //
  // DND5E.armorClasses = {
  //   "default": {


  // const draconic = ddb.classes[0].classFeatures[1].definition
  const classFeatures = FilterModifiers.getAllClassFeatures(ddb.character);
  logger.debug("Class features", classFeatures);

  let calc = "default";
  let flat = null;
  let formula = "";
  const draconicResilienceFeatures = classFeatures.filter((kf) =>
    kf.className === "Sorcerer"
    && kf.name === "Draconic Resilience",
  );
  if (draconicResilienceFeatures.some((kf) => kf.subclassName === "Draconic Bloodline")) {
    calc = "draconic";
  } else if (draconicResilienceFeatures.some((kf) => kf.subclassName === "Draconic Sorcery")) {
    calc = "unarmoredBard";
  }

  if (classFeatures.some((kf) =>
    kf.className === "Monk"
    && kf.subclassName === null
    && kf.name === "Unarmored Defense",
  )) calc = "unarmoredMonk";

  if (classFeatures.some((kf) =>
    kf.className === "Bard"
    && kf.subclassName === "College of Dance"
    && kf.name === "Unarmored Defense",
  )) calc = "unarmoredBard";

  if (classFeatures.some((kf) =>
    kf.className === "Barbarian"
    && kf.subclassName === null
    && kf.name === "Unarmored Defense",
  )) calc = "unarmoredBarb";

  if (results.maxType === "Natural") {
    calc = "natural";
    flat = results.actorBase;
  }

  if (results.maxType === "Custom") {
    calc = "custom";
    formula = results.maxData?.formula ?? "";
  }

  logger.debug("AC Results:", {
    fixed: {
      type: "Number",
      label: "Armor Class",
      value: results.maxValue,
    },
    base: results.actorBase,
    effects: results.effects,
    bonusEffects,
    override: {
      flat: results.maxValue,
      calc: "flat",
      formula: "",
    },
    auto: {
      flat,
      calc,
      formula,
    },
  });

  const attributes = this.raw.character.system.attributes;
  const importerFlags = this.raw.character.flags?.ddbimporter;
  if (!attributes || !importerFlags) {
    logger.warn("_generateArmorClass: missing character attributes or ddbimporter flags, cannot store AC results");
    return;
  }

  attributes.ac = {
    flat,
    calc,
    formula,
  };

  this.raw.character.effects = (this.raw.character.effects ?? []).concat(bonusEffects);

  importerFlags.acEffects = results.effects;
  importerFlags.baseAC = results.actorBase;
  importerFlags.autoAC = foundry.utils.deepClone(attributes.ac);
  importerFlags.overrideAC = {
    flat: results.maxValue,
    calc: "flat",
    formula: "",
  };

};
