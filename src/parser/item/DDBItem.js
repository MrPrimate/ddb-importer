import DDBHelper from "../../lib/DDBHelper";
import { generateTable } from "../../lib/DDBTable.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";


export default class DDBItem {

  _init() {
    logger.debug(`Generating Base Feature ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.name,
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {

      },
    };
    // Spells will still have activation/duration/range/target,
    // weapons will still have range & damage (1 base part & 1 versatile part),
    // and all items will still have limited uses (but no consumption)
  }

  _generateItemFlags() {
    let flags = {
      damage: {
        parts: [],
      },
      // Some features, notably hexblade abilities we scrape out here
      classFeatures: getClassFeatures(this.ddbData, this.ddbItem),
      martialArtsDie: getMartialArtsDie(this.ddbData),
      maxMediumArmorDex: Math.max(
        ...DDBHelper.filterBaseModifiers(this.ddbData, "set", { subType: "ac-max-dex-armored-modifier", includeExcludedEffects: true }).map((mod) => mod.value),
        ...DDBHelper.filterModifiersOld(this.ddbItem.definition?.grantedModifiers ?? this.ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-armored-modifier", ["", null], true).map((mod) => mod.value),
        ...DDBHelper.filterModifiersOld(this.ddbItem.definition?.grantedModifiers ?? this.ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-modifier", ["", null], true).map((mod) => mod.value),
        2,
      ),
      magicItemAttackInt: DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0,
    };

    if (flags.classFeatures.includes("Lifedrinker")) {
      flags.damage.parts.push(["@abilities.cha.mod", "necrotic"]);
    }

    // for melee attacks get extras
    if (this.ddbItem.definition.attackType === 1) {
      // get improved divine smite etc for melee attacks
      const extraDamage = getExtraDamage(this.ddbData, ["Melee Weapon Attacks"]);

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
      if (DDBHelper.getCustomValueFromCharacter(this.ddbItem, rawCharacter, 18)) {
        flags.classFeatures.push("OffHand");
      }
    }
    // ranged fighting style is added as a global modifier elsewhere
    // as is defensive style

    logger.debug(`Flags for ${this.ddbItem.name ?? this.ddbItem.definition.name}`, { ddbItem: this.ddbItem, flags });

    this.flag = flags;
  };

  constructor({ ddbData, ddbItem, rawCharacter = null, isCompendium = false } = {}) {

    this.ddbData = ddbData;
    this.ddbItem = ddbItem;
    this.ddbDefinition = this.ddbItem.definition;
    this.rawCharacter = rawCharacter;
    this.isCompendiumItem = isCompendium;
    foundry.utils.setProperty(this.ddbItem, "isCompendiumItem", isCompendium);


    this.originalName = ddbItem.definition.name;
    this.name = DDBHelper.getName(this.ddbData, ddbItem, this.rawCharacter);
    this._generateItemFlags();

    this.documentType = null;

    this.addAutomationEffects = this.isCompendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-add-effects")
      : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

    this._init();


  }

  async _prepare() {
    const updateExisting = this.isCompendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    this.ddbItem.definition.description = await generateTable(this.name, this.ddbItem.definition.description, updateExisting);

  }

  async build() {
    await this._prepare();
    this._generateDataStub();


  }

}
