import utils from '../../lib/utils.js';
import AdvancementHelper from '../advancements/AdvancementHelper.js';
import DDBClass from './DDBClass.js';

export default class DDBSubClass extends DDBClass {

  // these are advancement helpers
  static SPECIAL_ADVANCEMENTS = {
    "Combat Superiority": {
      fix: true,
      fixFunction: AdvancementHelper.renameTotal,
      additionalAdvancements: true,
      additionalFunctions: [AdvancementHelper.addAdditionalUses, AdvancementHelper.addSingularDie],
    },
    "Rune Carver": {
      fix: true,
      fixFunction: AdvancementHelper.renameTotal,
      additionalAdvancements: false,
      additionalFunctions: [],
    },
  };

  _fleshOutCommonDataStub() {
    super._fleshOutCommonDataStub();
    // add parent class identifier
    this.data.system.classIdentifier = utils.referenceNameString(this.ddbClass.definition.name.toLowerCase());

  }

  _generateDataStub() {
    this.data = {
      name: this.ddbClass.subclassDefinition.name,
      type: "subclass",
      system: utils.getTemplate("subclass"),
      flags: {
        ddbimporter: {
          subclassDefinitionId: this.ddbClass.id,
          id: this.ddbClass.subclassDefinition.id,
          type: "class",
        },
        obsidian: {
          source: {
            type: "class",
            text: this.ddbClass.subclassDefinition.name,
          }
        },
      },
      img: null,
    };
  }

  constructor(ddb, classId) {
    super(ddb, classId);

    this.ddbClassDefinition = this.ddbClass.subclassDefinition;
    this._isSubClass = true;
  }


  _fixes() {
    if (this.data.name.startsWith("Order of the Profane Soul")) {
      this.data.name = "Order of the Profane Soul";
      const slotsScaleValue = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `pact-slots`,
          type: "number",
          scale: {
            3: {
              value: 1,
            },
            6: {
              value: 2,
            },
          },
        },
        value: {},
        title: `Pact Slots`,
        icon: null,
      };

      const levelScaleValue = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `pact-level`,
          type: "number",
          scale: {
            3: {
              value: 1,
            },
            7: {
              value: 2,
            },
            13: {
              value: 3,
            },
          },
        },
        value: {},
        title: `Pact Level`,
        icon: null,
      };

      this.data.system.advancement.push(slotsScaleValue, levelScaleValue);
    }
  }

  async generateFromCharacter(character) {
    await this._buildCompendiumIndex("features");
    this._fleshOutCommonDataStub();
    await this._generateCommonAdvancements();
    await this._generateDescriptionStub(character);
    this._fixes();
  }

}
