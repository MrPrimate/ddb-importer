import { baseEnchantmentEffect, generateEffects } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";

export class DDBInfusion {

  _init() {
    logger.debug(`Generating Infusion Feature ${this.ddbInfusion.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: utils.nameString(`Infusion: ${this.ddbInfusion.name}`),
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      effects: [],
      flags: {
        ddbimporter: {
          id: this.ddbInfusion.id,
          type: this.tagType,
          dndbeyond: {
            defintionKey: this.ddbInfusion.definitionKey,
            requiredLevel: this.ddbInfusion.level,
            modifierType: this.ddbInfusion.modifierDataType,
          },
        },
      }
    };

    this.requiredLevel = null;
    const requiredLevel = foundry.utils.getProperty(this.ddbInfusion, "level");
    if (Number.isInteger(Number.parseInt(requiredLevel))) {
      this.data.system.prerequisites = {
        level: Number.parseInt(requiredLevel),
      };
      this.requiredLevel = Number.parseInt(requiredLevel);
    }

    this.data.system.consume = {
      type: "charges",
      target: "",
      amount: "-1",
      scale: false,
    };
    this.data.system.enchantment = {
      items: {
        max: "",
        period: "",
      },
      restrictions: {
        type: "",
        allowMagical: false
      },
      classIdentifier: "",
    };
  }

  constructor({ ddbData, ddbInfusion, documentType = "feat", rawCharacter = null, noMods = false } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbInfusion = ddbInfusion;
    this.name = utils.nameString(this.ddbInfusion.name);
    this.type = "feat";
    this.source = DDBHelper.parseSource(ddbInfusion);
    this.isAction = false;
    this.documentType = documentType;
    this.tagType = "infusion";
    this.data = {};
    this.noMods = noMods;
    this._init();
    this._generateDataStub();
    this.data.system.source = this.source;
  }

  _buildDescription() {
    const chatSnippet = this.ddbInfusion.snippet ? this.ddbInfusion.snippet : "";
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    const itemText = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text");
    const prerequisitesHeader = this.requiredLevel && this.requiredLevel > 1
      ? `<p><i>Prerequisites: ${utils.ordinalSuffixOf(this.requiredLevel)}-level artificer</i></p>`
      : "";
    const itemHeader = itemText
      ? `<p><i>Item: ${itemText}</i></p>`
      : "";

    const valueDamageText = parseDamageRolls({ text: this.ddbInfusion.description, document: this.data, actor: null });
    const chatDamageText = chatAdd ? parseDamageRolls({ text: chatSnippet, document: this.data, actor: null }) : "";
    this.data.system.description = {
      value: parseTags(prerequisitesHeader + itemHeader + valueDamageText),
      chat: chatAdd ? parseTags(chatDamageText) : "",
    };
  }

  _generateSystemType() {
    foundry.utils.setProperty(this.data, "system.type.value", "enchantment");
    foundry.utils.setProperty(this.data, "system.type.subtype", "artificerInfusion");
  }

  _generateEnchantmentType() {
    const type = "equipment"; // weapon etc
    foundry.utils.setProperty(this.data, "system.enchantment.restrictions.type", type);
  }

  _generateActionType() {
    if (["augment", "replicate"].includes(this.ddbInfusion.type)) {
      this.data.system.actionType = "ench";
    } else if (this.ddbInfusion.type === "creature") {
      this.data.system.actionType = "summon";
    }
  }

  _buildActions() {
    // build actions fomr this.ddbInfusion.actions

    // for example radiant weapon reaction
  }

  _specials() {
    // handle special cases

    // radiant weapon blindness effect?
  }

  _generateEnchanmentEffect() {
    const modifiers = this.ddbInfusion.modifierData.map((data) => data.modifiers).flat();
    const effect = baseEnchantmentEffect(this.data, this.name);
    const foundryItem = foundry.utils.deepClone(this.data);
    const modifierItem = {
      definition: {
        name: this.name,
        grantedModifiers: modifiers,
      },
    };

    const mockItem = generateEffects(this.ddbData, this.rawCharacter, modifierItem, foundryItem, this.noMods, "infusion");

    console.warn(`${this.name} effects`,{mockItem: mockItem.effects});
    if (mockItem.effects.length > 0) effect.changes = mockItem.effects.map((e) => e.data.changes).flat(1);

    effect.changes.push(...this._getMagicBonusChanges(modifiers));

    if (effect.changes.length > 0) this.data.effects.push(effect);
  }

  _generateChoiceEnchantmentEffects() {
  }

  _getMagicBonusChanges(modifiers) {
    const filteredModifiers = DDBHelper.filterModifiersOld(modifiers, "bonus", "magic");
    const magicBonus = DDBHelper.getModifierSum(filteredModifiers, this.rawCharacter);

    const changes = [];
    if (magicBonus && magicBonus !== 0 && magicBonus !== "") {
      changes.push(
        {
          key: "system.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: magicBonus,
          priority: 20,
        },
        {
          key: "system.properties.mgc",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: true,
          priority: 20,
        }
      );
    }
    return changes;
  }

  _generateEnchantments() {
    if ((this.data.system.actionType !== "ench")) return;

    switch (this.ddbInfusion.modifierDataType) {
      case "class-level":
      case "damage-type-choice": {
        this._generateChoiceEnchantmentEffects();
        break;
      }
      case "granted":
      default: {
        this._generateEnchanmentEffect();
      }
    }
  }

  // _generateSummons() {
  //   // summons are generated elsewhere and linked to the feature, not handled her.
  // }

  build() {
    this._generateSystemType();
    // this._generateEnchantmentType();
    this._generateActionType();

    this._buildDescription();

    this._generateEnchantments();

    // build actions
    this._buildActions();
    // add to compendium folders?

    this._specials();

  }

}
