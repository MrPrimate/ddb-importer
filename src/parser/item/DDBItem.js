import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { generateTable } from "../../lib/DDBTable.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";
import DDBItemActivity from "./DDBItemActivity.js";
import MagicItemMaker from "./MagicItemMaker.js";
import SETTINGS from "../../settings.js";
import { getStatusEffect } from "../../effects/effects.js";
import Iconizer from "../../lib/Iconizer.js";

export default class DDBItem {

  static CLOTHING_ITEMS = [
    "Helm",
    "Boots",
    "Snowshoes",
    "Vestments",
    "Saddle, Exotic",
    "Saddle, Military",
    "Saddle, Pack",
    "Saddle, Riding",
  ];

  static EQUIPMENT_TRINKET = [
    "Canoe",
    "Censer",
    "Crowbar",
    "Grenade Launcher",
    "Hammer",
    "Hammer, Sledge",
    "Hourglass",
    "Ladder (10 foot)",
    "Mess Kit",
    "Mirror, Steel",
    "Pick, Miner's",
    "Pole (10-foot)",
    "Shovel",
    "Signal Whistle",
    "Small Knife",
    "Spellbook",
    "Spyglass",
    "Tent, Two-Person",
    "Whetstone",
  ];

  static LOOT_ITEM = [
    "Abacus",
    "Barding",
    "Basic Fishing Equipment",
    "Bedroll",
    "Bell",
    "Bit and Bridle",
    "Blanket",
    "Block and Tackle",
    "Book",
    "Magnifying Glass",
    "Scale, Merchant's",
    "Signet Ring",
    "String",
  ];

  static LOOT_TYPES = {
    "Gemstone": "gem",
    "Gem": "gem",
    "Art Object": "art",
    "Art": "art",
    "Material": "material",
    "Resource": "resource",
    "Treasure": "treasure",
    "Adventuring Gear": "gear",
    "Junk": "junk",
  };

  constructor({ characterManager, ddbItem, isCompendium = false, enricher = null } = {}) {

    this.characterManager = characterManager;
    this.ddbData = characterManager.source.ddb;
    this.ddbItem = ddbItem;
    this.ddbDefinition = ddbItem.definition;
    this.raw = characterManager.raw;
    this.isCompendiumItem = isCompendium;
    foundry.utils.setProperty(this.ddbItem, "isCompendiumItem", isCompendium);

    this.is2014 = this.ddbDefinition.isLegacy
      && this.ddbDefinition.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);

    this.originalName = utils.nameString(ddbItem.definition.name);
    this.name = DDBHelper.getName(this.ddbData, ddbItem, this.raw?.character);
    this.#generateItemFlags();

    this.documentType = null;
    this.parsingType = null;

    this.overrides = {
      ddbType: null,
      armorType: null,
      name: null,
      custom: false,
    };

    this.characterProficiencies = foundry.utils.getProperty(this.raw?.character, "flags.ddbimporter.dndbeyond.proficienciesIncludingEffects")
      ?? [];
    this.characterEffectAbilities = foundry.utils.getProperty(this.raw?.character, "flags.ddbimporter.dndbeyond.effectAbilities");

    this.isContainer = this.ddbDefinition.isContainer;
    this.isContainerTag = this.ddbDefinition.tags.includes('Container');
    this.isOuterwearTag = this.ddbDefinition.tags.includes('Outerwear')
      || this.ddbDefinition.tags.includes('Footwear');
    this.isClothingTag = this.isOuterwearTag || this.ddbDefinition.tags.includes('Clothing');
    this.isTashasInstalled = game.modules.get("dnd-tashas-cauldron")?.active;
    this.isTattoo = this.ddbDefinition.name.toLowerCase().includes("tattoo");
    this.tattooType = this.isTashasInstalled && this.isTattoo;

    // if the item is x per spell
    this.isPerSpell = this.ddbItem.limitedUse
      ? this.parsePerSpellMagicItem(this.ddbItem.limitedUse.resetTypeDescription ?? "")
      : false;

    this.magicChargeType = this.isPerSpell
      ? MagicItemMaker.MAGICITEMS.CHARGE_TYPE_PER_SPELL
      : MagicItemMaker.MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;

    this.itemTagTypes = this.ddbDefinition.type && this.ddbDefinition.tags && Array.isArray(this.ddbDefinition.tags)
      ? [this.ddbDefinition.type.toLowerCase(), ...this.ddbDefinition.tags.map((t) => t.toLowerCase())]
      : this.ddbDefinition.type
        ? [this.ddbDefinition.type.toLowerCase()]
        : this.ddbDefinition.tags && Array.isArray(this.ddbDefinition.tags)
          ? this.ddbDefinition.tags.map((t) => t.toLowerCase())
          : [];

    this.systemType = {
      value: null,
      subtype: null,
      baseItem: null,
    };

    this.addAutomationEffects = this.isCompendiumItem
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-effects")
      : game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-item-effects");

    this.updateExisting = this.isCompendiumItem
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")
      : false;
    this.spellsAsActivities = isCompendium
      || game.settings.get(SETTINGS.MODULE_ID, "spells-on-items-as-activities");
    this._init();

    this.data = {};

    this.#determineType();

    this.actionInfo = {
      associatedToolsOrAbilities: [],
      ability: null,
      activation: null,
      consumption: null,
      effects: null,
      range: null,
      target: null,
      save: null,
      duration: null,
      attack: null,
      magicBonus: {
        null: null,
        zero: 0,
      },
      isFlat: false,
      extraAttackBonus: "",
      meleeAttack: true,
      spellAttack: false,
      consumptionValue: null,
    };

    this.activityType = null;
    this.activities = [];
    this.activityTypes = [];


    this.activityOptions = {};

    this.damageParts = [];
    this.healingParts = [];
    this.additionalActivities = [];
    this.versatileDamage = "";

    this.addMagical = false;

    this.enricher = enricher;

  }

  _init() {
    logger.debug(`Generating Item ${this.ddbDefinition.name}`);
  }

  async #generateDataStub() {
    if (this.enricher.documentStub?.documentType) this.documentType = this.enricher.documentStub.documentType;
    if (this.enricher.documentStub?.systemType) this.systemType = foundry.utils.mergeObject(this.systemType, this.enricher.documentStub.systemType);
    if (this.enricher.documentStub?.parsingType) this.parsingType = this.enricher.documentStub.parsingType;

    if (!this.documentType) {
      logger.error(`Document type must be set: ${this.ddbDefinition.name}`, {
        this: this,
      });
      throw Error("Document type must be set", {
        this: this,
      });
    }

    this.data = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          originalName: this.originalName,
          version: CONFIG.DDBI.version,
          dndbeyond: {
            type: this.ddbDefinition.type,
          },
          is2014: this.is2014,
          is2024: !this.is2014,
        },
      },
    };

    if (this.enricher.documentStub?.copySRD) {
      const srdDoc = await fromUuid(this.enricher.documentStub.copySRD.uuid);
      const systemData = srdDoc.toObject().system;
      systemData.source.book = "";
      systemData.source.license = "";
      this.data.system = systemData;
    }

    if (this.enricher.documentStub?.replaceDefaultActivity) {
      this.data.system.activities = {};
    }

    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)

    if (foundry.utils.hasProperty(this.data, "system.type.value")) {
      this.data.system.type.value = this.systemType.value;
    } else if (this.systemType.value) {
      logger.error(`Unable to set type ${this.systemType.value} for ${this.ddbDefinition.name}`, {
        this: this,
      });
    }
    this.data.system.identified = true;

    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.is2014) {
      this.data.name += " (Legacy)";
    }

    this.#addExtraDDBFlags();
    this.#enrichFlags();
  }

  #getActivityDuration() {
    let duration = {
      value: null,
      units: "",
      special: "",
    };

    if (this.ddbDefinition.duration) {
      if (this.ddbDefinition.duration.durationUnit !== null) {
        duration.units = this.ddbDefinition.duration.durationUnit.toLowerCase();
      } else {
        duration.units = this.ddbDefinition.duration.durationType.toLowerCase().substring(0, 4);
      }
      if (this.ddbDefinition.duration.durationInterval) duration.value = this.ddbDefinition.duration.durationInterval;
    } else {
      const durationArray = [
        { foundryUnit: "day", descriptionMatches: ["day", "days"] },
        { foundryUnit: "hour", descriptionMatches: ["hour", "hours"] },
        { foundryUnit: "inst", descriptionMatches: ["instant", "instantaneous"] },
        { foundryUnit: "minute", descriptionMatches: ["minute", "minutes"] },
        { foundryUnit: "month", descriptionMatches: ["month", "months"] },
        { foundryUnit: "perm", descriptionMatches: ["permanent"] },
        { foundryUnit: "round", descriptionMatches: ["round", "rounds"] },
        // { foundryUnit: "spec", descriptionMatches: [null] },
        { foundryUnit: "turn", descriptionMatches: ["turn", "turns"] },
        { foundryUnit: "year", descriptionMatches: ["year", "years"] },
      ];
      // attempt to parse duration
      const descriptionUnits = durationArray.map((unit) => unit.descriptionMatches).flat().join("|");
      const durationExpression = new RegExp(`(\\d*)(?:\\s)(${descriptionUnits})`);
      const durationMatch = (this.ddbDefinition.description ?? "").match(durationExpression);

      if (durationMatch) {
        duration.units = durationArray.find((duration) => duration.descriptionMatches.includes(durationMatch[2])).foundryUnit;
        duration.value = durationMatch[1];
      }
    }
    return duration;
  }

  #generateSave() {
    const save = {
      ability: "",
      dc: {
        calculation: "",
        formula: "",
      },
    };

    const spellSaveCheck = (this.ddbDefinition.description ?? "").match(/succeed on a (.*?) saving throw (against your spell save DC)?/);
    if (spellSaveCheck && spellSaveCheck[1]) {
      save.ability = spellSaveCheck[1].toLowerCase().substr(0, 3);
      if (spellSaveCheck[2]) {
        save.dc.calculation = "spellcasting";
      }
      this.actionInfo.save = save;
    }

    const saveCheck = (this.ddbDefinition.description ?? "").match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
    if (saveCheck && saveCheck[2]) {
      save.ability = saveCheck[2].toLowerCase().substr(0, 3);
      save.dc.formula = `${saveCheck[1]}`;
      save.dc.calculation = "";
      this.actionInfo.save = save;
    }
  }

  #generateActivityActivation() {
    // default
    this.actionInfo.activation = { type: "action", value: 1, condition: "" };

    if (this.parsingType === "wonderous") {
      let action = "special";
      const actionRegex = /(bonus) action|(reaction)|as (?:an|a) (action)/i;

      const match = (this.ddbDefinition.description ?? "").match(actionRegex);
      if (match) {
        if (match[1]) action = "bonus";
        else if (match[2]) action = "reaction";
        else if (match[3]) action = "action";
      }

      this.actionInfo.activation = { type: action ?? "", value: action ? 1 : null, condition: "" };
    }

  }

  #generateActionInfo() {
    this.actionInfo.duration = this.#getActivityDuration();
    this.actionInfo.range = this.#getActivityRange();
    this.actionInfo.activation = this.#generateActivityActivation();
    this.#generateSave();
  }

  static #getDamageParts(modifiers, typeOverride = null) {
    return modifiers
      .filter((mod) => Number.isInteger(mod.value)
        || (mod.dice ? mod.dice : mod.die ? mod.die : undefined) !== undefined,
      )
      .map((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: die.diceString,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.value) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: mod.value,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.fixedValue) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: mod.fixedValue,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else {
          return null;
        }
      }).filter((part) => part !== null);
  }

  #generateAmmunitionDamage(magicalDamageBonus) {
    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && this.ddbDefinition.damageType) {
      const damageString = utils.parseDiceString(this.ddbDefinition.damage.diceString).diceString;
      const damage = DDBBasicActivity.buildDamagePart({
        damageString,
        type: this.ddbDefinition.damageType.toLowerCase(),
      });
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.damageParts.push(damage);
    }

    // additional damage parts
    const additionalDamageParts = DDBItem.#getDamageParts(
      this.ddbDefinition.grantedModifiers
        .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === "")),
    );
    this.damageParts.push(...additionalDamageParts);

    // Add saving throw additional
    // e.g. arrow of slaying is "DC 17 Constitution for Half Damage",
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const damageParts = DDBItem.#getDamageParts([mod]);

        if (damageParts.length === 0) {
          const saveSearch = /DC (\d+) (\w+) /i;
          const saveMatch = mod.restriction.match(saveSearch);

          this.additionalActivities.push({
            type: this.saveMatch ? "save" : "damage",
            options: {
              generateDamage: true,
              damageParts,
              includeBaseDamage: false,
              saveOverride: saveMatch
                ? {
                  formula: `${saveMatch[1]}`,
                  calculation: "",
                  ability: saveMatch[2].toLowerCase().substr(0, 3),
                }
                : null,
            },
          });
        }
      });
  }

  #generateGrantedModifiersDamageParts() {
    const healingModifiers = this.ddbDefinition.grantedModifiers.filter(
      (mod) => mod.type === "bonus" && mod.subType === "hit-points",
    );
    if (healingModifiers) {
      const healingDamageParts = DDBItem.#getDamageParts(healingModifiers, "healing");
      this.healingParts.push(...healingDamageParts);
    }

    const additionalDamageParts = DDBItem.#getDamageParts(
      this.ddbDefinition.grantedModifiers
        .filter((mod) => mod.type === "damage" && CONFIG.DND5E.damageTypes[mod.subType]),
    );
    this.damageParts.push(...additionalDamageParts);

  }

  #generateStaffDamageParts() {
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    let versatile = weaponBehavior.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      this.versatileDamage = utils.parseDiceString(versatile.notes).diceString;
    }

    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (weaponBehavior.damage && weaponBehavior.damage.diceString && weaponBehavior.damageType) {
      const damageString = utils.parseDiceString(weaponBehavior.damage.diceString).diceString;
      const damage = DDBBasicActivity.buildDamagePart({
        damageString,
        type: weaponBehavior.damageType.toLowerCase(),
        stripMod: true,
      });
      this.damageParts.push(damage);
    }

    // additional damage parts
    this.#generateGrantedModifiersDamageParts();

  }


  #generateWeaponDamageParts() {
    // we can safely make these assumptions about GWF
    // flags are only added for melee attacks
    const greatWeaponFighting = this.flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
    const twoHanded = (this.ddbDefinition.properties ?? []).find((property) => property.name === "Two-Handed");

    const damageType = DDBHelper.getDamageType(this.ddbItem);

    const versatile = (this.ddbDefinition.properties ?? []).find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      this.versatileDamage = utils.parseDiceString(versatile.notes, null, "", greatWeaponFighting).diceString;
    }

    // if we have greatweapon fighting style and this is two handed, add the roll tweak
    const fightingStyleDiceMod = twoHanded ? greatWeaponFighting : "";

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is added to the weapon flags before parse weapon is called
    const martialArtsDie = this.flags.martialArtsDie;

    if (Number.isInteger(this.ddbDefinition.fixedDamage)) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(this.ddbDefinition.fixedDamage, "", "", fightingStyleDiceMod).diceString,
        stripMod: true,
        type: damageType,
      });
      this.damageParts.push(damage);
    } else if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && damageType) {
      let diceString = this.ddbDefinition.damage.diceString;
      if (martialArtsDie.diceValue && this.ddbDefinition.damage.diceValue && martialArtsDie.diceValue > this.ddbDefinition.damage.diceValue) {
        diceString = martialArtsDie.diceString;
      }
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(diceString, "", "", fightingStyleDiceMod).diceString,
        stripMod: true,
        type: damageType,
      });
      this.damageParts.push(damage);
    }

    const modsOnWeapon = this.ddbDefinition.grantedModifiers.filter((mod) => mod.type === "damage");
    const unfilteredDamageMods = modsOnWeapon.length === 0
      ? DDBHelper.getModifiers(this.ddbData, "item")
        .filter((mod) => mod.type === "damage" && this.ddbDefinition.id === mod.componentId
          && this.ddbDefinition.entityTypeId === mod.componentTypeId)
      : modsOnWeapon;

    // console.error(`Weapon mods for ${this.name}`, {
    //   unfilteredDamageMods,
    //   modsOnWeapon,
    //   raw: DDBHelper.getModifiers(this.ddbData, "item"),
    //   filtered: DDBHelper.getModifiers(this.ddbData, "item")
    //     .filter((mod) => mod.type === "damage" && this.ddbDefinition.id === mod.componentId
    //       && this.ddbDefinition.entityTypeId === mod.componentTypeId),
    // })

    // additional damage parts with no restrictions
    unfilteredDamageMods
      .filter((mod) => !mod.restriction || mod.restriction === "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : mod.value;
        if (damagePart) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: utils.parseDiceString(damagePart, "", "", fightingStyleDiceMod).diceString,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });
          this.damageParts.push(damage);
        }
      });

    let restrictions = [];
    // loop over restricted damage types
    unfilteredDamageMods
      .filter((mod) => mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : `${mod.value}`;
        if (damagePart) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: damagePart,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });

          const viciousWeapon = this.originalName.startsWith("Vicious ");
          if (!viciousWeapon) {
            this.additionalActivities.push({
              name: `Restricted Attack: ${mod.restriction}`,
              options: {
                generateDamage: true,
                damageParts: [damage],
                includeBaseDamage: this.enricher.activity?.additionalDamageIncludeBase ?? false,
                chatFlavor: mod.restriction ?? "",
              },
            });
            restrictions.push(mod.restriction);
          }
          if (viciousWeapon) {
            this.activityOptions.criticalDamage = "7";
          }
        }
      });

    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.restrictions");
    // add damage modifiers from other sources like improved divine smite
    if (this.flags.damage.parts) {
      this.flags.damage.parts.forEach((part) => {
        const damage = DDBBasicActivity.buildDamagePart({
          damageString: part[0],
          stripMod: true,
          type: part[1],
        });
        this.damageParts.push(damage);
      });
    }
  }

  /**
   * Gets the DND5E weapontype (simpleM, martialR etc.) as string
   * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
   */
  #getWeaponType() {
    const type = DICTIONARY.weapon.weaponType.find(
      (type) => type.categoryId === this.ddbDefinition.categoryId,
    );
    const range = DICTIONARY.weapon.weaponRange.find(
      (type) => type.attackType === this.ddbDefinition.attackType,
    );

    if (type && range) {
      return `${type.value}${range.value}`;
    } else {
      return "simpleM";
    }
  }

  #getArmorType() {
    // get the generic armor type
    const nameEntry = DICTIONARY.equipment.armorType.find((type) => type.name === this.ddbDefinition.type);
    const idEntry = DICTIONARY.equipment.armorType.find((type) => type.id === this.ddbDefinition.armorTypeId);

    const armorType = nameEntry !== undefined
      ? nameEntry.value
      : idEntry !== undefined
        ? idEntry.value
        : "medium";

    return armorType;
  }

  #generateArmorMaxDex() {
    let maxDexModifier;
    switch (this.systemType.value) {
      case "heavy":
        maxDexModifier = 0;
        break;
      case "medium":
        maxDexModifier = this.flags.maxMediumArmorDex ?? 2;
        break;
      default:
        maxDexModifier = null;
        break;
    }
    const maxDexMods = DDBHelper.filterModifiersOld(this.ddbDefinition.grantedModifiers, "set", "ac-max-dex-modifier");
    const itemDexMaxAdjustment = DDBHelper.getModifierSum(maxDexMods, this.raw?.character);
    if (maxDexModifier !== null && Number.isInteger(itemDexMaxAdjustment) && itemDexMaxAdjustment > maxDexModifier) {
      maxDexModifier = itemDexMaxAdjustment;
    }

    this.data.system.armor.dex = maxDexModifier;
  }

  #determineOtherGearTypeIdOneType() {
    switch (this.ddbDefinition.subType) {
      case "Potion":
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Tool":
        this.documentType = "tool";
        this.parsingType = "tool";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Ammunition":
        this.documentType = "consumable";
        this.systemType.value = "ammo";
        this.parsingType = "ammunition";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Arcane Focus":
      case "Holy Symbol":
      case "Druidic Focus":
        this.documentType = "equipment";
        this.systemType.value = "trinket";
        this.parsingType = "wonderous";
        this.overrides.ddbType = this.ddbDefinition.subType;
        break;
      case "Vehicle":
      case "Mount":
        this.#getLootType(this.ddbDefinition.subType);
        break;
      default: {
        // console.warn(`Default subtype for ${this.name}`, {
        //   this: this,
        //   clothingItem: DDBItem.CLOTHING_ITEMS.includes(this.ddbDefinition.name),
        //   clothingExpressions: !this.isContainer && this.isOuterwearTag && !this.isContainerTag,
        // });
        if ((!this.isContainer && this.isOuterwearTag && !this.isContainerTag)
          || DDBItem.CLOTHING_ITEMS.includes(this.ddbDefinition.name)
        ) {
          this.documentType = "equipment";
          this.systemType.value = "clothing";
          this.parsingType = "wonderous";
          this.overrides.ddbType = "Clothing";
          this.overrides.armorType = "clothing"; // might not need this anymore
        } else if (DDBItem.EQUIPMENT_TRINKET.includes(this.ddbDefinition.name)) {
          this.documentType = "equipment";
          this.systemType.value = "trinket";
          this.parsingType = "wonderous";
          this.overrides.ddbType = this.ddbDefinition.subType;
        } else {
          this.#getLootType(this.ddbDefinition.subType);
        }
      }
    }
  }

  // eslint-disable-next-line complexity
  #getLootType(typeHint) {
    this.overrides.ddbType = typeHint ?? this.ddbDefinition.subType;
    this.parsingType = "loot";
    this.documentType = "loot";

    if (this.isContainer
      || ["Mount", "Vehicle"].includes(this.ddbDefinition.subType)
      || ["Vehicle", "Mount"].includes(typeHint)
    ) {
      this.overrides.ddbType = typeHint;
      this.documentType = "container";
      return;
    } else if (this.ddbDefinition.name.startsWith("Lantern,")
      || ["Lamp", "Healer's Kit"].includes(this.ddbDefinition.name)
    ) {
      this.documentType = "consumable";
      this.systemType.value = "trinket";
      return;
    } else if (["Waterskin"].includes(this.ddbDefinition.name)) {
      this.documentType = "consumable";
      this.systemType.value = "food";
      return;
    } else if (this.ddbDefinition.name.startsWith("Spell Scroll:")) {
      this.documentType = "consumable";
      this.systemType.value = "scroll";
      return;
    }

    let itemType = this.itemTagTypes
      .map((itemType) => {
        if (itemType === "container") return "container";
        if (itemType === "consumable") return "consumable";
        return DICTIONARY.types.full.find((t) => t.indexOf(itemType) !== -1 || itemType.indexOf(t) !== -1);
      })
      .reduce(
        (itemType, currentType) => (currentType !== undefined && itemType === undefined ? currentType : itemType),
        undefined,
      );

    if (!itemType && this.ddbDefinition.type === "Gear"
      && ["Adventuring Gear"].includes(this.ddbDefinition.subType)
      && !DDBItem.LOOT_ITEM.includes(this.ddbDefinition.name)
    ) {
      // && data.definition.subType === "Adventuring Gear"
      // && data.definition.tags.includes('Utility')
      // && ((data.definition.tags.includes('Damage')
      // && data.definition.tags.includes('Combat'))
      // || data.definition.tags.includes('Healing'));
      itemType = "consumable";
    }

    if (itemType) {
      this.documentType = itemType;
      if (itemType === "consumable") {
        if (this.ddbDefinition.name.includes('vial') || this.ddbDefinition.name.includes('flask')) {
          this.systemType.value = "potion";
        } else if (this.ddbDefinition.name.startsWith("Ration")) {
          this.systemType.value = "food";
        } else {
          this.systemType.value = "trinket";
        }
      }
    }

    if (this.documentType === "loot") {
      const lookup = DDBItem.LOOT_TYPES[typeHint]
        ?? DDBItem.LOOT_TYPES[this.ddbDefinition.subType];
      if (lookup) this.systemType.value = lookup;
      else {
        logger.error(`Failed to find loot type for ${this.ddbDefinition.name}`, {
          this: this,
          itemType,
          lookup,
        });
      }
    }
  }

  #fallbackType() {
    if (this.ddbDefinition.name.includes(" Ring")) {
      this.documentType = "equipment";
      this.systemType.value = "trinket";
      this.parsingType = "wonderous";
      this.overrides.ddbType = "Ring";
    } else if (this.ddbDefinition.subType) {
      this.#getLootType(this.ddbDefinition.subType);
    } else {
      this.#getLootType("Miscellaneous");
    }
  }

  #determineOtherGearType() {
    switch (this.ddbDefinition.gearTypeId) {
      case 1:
        this.#determineOtherGearTypeIdOneType();
        break;
      case 4:
        this.#getLootType("Mount");
        break;
      case 5:
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = "Poison";
        break;
      case 6:
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = "Potion";
        break;
      case 11:
        this.documentType = "tool";
        this.parsingType = "tool";
        this.overrides.ddbType = "Tool";
        break;
      case 12:
      case 17:
      case 19:
        this.#getLootType("Vehicle");
        break;
      case 16:
        this.#getLootType("Equipment Pack");
        break;
      case 18:
        // Change to parseGemstone (consummable) ?
        this.#getLootType("Gemstone");
        break;
      default:
        this.#fallbackType();
        logger.warn("Other Gear type missing from " + this.ddbDefinition.name, this.ddbItem);
    }
  }

  // eslint-disable-next-line complexity
  #determineType() {
    if (!this.ddbDefinition.filterType) {
      if (this.ddbDefinition.name.startsWith("Spell Scroll:")) {
        this.documentType = "consumable";
        this.systemType.value = "scroll";
      } else {
        this.documentType = "loot";
      }
      this.parsingType = "custom";
      this.overrides.ddbType = "Custom Item";
      this.overrides.custom = true;
      return;
    }

    switch (this.ddbDefinition.filterType) {
      case "Weapon": {
        if (this.ddbDefinition.type === "Ammunition" || this.ddbDefinition.subType === "Ammunition") {
          this.documentType = "consumable";
          this.systemType.value = "ammo";
          this.parsingType = "ammunition";
        } else {
          this.documentType = "weapon";
          this.systemType.value = this.#getWeaponType();
          this.parsingType = "weapon";
        }
        break;
      }
      case "Armor":
        this.documentType = "equipment";
        this.systemType.value = this.#getArmorType();
        this.parsingType = "armor";
        break;
      case "Ring":
      case "Wondrous item": {
        if ([
          "bead of",
          "dust of",
          "elemental gem",
        ].some((consumablePrefix) => name.toLowerCase().startsWith(consumablePrefix.toLowerCase()))) {
          this.documentType = "consumable";
          this.systemType.value = "trinket";
          this.parsingType = "consumable";
          this.overrides.ddbType = this.ddbDefinition.type;
        } else if (this.isTattoo) {
          this.overrides.ddbType = "Tattoo";
          const type = this.tattooType
            ? "dnd-tashas-cauldron.tattoo"
            : this.isContainer ? "container" : "equipment";
          this.documentType = type;
          this.parsingType = "wonderous";
          if (this.tattooType) {
            this.systemType.value = this.ddbDefinition.name.toLowerCase().includes("spellwrought")
              ? "spellwrought"
              : "permanent";
            this.addMagical = true;
          }
        } else {
          this.documentType = this.isContainer ? "container" : "equipment";
          this.systemType.value = "trinket";
          this.parsingType = "wonderous";
        }
        break;
      }
      case "Scroll":
      case "Wand":
      case "Rod":
        this.documentType = "consumable";
        this.systemType.value = this.ddbDefinition.filterType.toLowerCase();
        this.parsingType = "consumable";
        this.overrides.ddbType = this.ddbDefinition.type;
        break;
      case "Staff":
        this.documentType = "weapon";
        this.systemType.value = this.#getWeaponType();
        this.parsingType = "staff";
        break;
      case "Potion":
        this.documentType = "consumable";
        this.systemType.value = "potion";
        this.parsingType = "consumable";
        this.overrides.ddbType = this.ddbDefinition.type;
        break;
      case "Other Gear":
        this.#determineOtherGearType();
        break;
      default:
        logger.warn(`Item filterType not implemented for ${this.ddbDefinition.name}`, { DDBItem: this });
        break;
    }

  }

  #getWarlockFeatures() {
    // Some features, notably hexblade abilities we scrape out here
    const warlockFeatures = this.ddbData.character.characterValues
      .filter(
        (characterValue) =>
          characterValue.value
          && characterValue.valueId == this.ddbItem.id
          && DICTIONARY.character.characterValuesLookup.some(
            (entry) => entry.typeId == characterValue.typeId,
          ),
      )
      .map(
        (characterValue) =>
          DICTIONARY.character.characterValuesLookup.find(
            (entry) => entry.typeId == characterValue.typeId,
          ).name,
      );

    // Any Pact Weapon Features
    const pactFeatures = this.ddbData.character.options.class
      .filter(
        (option) =>
          warlockFeatures.includes("pactWeapon")
          && option.definition.name
          && DICTIONARY.character.pactFeatures.includes(option.definition.name),
      )
      .map((option) => option.definition.name);

    const features = warlockFeatures.concat(pactFeatures);
    return features;
  }

  isMartialArtists() {
    return this.ddbData.character.classes.some((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
  }

  #getMonkFeatures() {
    const kenseiWeapon = DDBHelper.getChosenClassModifiers(this.ddbData).some((mod) =>
      mod.friendlySubtypeName === this.ddbDefinition.type
      && mod.type === "kensei",
    );

    const monkWeapon = DDBHelper.getChosenClassModifiers(this.ddbData).some((mod) =>
      mod.friendlySubtypeName === this.ddbDefinition.type
      && mod.type == "monk-weapon",
    ) || (this.ddbDefinition.isMonkWeapon && this.isMartialArtists());

    let features = [];

    if (kenseiWeapon) features.push("kenseiWeapon");
    if (monkWeapon) features.push("monkWeapon");

    return features;
  }

  #getMartialArtsDie() {
    let result = {
      diceCount: null,
      diceMultiplier: null,
      diceString: null,
      diceValue: null,
      fixedValue: null,
    };

    const die = this.ddbData.character.classes
      // is a martial artist
      .filter((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"))
      // get class features
      .map((cls) => cls.classFeatures)
      .flat()
      // filter relevant features, those that are martial arts and have a levelscaling hd
      .filter((feature) => feature.definition.name === "Martial Arts" && feature.levelScale && feature.levelScale.dice)
      // get this dice object
      .map((feature) => feature.levelScale.dice);

    if (die && die.length > 0) {
      result = die[0];
    }

    return result;
  }

  /**
 * We get extra damage to a weapon attack here, for example Improved
 * Divine Smite
 * @param {*} restrictions (array)
 */
  #getExtraDamage(restrictions) {
    return DDBHelper.filterBaseModifiers(this.ddbData, "damage", { restriction: restrictions }).map((mod) => {
      const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
      if (die) {
        return [die.diceString, mod.subType];
      } else if (mod.value) {
        return [mod.value, mod.subType];
      } else {
        return [null, null];
      }
    });
  }

  #getClassFeatures() {
    const warlockFeatures = this.#getWarlockFeatures();
    const monkFeatures = this.#getMonkFeatures();
    return warlockFeatures.concat(monkFeatures);
  }

  #generateItemFlags() {
    this.flags = {
      damage: {
        parts: [],
      },
      // Some features, notably hexblade abilities we scrape out here
      classFeatures: this.#getClassFeatures(),
      martialArtsDie: this.#getMartialArtsDie(),
      maxMediumArmorDex: Math.max(
        ...DDBHelper.filterBaseModifiers(this.ddbData, "set", { subType: "ac-max-dex-armored-modifier", includeExcludedEffects: true }).map((mod) => mod.value),
        ...DDBHelper.filterModifiersOld(this.ddbDefinition?.grantedModifiers ?? this.ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-armored-modifier", ["", null], true).map((mod) => mod.value),
        ...DDBHelper.filterModifiersOld(this.ddbDefinition?.grantedModifiers ?? this.ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-modifier", ["", null], true).map((mod) => mod.value),
        2,
      ),
      magicItemAttackInt: DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0,
    };

    if (this.flags.classFeatures.includes("Lifedrinker")) {
      this.flags.damage.parts.push(["@abilities.cha.mod", "necrotic"]);
    }

    // for melee attacks get extras
    if (this.ddbDefinition.attackType === 1) {
      // get improved divine smite etc for melee attacks
      const extraDamage = this.#getExtraDamage(["Melee Weapon Attacks"]);

      if (!!extraDamage.length > 0) {
        this.flags.damage.parts = this.flags.damage.parts.concat(extraDamage);
      }
      // do we have great weapon fighting?
      if (DDBHelper.hasChosenCharacterOption(this.ddbData, "Great Weapon Fighting")) {
        this.flags.classFeatures.push("greatWeaponFighting");
      }
      // do we have two weapon fighting style?
      if (DDBHelper.hasChosenCharacterOption(this.ddbData, "Two-Weapon Fighting")) {
        this.flags.classFeatures.push("Two-Weapon Fighting");
      }
      if (DDBHelper.getCustomValueFromCharacter(this.ddbItem, this.raw?.character, 18)) {
        this.flags.classFeatures.push("OffHand");
      }
    }
    // ranged fighting style is added as a global modifier elsewhere
    // as is defensive style

    logger.debug(`Flags for ${this.ddbItem.name ?? this.ddbDefinition.name}`, { ddbItem: this.ddbItem, flags: this.flags });
  };


  async #prepare() {
    this.enricher.load({
      ddbParser: this,
    });
    await this.#generateDataStub();
    this.#generateBaseItem();
    this.#generateActionInfo();
    this.#generateDamageParts();
  }

  #getDescription() {
    const chatSnippet = this.ddbDefinition.snippet ? this.ddbDefinition.snippet : "";
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");

    const attunementText = this.ddbDefinition.canAttune && this.ddbDefinition.attunementDescription && this.ddbDefinition.attunementDescription !== ""
      ? `<div class="item-attunement"><i>(Requires attunement by a ${this.ddbDefinition.attunementDescription})</i></div>`
      : "";

    const valueDamageText = parseDamageRolls({ text: this.ddbDefinition.description, document: this.data, actor: null });
    const chatDamageText = chatAdd ? parseDamageRolls({ text: chatSnippet, document: this.data, actor: null }) : "";
    return {
      value: parseTags(attunementText + valueDamageText),
      chat: chatAdd ? parseTags(chatDamageText) : "",
    };
  }

  #generateQuantity() {
    this.data.system.quantity = this.ddbDefinition.quantity
      ? this.ddbDefinition.quantity
      : this.ddbItem.quantity
        ? this.ddbItem.quantity
        : 1;
  }

  #getSingleItemWeight() {
    const bundleSize = this.ddbDefinition?.bundleSize ? this.ddbDefinition.bundleSize : 1;
    const totalWeight = this.ddbDefinition?.weight ? this.ddbDefinition.weight : 0;
    const weight = totalWeight / bundleSize;
    return {
      value: weight,
      units: "lb",
    };
  }

  #generateEquipped() {
    if (this.ddbDefinition.canEquip !== undefined && this.ddbDefinition.canEquip === true) {
      this.data.system.equipped = this.ddbItem.equipped;
    } else {
      this.data.system.equipped = false;
    }
  }

  #generateItemRarity() {
    const tmpRarity = this.ddbDefinition.rarity;
    const isMundaneItem = this.ddbDefinition?.rarity === "Common" && !this.ddbDefinition.magic;
    const rarity = this.ddbDefinition.rarity && !isMundaneItem
      ? tmpRarity.charAt(0).toLowerCase() + tmpRarity.slice(1).replace(/\s/g, "")
      : "";
    this.data.system.rarity = rarity;
  }

  #getActivityRange() {
    const range = {
      value: this.ddbDefinition.range ? this.ddbDefinition.range : null,
      long: this.ddbDefinition.longRange ? this.ddbDefinition.longRange : null,
      units: (this.ddbDefinition.range || this.ddbDefinition.range) ? "ft" : "",
      special: "",
    };

    if (this.ddbDefinition.description.includes("touch")) {
      range.value = "touch";
    }

    const thrownRangeRegex = /(throw|thrown|throw this|throw it|throw the|throw a (?:\w+))( \w+| at a point)? (the|this|up to) (\d+) feet/ig;
    const match = thrownRangeRegex.exec(this.ddbDefinition.description);
    if (match) {
      range.value = match[4];
      range.units = "ft";
    }

    const canSeeWithinRegex = /creature( or object)? you can see within (\d+) feet/ig;
    const match2 = canSeeWithinRegex.exec(this.ddbDefinition.description);
    if (match2) {
      range.value = match2[2];
      range.units = "ft";
    }

    return range;
  }

  #getWeaponRange() {
    // sometimes reach weapons have their range set as 5. it's not clear why.
    const shortRange = this.ddbDefinition.range ? this.ddbDefinition.range : 5;
    const reach = this.data.system.properties.includes("rch") && this.ddbDefinition.range == 5 ? 5 : 0;
    return {
      value: shortRange + reach,
      long: (this.ddbDefinition.longRange && this.ddbDefinition.longRange != this.ddbDefinition.range)
        ? this.ddbDefinition.longRange + reach
        : "",
      units: "ft",
      reach: null,
    };
  }

  #getWeaponBehaviourRange() {
    // range: { value: null, long: null, units: '' },
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    return {
      value: weaponBehavior.range ?? 5,
      long: weaponBehavior.longRange ?? 5,
      units: "ft",
    };
  }

  #getMagicalBonus(returnZero = false) {
    const bonus = this.ddbDefinition.grantedModifiers
      .filter(
        (mod) => mod.type === "bonus" && mod.subType === "magic" && mod.value && mod.value !== 0,
      )
      .reduce((prev, cur) => prev + cur.value, 0);
    return bonus === 0 && !returnZero ? "" : bonus;
  }

  #getWeaponMagicalBonus(returnZero = false) {
    const bonus = this.#getMagicalBonus(returnZero);
    if (this.flags.classFeatures.includes("Improved Pact Weapon") && bonus === 0) {
      return 1;
    } else {
      return bonus;
    }
  };

  #getMagicalArmorBonus() {
    const bonus = this.ddbDefinition.grantedModifiers
      .filter(
        (mod) => mod.type === "bonus" && mod.subType === "armor-class" && mod.value && mod.value !== 0,
      )
      .reduce((prev, cur) => prev + cur.value, 0);
    return bonus;
  }

  #generateBaseItem() {

    let baseItem;
    let toolType;

    if (this.ddbDefinition.filterType === "Weapon") {
      baseItem = this.ddbDefinition.type.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
    } else if (this.ddbDefinition.filterType === "Armor" && this.ddbDefinition.baseArmorName) {
      baseItem = this.ddbDefinition.baseArmorName.toLowerCase().split(",").reverse().join("").replace(/\s/g, "");
    } else if (this.ddbDefinition.filterType === "Other Gear"
      && ((this.ddbDefinition.gearTypeId === 1 && this.ddbDefinition.subType === "Tool")
        || (this.ddbDefinition.gearTypeId === 11))) {
      const toolProficiencies = DICTIONARY.character.proficiencies
        .filter((prof) => prof.type === "Tool")
        .map((prof) => {
          return prof;
        });

      const baseTool = toolProficiencies.find((allProf) => allProf.name.toLowerCase() === this.ddbDefinition.name.toLowerCase());
      if (baseTool && baseTool.baseTool) {
        baseItem = baseTool.baseTool;
        toolType = baseTool.toolType;
      }
    } else if (this.ddbDefinition.filterType === "Staff") {
      baseItem = "quarterstaff";
    }


    if (baseItem) foundry.utils.setProperty(this.data, "system.type.baseItem", baseItem);
    if (toolType) {
      foundry.utils.setProperty(this.data, "system.type.value", toolType);
      this.actionInfo.associatedToolsOrAbilities.push(toolType);
    }

  }

  #generateProficient() {
    if (this.characterProficiencies.some((proficiency) =>
      proficiency.name === this.ddbDefinition.type
      || proficiency.name === this.ddbDefinition.baseArmorName)
    ) {
      this.data.system.proficient = true;
    }
  }

  #generateDamageParts() {
    switch (this.parsingType) {
      case "ammunition": {
        this.#generateAmmunitionDamage();
        break;
      }
      case "staff": {
        this.#generateStaffDamageParts();
        break;
      }
      case "weapon": {
        this.#generateWeaponDamageParts();
        break;
      }
      default: {
        this.#generateGrantedModifiersDamageParts();
      }
    }
  }

  #generateMagicalBonus() {
    this.actionInfo.magicBonus.null = this.#getMagicalBonus();
    this.actionInfo.magicBonus.zero = this.#getMagicalBonus(true);
    switch (this.parsingType) {
      case "armor": {
        const magicBonus = this.#getMagicalArmorBonus();
        if (magicBonus > 0) {
          this.data.system.armor.magicalBonus = magicBonus;
          this.addMagical = true;
        }
        break;
      }
      case "staff":
      case "ammunition": {
        if (this.actionInfo.magicBonus.zero > 0) {
          this.addMagical = true;
          this.data.system.magicalBonus = this.actionInfo.magicBonus.zero;
        }
        break;
      }
      case "weapon": {
        const magicalBonus = this.#getWeaponMagicalBonus(true);
        this.actionInfo.magicBonus.zero = magicalBonus;
        if (magicalBonus > 0) {
          this.data.system.magicalBonus = magicalBonus;
          this.addMagical = true;
        }
        break;
      }
      default: {
        if (this.actionInfo.magicBonus.zero > 0) {
          this.addMagical = true;
          if (!this.enricher.effect)
            logger.error(`Magical Bonus detected, but not handled for ${this.name}`, {
              this: this,
            });
        }
      }
    }
  }

  static getRechargeFormula(description, maxCharges) {
    if (description === "" || !description) {
      return `${maxCharges}`;
    }

    let chargeMatchFormula = /regains (\dd\d* \+ \d) expended charges/i;
    let chargeMatchFixed = /regains (\d*) /i;
    let chargeMatchLastDitch = /(\dd\d* \+ \d)/i;
    let chargeNextDawn = /can't be used this way again until the next/i;

    let matchFormula = chargeMatchFormula.exec(description);
    let matchFixed = chargeMatchFixed.exec(description);
    let matchLastDitch = chargeMatchLastDitch.exec(description);

    let match = maxCharges;
    if (matchFormula && matchFormula[1]) {
      match = matchFormula[1];
    } else if (matchFixed && matchFixed[1]) {
      match = matchFixed[1];
    } else if (matchLastDitch && matchLastDitch[1]) {
      match = matchLastDitch[1];
    } else if (description.search(chargeNextDawn) !== -1) {
      match = maxCharges;
    }

    return `${match}`;
  }

  _getUses(prompt = false) {
    if (this.ddbItem.limitedUse !== undefined && this.ddbItem.limitedUse !== null && this.ddbItem.limitedUse.resetTypeDescription !== null) {
      let resetType = DICTIONARY.resets.find((reset) => reset.id == this.ddbItem.limitedUse.resetType);

      const recoveryFormula = DDBItem.getRechargeFormula(this.ddbItem.limitedUse.resetTypeDescription, this.ddbItem.limitedUse.maxUses);
      const recoveryIsMax = `${recoveryFormula}` === `${this.ddbItem.limitedUse.maxUses}`;

      const recovery = [];
      if (resetType.value && !["", "charges"].includes(resetType.value)) {
        recovery.push({
          period: resetType.value,
          type: recoveryIsMax ? "recoverAll" : "formula",
          formula: recoveryIsMax ? "" : recoveryFormula,
        });
      }
      return {
        max: this.ddbItem.limitedUse.maxUses,
        spent: this.ddbItem.limitedUse.numberUsed ?? 0,
        recovery,
        prompt,
      };
    } else {
      return { spent: 0, max: null, recovery: [], prompt };
    }
  }

  static getMagicItemResetType(description) {
    let resetType = null;

    const chargeMatchFormula = /expended charges (?:\w+|each day) at (\w+)/i;
    const usedAgainFormula = /(?:until|when) you (?:take|finish) a (short|long|short or long) rest/i;
    const chargeNextDawnFormula = /can't be used this way again until the next (dawn|dusk)/i;

    const chargeMatch = chargeMatchFormula.exec(description);
    const untilMatch = usedAgainFormula.exec(description);
    const dawnMatch = chargeNextDawnFormula.exec(description);

    if (chargeMatch && chargeMatch[1] && ["dawn", "dusk"].includes(chargeMatch[1].toLowerCase())) {
      resetType = chargeMatch[1].toLowerCase();
    } else if (chargeMatch && chargeMatch[1] && ["sunset"].includes(chargeMatch[1].toLowerCase())) {
      resetType = "dusk";
    } else if (dawnMatch && dawnMatch[1]) {
      resetType = utils.capitalize(dawnMatch[1].toLowerCase());
    } else if (chargeMatch && chargeMatch[1]) {
      resetType = "day";
    } else if (untilMatch && untilMatch[1]) {
      switch (untilMatch[1]) {
        case "short or long":
          resetType = "sr";
          break;
        default:
          resetType = utils.capitalize(`${untilMatch[1]}Rest`);
      }
    }

    // console.warn("reset type", {
    //   chargeMatch,
    //   untilMatch,
    //   dawnMatch,
    //   description,
    //   resetType,
    // });

    return resetType;
  }

  _getCompendiumUses() {
    if (!this.isCompendiumItem) return { spent: 0, max: null, recovery: [], prompt };
    const maxUses = /has (\d*) charges/i;
    const maxUsesMatches = maxUses.exec(this.ddbItem.definition.description);
    const limitedUse = {
      maxUses: (maxUsesMatches && maxUsesMatches[1]) ? maxUsesMatches[1] : null,
      numberUsed: 0,
      resetType: DDBItem.getMagicItemResetType(this.ddbItem.definition.description),
      resetTypeDescription: this.ddbItem.definition.description,
    };

    if (limitedUse.maxUses) {
      const recoveryFormula = DDBItem.getRechargeFormula(this.ddbItem.definition.description, limitedUse.maxUses);
      const recoveryIsMax = `${recoveryFormula}` === `${limitedUse.maxUses}`;

      const recovery = [];
      if (limitedUse.resetType && !["", "charges"].includes(limitedUse.resetType)) {
        recovery.push({
          period: limitedUse.resetType,
          type: recoveryIsMax ? "recoverAll" : "formula",
          formula: recoveryIsMax ? "" : recoveryFormula,
        });
      }
      this.actionInfo.consumptionValue = 1;

      return {
        max: `${limitedUse.maxUses}`,
        spent: 0,
        recovery,
        prompt,
      };
    } else {
      return { spent: null, max: null, recovery: [], prompt };
    }
  }

  // { value: "recoverAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.RecoverAll") },
  // { value: "loseAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.LoseAll") },
  // { value: "formula", label: game.i18n.localize("DND5E.USES.Recovery.Type.Formula") }
  _generateUses(prompt = false) {
    this.data.system.uses = this.isCompendiumItem
      ? this._getCompendiumUses()
      : this._getUses(prompt);

    if (!this.data.system.uses.max || this.data.system.uses.max === "") {
      this.data.system.uses.spent = null;
    }
  }

  _generateConsumableUses() {
    this.actionInfo.consumptionValue = 1;
    if (this.ddbItem.limitedUse) {
      this._generateUses(true);
    } else {
      // default
      this.data.system.uses = {
        spent: 0,
        max: "1",
        recovery: [],
        autoDestroy: true,
        autoUse: false,
      };
    }
    this.data.system.uses.autoDestroy = !["wand", "trinket"].includes(this.systemType.value);
  }

  targetsCreature() {
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range|each creature within/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /attack against the target|at a target in range/gi;
    return this.ddbDefinition.description.match(creature)
      || this.ddbDefinition.description.match(creaturesRange)
      || this.ddbDefinition.description.match(targets);
  }

  #escapeCheckGeneration() {
    const escape = this.ddbDefinition.description.match(/escape DC ([0-9]+)/);
    if (escape) {
      const escape = this.ddbDefinition.description.match(/escape DC ([0-9]+)/);
      if (escape) {
        this.additionalActivities.push({
          type: "check",
          name: `Escape Check`,
          options: {
            generateCheck: true,
            generateTargets: false,
            generateRange: false,
            checkOverride: {
              "associated": [
                "acr",
                "ath",
              ],
              "ability": "",
              "dc": {
                "calculation": "",
                "formula": escape[1],
              },
            },
          },
        });
      }
    }
  }

  // eslint-disable-next-line complexity
  #generateDamageFromDescription() {
    if (this.damageParts.length > 0) {
      logger.debug(`Skipping damage description parse as damage already created`);
      return;
    }
    let description = utils.stripHtml(this.ddbDefinition.description).replace(/[–-–−]/g, "-");
    // console.warn(hit);
    // eslint-disable-next-line no-useless-escape
    const damageExpression = new RegExp(/(?<prefix>(?:takes|taking|saving throw (?:\([\w ]*\) )?or take\s+)|(?:[\w]*\s+))(?:(?<flat>[0-9]+))?(?:\s*\(?(?<damageDice>[0-9]+d[0-9]+(?:\s*[-+]\s*(?:[0-9]+))*(?:\s+plus [^\)]+)?)\)?)\s*(?<type>[\w ]*?)\s*damage(?<start>\sat the start of|\son a failed save)?/gi);
    const matches = [...description.matchAll(damageExpression)];

    logger.debug(`${this.name} Description Damage matches`, { description, matches });
    const otherParts = [];
    for (const dmg of matches) {
      let other = false;
      if (dmg.groups.prefix == "DC " || dmg.groups.type == "hit points by this") {
        continue; // eslint-disable-line no-continue
      }
      // check for other
      if (dmg.groups.start && dmg.groups.start.trim() == "at the start of") other = true;
      const damage = dmg.groups.damageDice ?? dmg.groups.flat;

      // Make sure we did match a damage
      if (damage) {
        const includesDiceRegExp = /[0-9]*d[0-9]+/;
        const includesDice = includesDiceRegExp.test(damage);
        const finalDamage = (this.actionInfo && includesDice)
          ? utils.parseDiceString(damage.replace("plus", "+"), null).diceString
          : damage.replace("plus", "+");

        const part = DDBBasicActivity.buildDamagePart({ damageString: finalDamage, type: dmg.groups.type, stripMod: false });

        // if this is a save based attack, and multiple damage entries, we assume any entry beyond the first is going into a second damage calculation
        // ignore if dmg[1] is and as it likely indicates the whole thing is a save
        if ((((dmg.groups.start ?? "").trim() == "on a failed save" && (dmg.groups.prefix ?? "").trim() !== "and")
            || (dmg.groups.prefix && dmg.groups.prefix.includes("saving throw")))
          && this.damageParts.length >= 1
        ) {
          other = true;
        }
        // assumption here is that there is just one field added to versatile. this is going to be rare.
        if (other) {
          otherParts.push(part);
        } else {
          this.damageParts.push(part);
        }
      }
    }

    const regainExpression = new RegExp(/(regains|regain)\s+?(?:([0-9]+))?(?: *\(?([0-9 ]+d[0-9]+(?:\s*[-+]\s*[0-9]+)??)\)?)?\s+hit\s+points/i);
    const regainMatch = description.match(regainExpression);
    logger.debug(`${this.name} Description Healing matches`, { description, regainMatch });

    if (regainMatch) {
      const damageValue = regainMatch[3] ? regainMatch[3] : regainMatch[2];
      const part = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(damageValue, null).diceString,
        type: 'healing',
      });
      this.healingParts.push(part);
    }

    if (otherParts.length > 0 && !this.enricher.activity?.other?.prevent) {
      this.additionalActivities.push({
        name: this.enricher.activity?.other?.name ?? `Damage`,
        type: "damage",
        options: {
          generateDamage: true,
          damageParts: otherParts,
          includeBaseDamage: false,
          activationOverride: {
            type: this.enricher.activity?.other?.activationType ?? "special",
            value: this.enricher.activity?.other?.activationValue ?? null,
            condition: "",
          },
          durationOverride: {
            value: null,
            units: "inst",
            special: "",
          },
        },
      });
    }

    this.#escapeCheckGeneration();

  }

  #generateTargets() {
    this.actionInfo.target = {
      prompt: true,
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
    };

    const targetsCreature = this.targetsCreature();
    const creatureTargetCount = (/(each|one|a|the) creature(?: or object)?/ig).exec(this.ddbDefinition.description);

    if (targetsCreature || creatureTargetCount) {
      this.actionInfo.target.affects.count = creatureTargetCount && ["one", "a", "the"].includes(creatureTargetCount[1]) ? "1" : "";
      this.actionInfo.target.affects.type = creatureTargetCount && creatureTargetCount[2] ? "creatureOrObject" : "creature";
    }
    const aoeSizeRegex = /(?:within|in a|fills a) (\d+)(?: |-)(?:feet|foot|ft|ft\.)(?: |-)(cone|radius|emanation|sphere|line|cube|of it|of an|of the|of you|of yourself)(\w+[. ])?/ig;
    const aoeSizeMatch = aoeSizeRegex.exec(this.ddbDefinition.description);

    // console.warn(`Target generation for ${this.name}`, {
    //   targetsCreature,
    //   creatureTargetCount,
    //   aoeSizeMatch,
    // });

    if (aoeSizeMatch) {
      const type = aoeSizeMatch[3]?.trim() ?? aoeSizeMatch[2]?.trim() ?? "radius";
      this.actionInfo.target.template.type = ["cone", "radius", "sphere", "line", "cube"].includes(type) ? type : "radius";
      this.actionInfo.target.template.size = aoeSizeMatch[1] ?? "";
      if (aoeSizeMatch[2] && aoeSizeMatch[2].trim() === "of you") {
        this.actionInfo.range.units = "self";
      }
    }
  }

  async #generateDescription() {
    if (this.parsingType === "custom") {
      let description = this.ddbDefinition.description && this.ddbDefinition.description !== "null"
        ? this.ddbDefinition.description
        : "";
      description = this.ddbDefinition.notes
        ? description + `<p><blockquote>${this.ddbDefinition.notes}</blockquote></p>`
        : description;

      const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
      this.data.system.description = {
        value: description,
        chat: chatAdd ? this.ddbDefinition.snippet ?? "" : "",
      };
    } else {
      this.ddbDefinition.description = await generateTable(this.name, this.ddbDefinition.description, this.updateExisting);
      this.data.system.description = this.#getDescription();
    }
  }

  #generatePrice() {
    const value = this.ddbDefinition.cost ? Number.parseFloat(this.ddbDefinition.cost) : 0;
    this.data.system.price = {
      "value": Number.isInteger(value) ? value : (value * 10),
      "denomination": Number.isInteger(value) ? "gp" : "sp",
    };
  }

  #generateCapacity() {
    this.data.system.capacity = (this.ddbDefinition.capacityWeight !== null)
      ? {
        "type": "weight",
        "value": this.ddbDefinition.capacityWeight,
      }
      : {};
  }

  #generateCurrency() {
    if (!this.ddbItem.currency) return;
    this.data.system.currency = {
      cp: this.ddbItem.currency?.cp ?? 0,
      sp: this.ddbItem.currency?.sp ?? 0,
      ep: this.ddbItem.currency?.ep ?? 0,
      gp: this.ddbItem.currency?.gp ?? 0,
      pp: this.ddbItem.currency?.pp ?? 0,
    };
  }

  #generateWeightless() {
    const isWeightless = this.ddbDefinition.weightMultiplier === 0;
    if (isWeightless) {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "weightlessContents");
    }
  }

  #generateStaffProperties() {
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    if (!weaponBehavior.properties || !Array.isArray(weaponBehavior.properties)) return;

    DICTIONARY.weapon.properties.filter((p) =>
      weaponBehavior.properties.find((prop) => prop.name === p.name) !== undefined,
    ).map((p) => p.value).forEach((prop) => {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, prop);
    });
  }

  #generateWeaponProperties() {
    this.data.system.properties = DICTIONARY.weapon.properties
      .filter((property) => {
        // if it is a weapon property
        if (this.ddbDefinition.properties
          && Array.isArray(this.ddbDefinition.properties)
          && this.ddbDefinition.properties.some((prop) => prop.name === property.name)
        ) {
          return true;
        }
        // if it is a granted property
        if (this.ddbDefinition.grantedModifiers
          && Array.isArray(this.ddbDefinition.grantedModifiers)
          && this.ddbDefinition.grantedModifiers.some((prop) =>
            prop.type === "weapon-property"
            && prop.friendlySubtypeName === property.name,
          )
        ) {
          return true;
        }
        // else not a property
        return false;
      })
      .map((property) => property.value);
  }

  #getWeaponProficient() {
    // if it's a simple weapon and the character is proficient in simple weapons:
    if (
      this.characterProficiencies.some((proficiency) => proficiency.name === "Simple Weapons")
      && this.data.system.type.value.includes("simple")
    ) {
      return true;
    } else if (
      this.characterProficiencies.some((proficiency) => proficiency.name === "Martial Weapons")
      && this.data.system.type.value.includes("martial")
    ) {
      return true;
    } else {
      const proficient = this.characterProficiencies.some((proficiency) =>
        proficiency.name.toLowerCase() === this.ddbDefinition.type.toLowerCase(),
      );
      if (proficient) return proficient;
    }
    return null;
  };

  #getAbility() {
    // finesse weapons can choose freely, and is now automated
    if (this.data.system.properties.fin) {
      return null;
    }

    // thrown, but not finesse weapon: STR
    if (this.data.system.properties.thr) {
      return "str";
    }

    // if it's a ranged weapon, and hot a reach weapon (long = 10 (?))
    if (this.data.system.range?.long > 5 && !this.data.system.properties.rch) {
      return "dex";
    }

    // the default is null (auto based on base)
    return null;
  }

  #getWeaponAbility() {
    let result = "";
    const ability = this.#getAbility();
    const mockAbility = ability === null
      ? this.data.system.properties.includes("fin") ? "dex" : "str"
      : ability;

    // warlocks can use cha for their Hex weapon
    if (this.flags.classFeatures.includes("hexWarrior")) {
      if (this.characterEffectAbilities.cha.value >= this.characterEffectAbilities[mockAbility].value) {
        result = "cha";
      }
    }
    // kensai monks
    if (this.flags.classFeatures.includes("kensaiWeapon") || this.flags.classFeatures.includes("monkWeapon")) {
      if (this.characterEffectAbilities.dex.value >= this.characterEffectAbilities[mockAbility].value) {
        result = "dex";
      }
    }
    if (this.flags.magicItemAttackInt && (this.ddbDefinition.magic || this.data.system.properties.includes("mgc"))) {
      if (this.characterEffectAbilities.int.value > this.characterEffectAbilities[mockAbility].value) {
        result = "int";
      }
    }
    const setAbility = result && result !== ""
      ? result
      : mockAbility;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.ability", setAbility);

    return result;
  }

  #isHalfToolProficiencyRoundedUp(ab) {
    const longAbility = DICTIONARY.character.abilities
      .filter((ability) => ab === ability.value)
      .map((ability) => ability.long)[0];
    const roundUp = DDBHelper.filterBaseModifiers(this.ddbData, "half-proficiency-round-up", { subType: `${longAbility}-ability-checks` });
    return Array.isArray(roundUp) && roundUp.length;
  }

  #getToolProficiency(toolName, ability) {
    const mods = DDBHelper.getAllModifiers(this.ddbData, { includeExcludedEffects: true });
    const modifiers = mods
      .filter((modifier) => modifier.friendlySubtypeName === toolName)
      .map((mod) => mod.type);

    const toolExpertise = this.ddbData.character?.classes
      ? this.ddbData.character.classes.some((cls) =>
        cls.classFeatures.some((feature) => feature.definition.name === "Tool Expertise" && cls.level >= feature.definition.requiredLevel),
      )
        ? 2
        : 1
      : 1;

    const halfProficiency
      = DDBHelper.getChosenClassModifiers(this.ddbData).find(
        (modifier) =>
          // Jack of All trades/half-rounded down
          (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
          // e.g. champion for specific ability checks
          || this.#isHalfToolProficiencyRoundedUp(ability),
      ) !== undefined
        ? 0.5
        : 0;

    const proficient = modifiers.includes("expertise")
      ? 2
      : modifiers.includes("proficiency")
        ? toolExpertise
        : halfProficiency;

    return proficient;
  }

  #generateAmmunitionSpecifics() {
    this.activityOptions.generateRange = true;

    if (this.damageParts.length > 0) {
      this.data.system.damage = {
        replace: false,
        base: this.damageParts[0],
      };
    }

    const ammoType = DICTIONARY.character.proficiencies
      .find((prof) =>
        prof.type === "Ammunition"
        && (
          prof.name.toLowerCase() === this.ddbDefinition.name.toLowerCase().split(",")[0].trim()
          || prof.name.toLowerCase() === this.ddbDefinition.name.toLowerCase().split(" ")[0].trim()
        ),
      )?.ammunitionType;

    if (ammoType) {
      foundry.utils.setProperty(this.data, "system.type.subtype", ammoType);
      this.systemType.subtype = ammoType;
    }
  }

  #generateArmorSpecifics() {
    this.data.system.armor.value = this.ddbDefinition.armorClass;
    this.data.system.strength = this.ddbDefinition.strengthRequirement ?? 0;
    if (this.ddbDefinition.stealthCheck === 2)
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "stealthDisadvantage");
    this.#generateArmorMaxDex();
    this.#generateProficient();
    this._generateUses();
    if (!this.data.name.toLowerCase().includes("armor")) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.alternativeNames", [`${this.name} Armor`]);
    }
  }

  #generateConsumableSpecifics() {
    if (this.data.system.type.value === "wand") this.addMagical = true;
    this._generateConsumableUses();
    if (["Potion", "Poison"].includes((this.overrides.ddbType ?? this.ddbDefinition.subType))) {
      this.actionInfo.target = {
        "template": {
          "contiguous": false,
          "units": "ft",
          "type": "",
        },
        "affects": {
          "choice": false,
          "count": "1",
          "type": "creature",
          "special": "",
        },
      };
      this.actionInfo.range = {
        "units": "touch",
        "override": false,
        "special": "",
      };
    } else {
      this.#generateTargets();
    }
    this.#generateDamageFromDescription();
  }

  #generateLootSpecifics() {
    if (this.systemType.value) {
      this._generateConsumableUses();
      this.#generateTargets();
      this.#generateDamageFromDescription();
    }
    if (this.documentType === "container") {
      this.#generateCapacity();
      this.#generateCurrency();
      this.#generateWeightless();
    }
  }

  #generateScrollSpecifics() {
    // KNOWN_ISSUE_4_0: what kind of activity type are scrolls?
    this._generateConsumableUses();
  }

  #generateStaffSpecifics() {
    this.activityOptions.generateAttack = true;
    this.#generateStaffProperties();
    this.data.system.proficient = this.#getWeaponProficient();
    this.data.system.range = this.#getWeaponBehaviourRange();
    this.actionInfo.ability = this.#getAbility();
    this.actionInfo.meleeAttack = this.data.system.range.long === 5;
    if (!game.modules.get("magicitems")?.active && !game.modules.get("items-with-spells-5e")?.active) {
      this._generateUses();
    }
    if (this.damageParts.length > 0) {
      this.data.system.damage = {
        base: this.damageParts[0],
        versatile: this.versatileDamage,
        parts: this.actionInfo.save
          ? []
          : this.damageParts.slice(1),
      };
    }
  }

  #generateToolSpecifics() {
    this.activityOptions.generateCheck = true;
    const defaultAbility = DICTIONARY.character.proficiencies.find((prof) => prof.name === this.ddbDefinition.name);
    this.actionInfo.ability = defaultAbility?.ability ?? "dex";
    this.data.system.proficient = this.ddbData ? this.#getToolProficiency(this.ddbDefinition.name, this.actionInfo.ability) : 0;
    this._generateUses();
  }

  #generateWeaponSpecifics() {
    this.activityOptions.generateAttack = true;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.damage", this.flags.damage);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.classFeatures", this.flags.classFeatures);
    this.#generateWeaponProperties();
    const proficientFeatures = ["pactWeapon", "kensaiWeapon"];
    this.data.system.proficient = this.flags.classFeatures.some((feat) => proficientFeatures.includes(feat))
      ? true
      : this.#getWeaponProficient();

    if (this.flags.classFeatures.includes("OffHand")) this.actionInfo.activation.type = "bonus";
    this.data.system.range = this.#getWeaponRange();
    this._generateUses(false);
    this.data.system.uses.prompt = false;
    this.actionInfo.ability = this.#getWeaponAbility();
    if (this.ddbDefinition.attackType === 1) {
      this.actionInfo.meleeAttack = true;
    } else {
      this.actionInfo.meleeAttack = false;
    }
    if (this.damageParts.length > 0) {
      this.data.system.damage = {
        base: this.damageParts[0],
        versatile: this.versatileDamage,
        parts: this.actionInfo.save
          ? []
          : this.damageParts.slice(1),
      };
    }

    const dictionaryWeapon = DICTIONARY.character.proficiencies
      .find((prof) =>
        prof.type === "Weapon" && prof.name.toLowerCase() === this.ddbDefinition.type.toLowerCase(),
      );

    if (dictionaryWeapon?.ammunitionType) {
      foundry.utils.setProperty(this.data, "system.ammunition.type", dictionaryWeapon.ammunitionType);
    }
    if (dictionaryWeapon?.mastery) {
      foundry.utils.setProperty(this.data, "system.mastery", dictionaryWeapon.mastery);
    }

  }

  #generateWonderousSpecifics() {
    if (this.isContainer) {
      this.#generateCurrency();
      this.#generateWeightless();
    }
    if (!this.isContainer && !this.tattooType) {
      this.data.system.armor = {
        value: null,
        dex: null,
      };
      this.data.system.type.value = this.overrides.armorType
        ?? (this.isClothingTag ? "clothing" : "trinket");
      this.data.system.strength = 0;
      this.data.system.properties = utils.removeFromProperties(this.data.system.properties, "stealthDisadvantage");
      this.data.system.proficient = null;
    }
    this._generateUses(true);
    if (!this.isTattoo) {
      this.#generateCapacity();
    }
    this.#generateTargets();
    this.#generateDamageFromDescription();
  }

  #generateAttunement() {
    if (this.ddbItem.isAttuned || this.ddbDefinition.canAttune) {
      if (this.ddbDefinition.name.startsWith("Spell Gem")) {
        this.data.system.attunement = "optional";
      } else {
        this.data.system.attunement = "required";
      }
    }
  }

  #generateTypeSpecifics() {
    switch (this.parsingType) {
      case "ammunition": {
        this.#generateAmmunitionSpecifics();
        break;
      }
      case "armor": {
        this.#generateArmorSpecifics();
        break;
      }
      case "consumable": {
        this.#generateConsumableSpecifics();
        break;
      }
      case "loot": {
        this.#generateLootSpecifics();
        break;
      }
      case "scroll": {
        this.#generateScrollSpecifics();
        break;
      }
      case "staff": {
        this.#generateStaffSpecifics();
        break;
      }
      case "tool": {
        this.#generateToolSpecifics();
        break;
      }
      case "weapon": {
        this.#generateWeaponSpecifics();
        break;
      }
      case "wonderous": {
        this.#generateWonderousSpecifics();
        break;
      }
      case "custom":
      default: {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.id", this.ddbItem.id);
        foundry.utils.setProperty(this.data, "flags.ddbimporter.custom", true);
        this.data.system.source = "Custom item";
        // no matching case, try custom item parse
      }
    }
  }

  parsePerSpellMagicItem(useDescription) {
    if (useDescription === "") {
      // some times 1 use per day items, like circlet of blasting have nothing in
      // the limited use description, fall back to this
      // can’t be used to cast that spell again until the next
      // can't be used this way again until the next dawn.
      let limitedUseRegex = /can't be used this way again until the next|can't be used to cast that spell again until the next/i;
      if (limitedUseRegex.test(this.ddbDefinition.description.replace("’", "'").toLowerCase())) {
        return true;
      }
      return false;
    }

    let perSpell = /each ([A-z]*|\n*) per/i;
    let match = perSpell.exec(useDescription);
    if (match) {
      match = DICTIONARY.magicitems.nums.find((num) => num.id == match[1]).value;
    } else {
      match = false;
    }
    return match;
  }

  // if this.spellsAsActivities
  // eslint-disable-next-line complexity
  async #addSpellAsActivity(spell) {
    logger.debug(`Adding spell ${spell.name} to item as activity ${this.data.name}`);
    const spellData = MagicItemMaker.buildMagicItemSpell(this.magicChargeType, spell);

    const resetType = this.ddbItem.limitedUse?.resetType
      ? DICTIONARY.resets.find((reset) =>
        reset.id == this.ddbItem.limitedUse.resetType,
      )?.value ?? undefined
      : undefined;

    const activityUses = {
      spent: 0,
      recovery: [
        {
          period: resetType,
          type: "recoverAll",
        },
      ],
      max: spellData.charges,
    };

    const activityConsumptionTarget = this.isPerSpell
      ? {
        type: "activityUses",
        value: spellData.limitedUse.minNumberConsumed ?? spellData.limitedUse.maxNumberConsumed,
        scaling: {},
      }
      : spellData.limitedUse
        ? {
          type: "itemUses",
          target: "",
          value: spellData.limitedUse.minNumberConsumed ?? this.actionInfo.consumptionValue ?? 1,
          scaling: {
            mode: "",
            formula: "",
          },
        }
        : null;

    const saveDC = foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.overrideDC")
      ? { calculation: "", formula: spell.flags.ddbimporter.dndbeyond?.dc }
      : { calculation: "spellcasting", formula: "" };

    const scalingAllowed = !this.isPerSpell && this.ddbDefinition.description.match("each (?:additional )?charge you expend");
    const scalingValue = this.data.system.uses.max ?? "";
    let i = 0;
    for (const id of Object.keys(spell.system.activities)) {
      const activity = foundry.utils.deepClone(spell.system.activities[id]);

      const currentConsumptionValue = activity.consumption?.value;

      if (currentConsumptionValue && activityConsumptionTarget.type === "itemUses") {
        activityConsumptionTarget.value = currentConsumptionValue;
      }

      // console.warn(`Copying Spell ${spell.name} Activity`, {
      //   spell,
      //   this: this,
      //   id,
      //   activity,
      // });

      const spellLookupName = foundry.utils.getProperty(spell, "flags.ddbimporter.originalName");
      const currentName = activity.name ? `${activity.name}`.trim() : "";
      const adjustedName = currentName === ""
        ? utils.capitalize(activity.type)
        : currentName;
      activity.name = `${spellLookupName ?? spell.name} (${adjustedName})`;
      const newId = utils.namedIDStub(spell.name, {
        postfix: i,
        prefix: activity.type,
      });

      if (!activity.activation?.override) activity.activation = spell.system.activation;
      if (!activity.duration?.override) activity.duration = spell.system.duration;
      if (!activity.range?.override) activity.range = spell.system.range;
      if (!activity.target?.override) activity.target = spell.system.target;

      activity._id = newId;

      activity.consumption.targets = [activityConsumptionTarget];
      spell.system.activities[id].consumption.scaling.allowed = Boolean(scalingAllowed);
      spell.system.activities[id].consumption.scaling.max = scalingAllowed
        ? scalingValue
        : "";
      activity.consumption.spellSlot = false;

      if (this.isPerSpell && ["", "charges"].includes(resetType)) {
        activity.uses = activityUses;
      }

      if (this.actionInfo.save?.dc && activity.save?.dc) {
        activity.save.dc = saveDC;
      }

      foundry.utils.setProperty(activity, "flags.ddbimporter.spellHintName", spellLookupName);

      activity.description.chatFlavor = spell.system.description.value;

      if (!activity.img || activity.img === "") {
        const img = await Iconizer.iconPath({ name: (spellLookupName ?? spell.name), type: "spell" });
        activity.img = img;
      }

      this.data.system.activities[newId] = activity;
      i++;
    }

    foundry.utils.setProperty(this.data, "flags.ddbimporter.isItemCharge", !this.isPerSpell);
  }

  #spellsAsSpells(spell) {
    logger.debug(`Adding spell ${spell.name} to item as spell link ${this.data.name}`);
    const spellData = MagicItemMaker.buildMagicItemSpell(this.magicChargeType, spell);

    const resetType = this.ddbItem.limitedUse?.resetType
      ? DICTIONARY.resets.find((reset) =>
        reset.id == this.ddbItem.limitedUse.resetType,
      )?.value ?? undefined
      : undefined;

    const uses = {
      spent: 0,
      recovery: [
      ],
      max: null,
    };

    if (this.isPerSpell) {
      // spells manage charges
      uses.max = spellData.limitedUse.maxNumberConsumed ?? 1;
      uses.recovery.push({
        period: resetType,
        type: "recoverAll",
      });

      foundry.utils.setProperty(spell, "system.uses", uses);
    } else {
      foundry.utils.setProperty(spell, "system.uses.recovery", []);
      foundry.utils.setProperty(spell, "system.uses.max", null);
      foundry.utils.setProperty(spell, "system.uses.spent", null);
    }

    const activityConsumptionTarget = this.isPerSpell
      ? {
        type: "itemUses",
        value: spellData.limitedUse.minNumberConsumed ?? spellData.limitedUse.maxNumberConsumed,
        scaling: {},
      }
      : spellData.limitedUse
        ? {
          type: "itemUses",
          target: `${this.data._id}`,
          value: spellData.limitedUse.minNumberConsumed ?? this.actionInfo.consumptionValue ?? 1,
          scaling: {
            mode: "",
            formula: "",
          },
        }
        : null;

    const saveDC = foundry.utils.getProperty(spell, "flags.ddbimporter.dndbeyond.overrideDC")
      ? { calculation: "", formula: spell.flags.ddbimporter.dndbeyond?.dc }
      : { calculation: "spellcasting", formula: "" };

    // console.warn(`Spell update details for ${spell.name}`, {
    //   resetType,
    //   uses,
    //   activityConsumptionTarget,
    //   saveDC,
    //   spellData,
    // });

    foundry.utils.setProperty(spell, "system.level", Number.parseInt(spellData.level));

    const scalingAllowed = !this.isPerSpell && this.ddbDefinition.description.match("each (?:additional )?charge you expend");
    const scalingValue = this.data.system.uses.max ?? "";
    Object.keys(spell.system.activities).forEach((id) => {
      if (activityConsumptionTarget)
        spell.system.activities[id].consumption.targets = [activityConsumptionTarget];

      spell.system.activities[id].consumption.scaling.allowed = Boolean(scalingAllowed);
      spell.system.activities[id].consumption.scaling.max = scalingAllowed
        ? scalingValue
        : "";
      spell.system.activities[id].consumption.spellSlot = false;
      if (this.actionInfo.save?.dc && spell.system.activities[id].save?.dc) {
        spell.system.activities[id].save.dc = saveDC;
      }
      spell.system.activities[id].description.chatFlavor = `Cast from ${this.data.name}`;
    });

    // console.warn(`Adjusted Spell ${spell.name} as item consumption`, {
    //   spell: foundry.utils.deepClone(spell),
    //   this: this,
    //   id: `${this.data._id}`,
    // });

  }

  async #basicMagicItem() {
    // if using magic items modules, these changes are not needed and a seperate
    // function processes the required data later.
    if (game.modules.get("magicitems")?.active
     || game.modules.get("items-with-spells-5e")?.active) return;
    if (!this.ddbDefinition.magic) return;


    if (this.isPerSpell) {
      this.data.system.uses = {
        spent: 0,
        recovery: [
        ],
        max: null,
      };
    }

    if (!this.raw.itemSpells) return;
    for (const spell of this.raw.itemSpells) {
      const isItemSpell = spell.flags.ddbimporter.dndbeyond.lookup === "item"
        && spell.flags.ddbimporter.dndbeyond.lookupId === this.ddbDefinition.id;
      if (isItemSpell) {
        // console.warn(`Adding Spell ${spell.name} for ${this.data.name}`, {
        //   spell,
        //   this: this,
        // });

        logger.debug(`Adding spell ${spell.name} to item ${this.data.name}`);
        if (this.spellsAsActivities) await this.#addSpellAsActivity(spell);
        else this.#spellsAsSpells(spell);
      }
    }

    // const spent = foundry.utils.getProperty(this.data, "system.uses.spent");
    // const activation = this.actionInfo.activation?.type ?? "";

    // if (activation === "" && spent === 0) {
    //   this.data.system.activation.type = "special";
    // }
  }

  // eslint-disable-next-line complexity
  async build() {
    try {
      await this.#prepare();

      this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);
      this.data.system.source.rules = this.is2014 ? "2014" : "2024";
      this.data.system.weight = this.#getSingleItemWeight();

      if (this.ddbDefinition.magic) this.addMagical = true;

      this.#generateTypeSpecifics();

      this.#generateEquipped();
      this.#generateItemRarity();
      this.#generateQuantity();
      this.#generatePrice();
      this.#generateMagicalBonus();

      if (this.overrides.ddbType)
        foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.type", this.overrides.ddbType);

      if (this.addMagical)
        this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");

      this.characterManager.updateItemId(this.data);

      const statusEffect = getStatusEffect({ ddbDefinition: this.ddbDefinition, foundryItem: this.data });
      if (statusEffect) this.data.effects.push(statusEffect);

      if (!this.enricher.documentStub?.stopDefaultActivity)
        this.#generateActivity({}, this.activityOptions);
      this.#addHealAdditionalActivities();
      this.#generateAdditionalActivities();
      this.enricher.addAdditionalActivities(this);

      this.data.system.attuned = this.ddbItem.isAttuned;
      this.#generateAttunement();

      // should be one of the last things to do
      await this.#generateDescription();
      DDBHelper.addCustomValues(this.ddbData, this.data);
      await this.#basicMagicItem();

      this.enricher.addDocumentOverride();

      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);

    } catch (err) {
      logger.warn(
        `Unable to parse item: ${this.ddbDefinition.name}, ${this.ddbDefinition.type}/${this.ddbDefinition.filterType}. ${err.message}`,
        {
          this: this,
        },
      );
      logger.error(err.stack);
    }

  }

  #addExtraDDBFlags() {
    this.data.flags.ddbimporter['id'] = this.ddbItem.id;
    this.data.flags.ddbimporter['entityTypeId'] = this.ddbItem.entityTypeId;

    if (this.ddbDefinition.avatarUrl)
      this.data.flags.ddbimporter.dndbeyond['avatarUrl'] = this.ddbDefinition.avatarUrl.split('?')[0];
    if (this.ddbDefinition.largeAvatarUrl)
      this.data.flags.ddbimporter.dndbeyond['largeAvatarUrl'] = this.ddbDefinition.largeAvatarUrl.split('?')[0];
    if (this.ddbDefinition.filterType) {
      const filter = DICTIONARY.items.find((i) => i.filterType === this.ddbDefinition.filterType);
      if (filter) this.data.flags.ddbimporter.dndbeyond['filterType'] = filter.filterType;
    }

    // container info
    if (this.ddbItem.containerEntityId)
      foundry.utils.setProperty(this.data, "flags.ddbimporter.containerEntityId", this.ddbItem.containerEntityId);
    if (this.ddbItem.containerEntityTypeId)
      foundry.utils.setProperty(this.data, "flags.ddbimporter.containerEntityTypeId", this.ddbItem.containerEntityTypeId);

    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isConsumable", this.ddbDefinition.isConsumable);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isContainer", this.ddbDefinition.isContainer);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isCustomItem", this.ddbDefinition.isCustomItem);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.homebrew", this.ddbDefinition.isHomebrew);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isMonkWeapon", this.ddbDefinition.isMonkWeapon);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.isPack", this.ddbDefinition.isPack);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.levelInfusionGranted", this.ddbDefinition.levelInfusionGranted);

    return this.data;
  }

  #enrichFlags() {
    if (this.ddbDefinition?.entityTypeId)
      this.data.flags.ddbimporter['definitionEntityTypeId'] = this.ddbDefinition.entityTypeId;
    if (this.ddbDefinition?.id)
      this.data.flags.ddbimporter['definitionId'] = this.ddbDefinition.id;
    if (this.ddbItem.entityTypeId)
      this.data.flags.ddbimporter['entityTypeId'] = this.ddbItem.entityTypeId;
    if (this.ddbItem.id)
      this.data.flags.ddbimporter['id'] = this.ddbItem.id;
    if (this.ddbDefinition?.tags)
      this.data.flags.ddbimporter.dndbeyond['tags'] = this.ddbDefinition.tags;
    if (this.ddbDefinition?.sources)
      this.data.flags.ddbimporter.dndbeyond['sources'] = this.ddbDefinition.sources;
    if (this.ddbDefinition?.stackable)
      this.data.flags.ddbimporter.dndbeyond['stackable'] = this.ddbDefinition.stackable;
  }


  _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const saveActivity = new DDBItemActivity({
      name,
      type: "save",
      ddbParent: this,
      nameIdPrefix: "save",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    saveActivity.build(foundry.utils.mergeObject({
      generateSave: true,
      generateRange: !["weapon", "staff"].includes(this.parsingType),
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType),
      damageParts: ["weapon", "staff"].includes(this.parsingType)
        ? this.damageParts.slice(1)
        : null,
      generateDamage: true,
    }, options));

    return saveActivity;
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const attackActivity = new DDBItemActivity({
      name,
      type: "attack",
      ddbParent: this,
      nameIdPrefix: "attack",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    attackActivity.build(foundry.utils.mergeObject({
      generateAttack: true,
      generateRange: !["weapon", "staff"].includes(this.parsingType),
      // don't add extra damages if it's a save (assume its save damage)
      generateDamage: !this.actionInfo.save,
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType),
    }, options));
    return attackActivity;
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const utilityActivity = new DDBItemActivity({
      name,
      type: "utility",
      ddbParent: this,
      nameIdPrefix: "utility",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    utilityActivity.build(foundry.utils.mergeObject({
      generateRange: !["weapon", "staff"].includes(this.parsingType),
      generateDamage: true,
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType),
    }, options));

    return utilityActivity;
  }

  _getHealActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const healActivity = new DDBItemActivity({
      name,
      type: "heal",
      ddbParent: this,
      nameIdPrefix: "heal",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    healActivity.build(foundry.utils.mergeObject({
      generateDamage: false,
      generateHealing: true,
      generateRange: true,
    }, options));

    return healActivity;
  }

  _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const damageActivity = new DDBItemActivity({
      name,
      type: "damage",
      ddbParent: this,
      nameIdPrefix: "damage",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    damageActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: !["weapon", "staff"].includes(this.parsingType),
      generateDamage: true,
      includeBaseDamage: ["weapon", "staff"].includes(this.parsingType),
    }, options));
    return damageActivity;
  }

  _getEnchantActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const enchantActivity = new DDBItemActivity({
      name,
      type: "enchant",
      ddbParent: this,
      nameIdPrefix: "enchant",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    enchantActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    }, options));
    return enchantActivity;
  }

  _getSummonActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const summonActivity = new DDBItemActivity({
      name,
      type: "summon",
      ddbParent: this,
      nameIdPrefix: "summon",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    summonActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: true,
      generateDamage: false,
    }, options));
    return summonActivity;
  }

  _getCheckActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const checkActivity = new DDBItemActivity({
      name,
      type: "check",
      ddbParent: this,
      nameIdPrefix: "check",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    checkActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: true,
      generateActivation: true,
    }, options));
    return checkActivity;
  }

  #addSaveAdditionalActivity(includeBase = false) {
    this.additionalActivities.push({
      type: "save",
      options: {
        generateDamage: this.damageParts.length > 1,
        damageParts: ["weapon", "staff"].includes(this.parsingType) || includeBase
          ? this.damageParts
          : this.damageParts.slice(1),
        includeBaseDamage: false,
      },
    });
  }

  #addHealAdditionalActivities() {
    this.healingParts.forEach((part, i) => {
      if (i !== 0) {
        this.additionalActivities.push({
          type: "heal",
          options: {
            generateDamage: false,
            includeBaseDamage: false,
            generateHealing: true,
            healingPart: part,
          },
        });
      }
    });
  }

  // eslint-disable-next-line complexity
  _getActivitiesType() {
    if (this.parsingType === "tool") {
      return "check";
    }
    // lets see if we have a save stat for things like Dragon born Breath Weapon
    if (this.healingParts.length > 0) {
      if (!this.actionInfo.save && !["weapon", "staff"].includes(this.parsingType) && this.damageParts.length === 0) {
        // we damage healing parts elsewhere
        return null;
      }
    }
    if (["weapon", "staff"].includes(this.parsingType)) {
      // some attacks will have a save and attack
      if (this.actionInfo.save) {
        if (this.damageParts.length > 1) {
          this.#addSaveAdditionalActivity(false);
        }
      }
      return "attack";
    }
    if (this.actionInfo.save) return "save";
    if (this.damageParts.length > 0) return "damage";
    if (this.actionInfo.activation?.type === "special" && (!this.data.uses.max || this.data.uses.max === "")) {
      return undefined;
    }
    if (this.actionInfo.activation?.type
      && !this.healingAction
      && !["wand", "scroll"].includes(this.systemType.value)
    ) return "utility";
    if (this.parsingType === "consumable" && !["wand", "scroll"].includes(this.systemType.value)) return "utility";
    if (this.data.effects.length > 0) return "utility";
    if (["cone", "radius", "sphere", "line", "cube"].includes(this.actionInfo.target?.template?.type)) return "utility";
    return null;
  }

  getActivity({ typeOverride = null, typeFallback = null, name = null, nameIdPostfix = null } = {}, options = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    this.activityTypes.push(type);
    const data = { name, nameIdPostfix };
    switch (type) {
      case "save":
        return this._getSaveActivity(data, options);
      case "attack":
        return this._getAttackActivity(data, options);
      case "damage":
        return this._getDamageActivity(data, options);
      case "heal":
        return this._getHealActivity(data, options);
      case "utility":
        return this._getUtilityActivity(data, options);
      case "enchant":
        return this._getEnchantActivity(data, options);
      case "summon":
        return this._getSummonActivity(data, options);
      case "check":
        return this._getCheckActivity(data, options);
      case "spell":
      case "teleport":
      case "transform":
      case "forward":
      default:
        if (typeFallback) return this.getActivity({ typeOverride: typeFallback, name, nameIdPostfix }, options);
        return undefined;
    }
  }

  #generateActivity({ hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null } = {},
    optionsOverride = {},
  ) {
    if (hintsOnly && !this.enricher.activity) return undefined;

    const activity = this.getActivity({
      typeOverride: typeOverride ?? this.enricher.activity?.type,
      name,
      nameIdPostfix,
    }, optionsOverride);


    if (!activity) {
      logger.debug(`No Activity type found for ${this.data.name}`, {
        this: this,
      });
      return undefined;
    }

    if (!this.activityType) this.activityType = activity.data.type;

    this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  #generateAdditionalActivities() {
    if (this.additionalActivities.length === 0) return;
    // console.warn(`ADDITIONAL ITEM ACTIVITIES for ${this.data.name}`, this.additionalActivities);
    this.additionalActivities.forEach((activityData, i) => {
      const id = this.#generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
    });
  }

}
