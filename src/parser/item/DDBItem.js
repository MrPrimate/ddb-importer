import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper";
import { generateTable } from "../../lib/DDBTable.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";

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
    };

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

  }

  _init() {
    logger.debug(`Generating Item ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          dndbeyond: {
            type: this.ddbDefinition.type,
            originalName: this.originalName,
          },
        },
      },
    };
    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)
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

  #getArmourValues() {
    // get the armor class
    const baseArmorClass = this.ddbDefinition.armorClass;
    const bonusArmorClass = this.ddbDefinition.grantedModifiers.reduce((prev, cur) => {
      if (cur.type === "bonus" && cur.subType === "armor-class" && Number.isInteger(cur.value)) {
        return prev + cur.value;
      } else {
        return prev;
      }
    }, 0);

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

    return {
      type: this.systemType.value,
      value: baseArmorClass + bonusArmorClass,
      dex: maxDexModifier,
    };
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

  #determineType() {
    if (!this.ddbDefinition.filterType) this.type.main = "custom";

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
    let flags = {
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

    if (flags.classFeatures.includes("Lifedrinker")) {
      flags.damage.parts.push(["@abilities.cha.mod", "necrotic"]);
    }

    // for melee attacks get extras
    if (this.ddbDefinition.attackType === 1) {
      // get improved divine smite etc for melee attacks
      const extraDamage = this.#getExtraDamage(["Melee Weapon Attacks"]);

      if (!!extraDamage.length > 0) {
        flags.damage.parts = flags.damage.parts.concat(extraDamage);
      }
      // do we have great weapon fighting?
      if (DDBHelper.hasChosenCharacterOption(this.ddbData, "Great Weapon Fighting")) {
        flags.classFeatures.push("greatWeaponFighting");
      }
      // do we have two weapon fighting style?
      if (DDBHelper.hasChosenCharacterOption(this.ddbData, "Two-Weapon Fighting")) {
        flags.classFeatures.push("Two-Weapon Fighting");
      }
      if (DDBHelper.getCustomValueFromCharacter(this.ddbItem, this.rawCharacter, 18)) {
        flags.classFeatures.push("OffHand");
      }
    }
    // ranged fighting style is added as a global modifier elsewhere
    // as is defensive style

    logger.debug(`Flags for ${this.ddbItem.name ?? this.ddbDefinition.name}`, { ddbItem: this.ddbItem, flags });

    this.flags = flags;
  };


  async _prepare() {
    this.ddbDefinition.description = await generateTable(this.name, this.ddbDefinition.description, this.updateExisting);
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

  #getBasicRange() {
    return {
      value: this.ddbDefinition.range ? this.ddbDefinition.range : null,
      long: this.ddbDefinition.longRange ? this.ddbDefinition.longRange : null,
      units: (this.ddbDefinition.range || this.ddbDefinition.range) ? "ft" : "",
    };
  }

  async build() {
    await this._prepare();
    this._generateDataStub();

    switch (this.parsingType) {
      case "ammunition": {
        break;
      }
      case "armor": {
        break;
      }
      case "consumable": {
        break;
      }
      case "loot": {
        break;
      }
      case "scroll": {
        break;
      }
      case "staff": {
        break;
      }
      case "tool": {
        break;
      }
      case "weapon": {
        break;
      }
      case "wonderous": {
        break;
      }
      case "custom":
      default: {
        // no matching case, try custom item parse
      }
    }


    this.data.system.source = DDBHelper.parseSource(this.ddbDefinition);

    // should be one of the last things to do
    this.data.system.description = this.#getDescription();

  }

}
