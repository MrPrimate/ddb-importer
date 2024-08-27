import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper";
import { generateTable } from "../../lib/DDBTable.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBBasicActivity from "../enrichers/DDBBasicActivity.js";
import DDBItemEnricher from "../enrichers/DDBItemEnricher.js";

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

  constructor({ ddbData, ddbItem, rawCharacter = null, isCompendium = false } = {}) {

    this.ddbData = ddbData;
    this.ddbItem = ddbItem;
    this.ddbDefinition = ddbItem.definition;
    this.rawCharacter = rawCharacter;
    this.isCompendiumItem = isCompendium;
    foundry.utils.setProperty(this.ddbItem, "isCompendiumItem", isCompendium);


    this.originalName = ddbItem.definition.name;
    this.name = DDBHelper.getName(this.ddbData, ddbItem, this.rawCharacter);
    this.#generateItemFlags();

    this.documentType = null;
    this.parsingType = null;

    this.overrides = {
      ddbType: null,
      armorType: null,
      name: null,
      custom: false,
    };

    this.characterProficiencies = foundry.utils.getProperty(this.rawCharacter, "flags.ddbimporter.dndbeyond.proficienciesIncludingEffects")
      ?? [];
    this.characterEffectAbilities = foundry.utils.getProperty(this.rawCharacter, "flags.ddbimporter.dndbeyond.effectAbilities");

    this.isContainer = this.ddbDefinition.isContainer;
    this.isContainerTag = this.ddbDefinition.tags.includes('Container');
    this.isOuterwearTag = this.ddbDefinition.tags.includes('Outerwear')
      || this.ddbDefinition.tags.includes('Footwear');
    this.isClothingTag = this.isOuterwearTag || this.ddbDefinition.tags.includes('Clothing');
    this.isTashasInstalled = game.modules.get("dnd-tashas-cauldron")?.active;
    this.isTattoo = this.ddbDefinition.name.toLowerCase().includes("tattoo");
    this.tattooType = this.isTashasInstalled && this.isTattoo;

    this.itemTagTypes = this.ddbDefinition.tags && Array.isArray(this.ddbDefinition.tags)
      ? [this.ddbDefinition.type.toLowerCase(), ...this.ddbDefinition.tags.map((t) => t.toLowerCase())]
      : [this.ddbDefinition.type.toLowerCase()];

    this.systemType = {
      value: null,
      subType: null,
      baseItem: null,
    };

    this.addAutomationEffects = this.isCompendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-add-effects")
      : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

    this.updateExisting = this.isCompendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    this._init();

    this.data = {};

    this.#determineType();

    this.actionInfo = {
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
    };

    this.activityType = null;
    this.activities = [];
    this.activityTypes = [];


    this.activityOptions = {
      generateActivation: false,
      generateAttack: false,
      generateConsumption: false,
      generateCheck: false,
      generateDamage: false,
      generateDescription: false,
      generateDuration: false,
      generateEffects: false,
      generateHealing: false,
      generateRange: false,
      generateSave: false,
      generateTarget: false,
      includeBaseDamage: false,
    };

    this.damageParts = [];
    this.healingParts = [];
    this.additionalActivities = [];


    this.featureEnricher = new DDBItemEnricher({
      document: this.feature,
      monster: this.ddbMonster.npc,
      name: this.name,
    });

  }

  _init() {
    logger.debug(`Generating Item ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
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
        },
      },
    };
    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)

    this.data.system.type.value = this.systemType.value;
    this.data.system.identified = true;
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
      const durationMatch = this.ddbDefinition.description.match(durationExpression);

      if (durationMatch) {
        duration.units = durationArray.find((duration) => duration.descriptionMatches.includes(durationMatch[2])).foundryUnit;
        duration.value = durationMatch[1];
      }
    }
    return duration;
  }

  #checkForSavingThrowActivity() {
    const save = {
      ability: "",
      dc: {
        calculation: "custom",
        formula: "",
      },
    };


    const saveCheck = this.ddbDefinition.description.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
    if (saveCheck && saveCheck[2]) {
      save.ability = saveCheck[2].toLowerCase().substr(0, 3);
      save.dc.formula = saveCheck[1];
      this.actionInfo.save = save;
    }
  }

  #generateActivityActivation() {
    // default
    this.actionInfo.activation = { type: "action", value: 1, condition: "" };

    if (this.parsingType === "wonderous") {
      let action = "";
      const actionRegex = /(bonus) action|(reaction)|as (?:an|a) (action)/i;

      const match = this.ddbDefinition.description.match(actionRegex);
      if (match) {
        if (match[1]) action = "bonus";
        else if (match[2]) action = "reaction";
        else if (match[3]) action = "action";
      }

      this.actionInfo.activation = { type: "action", value: action ? 1 : null, condition: "" };
    }

  }

  _generateActionInfo() {
    this.actionInfo.duration = this.#getActivityDuration();
    this.actionInfo.range = this.#getActivityRange();
    this.actionInfo.activation = this.#generateActivityActivation();

  }

  #generateActivityType() {
    if (this.actionInfo.save) {
      this.activityType = "save";
    } else if (this.parsingType === "consumable") {
      if (this.ddbDefinition.tags.includes("Healing")) {
        this.activityType = "heal";
      } else if (this.ddbDefinition.tags.includes("Damage")) {
        this.activityType = "damage";
      }
    } else if (this.parsingType === "weapon") {
      this.activityType = "attack";
    }
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
                  formula: parseInt(saveMatch[1]),
                  calculation: "custom",
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
    const magicalDamageBonus = this.actionInfo.magicBonus.zero ?? 0;
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    let versatile = weaponBehavior.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(versatile.notes).diceString,
        stripMod: true,
        type: weaponBehavior.damageType.toLowerCase(),
      });
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: [damage],
          includeBaseDamage: false,
        },
      });
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
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.damageParts.push(damage);
    }

    // additional damage parts
    this.#generateGrantedModifiersDamageParts();

  }


  #generateWeaponDamageParts() {
    // const magicalDamageBonus = getWeaponMagicalBonus(data, flags, true);
    // we can safely make these assumptions about GWF
    // flags are only added for melee attacks
    const greatWeaponFighting = this.flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
    const twoHanded = this.ddbDefinition.properties.find((property) => property.name === "Two-Handed");

    const damageType = DDBHelper.getDamageType(this.ddbItem);

    const versatile = this.ddbDefinition.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(versatile.notes, null, "", greatWeaponFighting).diceString,
        stripMod: true,
        type: this.ddbDefinition.damageType.toLowerCase(),
      });
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: [damage],
          includeBaseDamage: false,
        },
      });
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

    // additional damage parts with no restrictions
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === ""))
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
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : `${mod.value}`;
        if (damagePart) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: damagePart,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });

          this.additionalActivities.push({
            name: `Restricted Attack: ${mod.restriction}`,
            options: {
              generateDamage: true,
              damageParts: [damage],
              includeBaseDamage: false,
              chatFlavor: mod.restriction ?? "",
            },
          });
          restrictions.push(mod.restriction);
        }
      });

    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.restrictions")
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
    const itemDexMaxAdjustment = DDBHelper.getModifierSum(maxDexMods, this.rawCharacter);
    if (maxDexModifier !== null && Number.isInteger(itemDexMaxAdjustment) && itemDexMaxAdjustment > maxDexModifier) {
      maxDexModifier = itemDexMaxAdjustment;
    }

    this.system.armor.dex = maxDexModifier;
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
        if ((!this.isContainer && this.isOuterwearTag && !this.isContainerTag)
          || DDBItem.CLOTHING_ITEMS.includes(this.ddbDefinition.name)
        ) {
          this.documentType = "equipment";
          this.systemType.value = "clothing";
          this.parsingType = "wonderous";
          this.overrides.ddbType = "Clothing";
          this.overrides.armorType = "Clothing"; // might not need this anymore
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

  #getLootType(typeHint) {
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
    } else if (itemType) {
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
      const lookup = DDBItem.LOOT_TYPES[itemType];
      if (lookup) this.systemType.value = lookup;
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
            this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
          }
        } else {
          this.documentType = "equipment";
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
      if (DDBHelper.getCustomValueFromCharacter(this.ddbItem, this.rawCharacter, 18)) {
        this.flags.classFeatures.push("OffHand");
      }
    }
    // ranged fighting style is added as a global modifier elsewhere
    // as is defensive style

    logger.debug(`Flags for ${this.ddbItem.name ?? this.ddbDefinition.name}`, { ddbItem: this.ddbItem, flags: this.flags });
  };


  async _prepare() {
    this._generateDataStub();
    this.#generateBaseItem();
    this._generateActionInfo();
    this._generateDamageParts();
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
    // range: { value: null, long: null, units: '' },
    return {
      value: this.ddbDefinition.range ? this.ddbDefinition.range : null,
      long: this.ddbDefinition.longRange ? this.ddbDefinition.longRange : null,
      units: (this.ddbDefinition.range || this.ddbDefinition.range) ? "ft" : "",
    };
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
      value: weaponBehavior.range ? weaponBehavior.range : 5,
      long: weaponBehavior.longRange ? weaponBehavior.longRange : 5,
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
    if (toolType) foundry.utils.setProperty(this.data, "system.type.value", toolType);

  }

  #generateProficient() {
    if (this.characterProficiencies.some((proficiency) =>
      proficiency.name === this.ddbDefinition.type
      || proficiency.name === this.ddbDefinition.baseArmorName)
    ) {
      this.data.system.proficient = true;
    }
  }

  _generateDamageParts() {
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

  _generateMagicalBonus() {
    this.actionInfo.magicBonus.null = this.#getMagicalBonus();
    this.actionInfo.magicBonus.zero = this.#getMagicalBonus(true);
    switch (this.parsingType) {
      case "armor": {
        const magicBonus = this.#getMagicalArmorBonus();
        if (magicBonus > 0) {
          this.data.system.armor.magicalBonus = magicBonus;
          this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
        }
        break;
      }
      case "staff":
      case "ammunition": {
        if (this.actionInfo.magicBonus.zero > 0) {
          this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
          this.data.system.magicalBonus = this.actionInfo.magicBonus.zero;
        }
        break;
      }
      case "weapon": {
        const magicalBonus = this.#getWeaponMagicalBonus(true);
        this.actionInfo.magicBonus.zero = magicalBonus;
        if (magicalBonus > 0) {
          this.data.system.magicalBonus = magicalBonus;
          this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
        }
        break;
      }
      default: {
        if (this.actionInfo.magicBonus.zero > 0) {
          this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
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

  // TODO: refactor this function for activites and changed usage
  // { value: "recoverAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.RecoverAll") },
  // { value: "loseAll", label: game.i18n.localize("DND5E.USES.Recovery.Type.LoseAll") },
  // { value: "formula", label: game.i18n.localize("DND5E.USES.Recovery.Type.Formula") }
  #generateUses(prompt = false) {
    if (this.ddbItem.limitedUse !== undefined && this.ddbItem.limitedUse !== null && this.ddbItem.limitedUse.resetTypeDescription !== null) {
      let resetType = DICTIONARY.resets.find((reset) => reset.id == this.ddbItem.limitedUse.resetType);

      const recoveryFormula = DDBItem.getRechargeFormula(this.ddbItem.limitedUse.resetTypeDescription, this.ddbItem.limitedUse.maxUses);
      const recoveryIsMax = `${recoveryFormula}` === `${this.ddbItem.limitedUse.maxUses}`;

      const recovery = [];
      if (resetType.value) {
        recovery.push({
          period: resetType.value,
          type: recoveryIsMax ? "recoverAll" : "formula",
          formula: recoveryIsMax ? "" : recoveryFormula,
        });
      }
      this.data.uses = {
        max: this.ddbItem.limitedUse.maxUses,
        spent: this.ddbItem.limitedUse.numberUsed ?? 0,
        recovery,
        prompt,
      };
    } else {
      this.data.uses = { spent: 0, max: 0, recovery: [], prompt };
    }

  }

  #getConsumableUses() {
    if (this.ddbItem.limitedUse) {
      this.#generateUses(true);
      if (this.data.uses.recovery.length === 0) {
        // uses.per = "charges";
        // TODO: we don't uses charges anymore here (Depricated, figure out what to use.) Is this just a consume?
        this.data.uses.recovery.push({ period: "charges", type: "recoverAll" });
      }
      this.data.uses.autoDestroy = true;
    } else {
      // default
      this.data.uses = {
        spent: 0,
        max: 1,
        recovery: [
          // TODO: we don't uses charges anymore here (Depricated, figure out what to use.) Is this just a consume?
          { period: "charges" },
        ],
        // TODO: where do these now live?
        autoDestroy: true,
        autoUse: false,
      };
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
    this.data.system.capacity =  (this.ddbDefinition.capacityWeight !== null)
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
      this.data.system.properties = utils.addToProperties(loot.system.properties, "weightlessContents");
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
      && this.data.system.type.value.indexOf("simple") !== -1
    ) {
      return true;
    } else if (
      this.characterProficiencies.some((proficiency) => proficiency.name === "Martial Weapons")
      && this.data.system.type.indexOf("martial") !== -1
    ) {
      return true;
    } else {
      const proficient = this.characterProficiencies.some((proficiency) =>
        proficiency.name.toLowerCase() === this.ddbDefinition.type.toLowerCase()
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
    this.activityOptions.generateActivation = true;
    this.activityOptions.generateRange = true;

    if (this.damageParts.length > 0) {
      this.system.damage = {
        replace: false,
        base: this.damageParts[0],
      };
    }

    // todo: more than one damage part?
    // do we ever want to replace damage here?
    // do we need to have a secondary damage part or save e.g. slaying arrow?

    // ammunition damage
    // "replace": true
  }

  #generateArmorSpecifics() {
    this.data.system.armor.value = this.ddbDefinition.armorClass;
    this.data.system.strength = this.ddbDefinition.strengthRequirement ?? 0;
    if (this.ddbDefinition.stealthCheck === 2)
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "stealthDisadvantage");
    this.#generateArmorMaxDex();
    this.#generateProficient();
    this.#generateUses();
    if (!this.data.name.toLowerCase().includes("armor")) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.alternativeNames", [`${this.name} Armor`]);
    }
  }

  #generateConsumableSpecifics() {
    this.activityOptions.generateActivation = true;
    if (this.data.system.type.value === "wand") {
      this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");
    }
    this.#getConsumableUses();
  }

  #generateLootSpecifics() {
    if (this.systemType.value) {
      this.#getConsumableUses();
    }
    if (this.documentType === "container") {
      this.#generateCapacity();
      this.#generateCurrency();
      this.#generateWeightless();
    }
  }

  #generateScrollSpecifics() {
    this.activityOptions.generateActivation = true;
    //todo: what kind of activity type are scrolls?
    this.#getConsumableUses();
  }

  #generateStaffSpecifics() {
    this.activityOptions.generateActivation = true;
    this.activityOptions.generateAttack = true;
    this.#generateStaffProperties();
    this.data.system.proficient = this.#getWeaponProficient();
    this.data.system.range = this.#getWeaponBehaviourRange();
    this.actionInfo.ability = this.#getAbility();
    this.actionInfo.meleeAttack = this.data.system.range.long === 5;
    if (!game.modules.get("magicitems")?.active && !game.modules.get("items-with-spells-5e")?.active) {
      this.#generateUses();
    }
  }

  #generateToolSpecifics() {
    this.activityOptions.generateCheck = true;
    const defaultAbility = DICTIONARY.character.proficiencies.find((prof) => prof.name === tool.name);
    this.actionInfo.ability = defaultAbility?.ability ?? "dex";
    this.data.system.proficient = this.ddbData ? this.#getToolProficiency(this.ddbDefinition.name, this.actionInfo.ability) : 0;
    this.#generateUses();
  }

  #generateWeaponSpecifics() {
    this.activityOptions.generateAttack = true;
    this.activityOptions.generateActivation = true;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.damage", this.flags.damage);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.classFeatures", this.flags.classFeatures);
    this.#generateWeaponProperties();
    const proficientFeatures = ["pactWeapon", "kensaiWeapon"];
    this.data.system.proficient = this.flags.classFeatures.some((feat) => proficientFeatures.includes(feat))
      ? true
      : this.#getWeaponProficient();
    // Todo: Maybe not needed anymore?
    if (this.flags.classFeatures.includes("OffHand")) this.actionInfo.activation.type = "bonus";
    this.data.system.range = this.#getWeaponRange();
    this.#generateUses(false);
    this.data.system.uses.prompt = false;
    this.actionInfo.ability = this.#getWeaponAbility();
    if (this.ddbDefinition.attackType === 1) {
      this.actionInfo.meleeAttack = true;
    } else {
      this.actionInfo.meleeAttack = false;
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
      this.data.system.type.value = this.isClothingTag && !this.isContainer ? "clothing" : "trinket";
      this.data.system.strength = 0;
      this.data.system.properties = utils.removeFromProperties(this.data.system.properties, "stealthDisadvantage");
      this.data.system.proficient = null;
    }
    this.#generateUses(true);
    if (!this.isTattoo) {
      this.#generateCapacity();
    }
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

  // eslint-disable-next-line complexity
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

  // eslint-disable-next-line complexity
  async build() {
    try {
      await this._prepare();

      this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);
      this.data.system.weight = this.#getSingleItemWeight();

      if (this.ddbDefinition.magic)
        this.data.system.properties = utils.addToProperties(this.data.system.properties, "mgc");

      this.#generateTypeSpecifics();

      this.#generateEquipped();
      this.#generateItemRarity();
      this.#generateQuantity();
      this.#generatePrice();
      this._generateMagicalBonus();

      if (this.overrides.ddbType)
        foundry.utils.setProperty(this.data, "flags.ddbimporter.dndbeyond.type", this.overrides.ddbType);

      this.#generateActivityType();
      this._buildCoreActivities();
      this._buildAdditionalActivities();

      this.data.system.attuned = this.ddbItem.isAttuned;
      this.#generateAttunement();

      // should be one of the last things to do
      await this.#generateDescription();

      this.#addExtraDDBFlags();
      DDBHelper.addCustomValues(this.ddbData, this.data);
      this.#enrichFlags();
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

}
