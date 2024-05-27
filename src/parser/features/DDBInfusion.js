import DDBHelper from "../../lib/DDBHelper.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";

export class DDBInfusion {

  _init() {
    logger.debug(`Generating Infusion Feature ${this.ddbDefinition.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: utils.nameString(`Infusion: ${this.ddbDefinition.name}`),
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      flags: {
        ddbimporter: {
          id: this.ddbInfusion.id,
          type: this.tagType,
          dndbeyond: {
            defintionKey: this.ddbInfusion.definitionKey,
            requiredLevel: this.ddbInfusion.level,
            modifierType: this.ddbDefinition.modifierDataType,
          },
        },
      }
    };

    const requiredLevel = foundry.utils.getProperty(this.ddbInfusion, "level");
    if (Number.isInteger(Number.parseInt(requiredLevel))) {
      this.data.system.prerequisites = {
        level: Number.parseInt(requiredLevel),
      };
    }

    this.data.consume = {
      type: "charges",
      target: "",
      amount: "-1",
      scale: false,
    };
    this.data.enchantment = {
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
    const valueDamageText = parseDamageRolls({ text: this.ddbInfusion.description, document: this.data, actor: null });
    const chatDamageText = chatAdd ? parseDamageRolls({ text: chatSnippet, document: this.data, actor: null }) : "";
    this.data.description = {
      value: parseTags(valueDamageText),
      chat: chatAdd ? parseTags(chatDamageText) : "",
    };
  }

  _generateSystemType() {
    foundry.utils.setProperty(this.data, "system.type.value", "enchantment");
    foundry.utils.setProperty(this.data, "system.type.subtype", "artificerInfusion");
  }

  _generateEnchantmentType() {
    const type = "equipment"; // weapon etc
    foundry.utils.setProperty(this.data, "enchantment.restrictions.type", type);
  }

  _generateActionType() {
    if (["augment", "replicate"].includes(this.ddbInfusion.type)) {
      this.data.actionType = "ench";
    } else if (this.ddbInfusion.type === "creature") {
      this.data.actionType = "summon";
    }
  }

  _buildActions() {
    // build actions fomr this.ddbInfusion.actions
  }

  _specials() {
    // handle special cases
  }

  build() {
    this._generateSystemType();
    // this._generateEnchantmentType();
    this._generateActionType();

    this._buildDescription();


    // build actions
    this._buildActions();
    // add to compendium folders?

    this._specials();

  }

}
