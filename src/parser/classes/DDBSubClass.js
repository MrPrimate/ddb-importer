import DDBHelper from '../../lib/DDBHelper.js';
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
    this.data.system.classIdentifier = DDBHelper.classIdentifierName(this.ddbClass.definition.name);

  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.ddbClass.subclassDefinition.name,
      type: "subclass",
      system: utils.getTemplate("subclass"),
      flags: {
        ddbimporter: {
          subclassDefinitionId: this.ddbClass.id,
          id: this.ddbClass.subclassDefinition.id,
          type: "class",
          ddbImg: this.ddbClass.subclassDefinition.portraitAvatarUrl ?? this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
        obsidian: {
          source: {
            type: "class",
            text: this.ddbClass.subclassDefinition.name,
          },
        },
      },
      img: null,
    };
  }

  constructor(ddb, classId) {
    super(ddb, classId);

    this.ddbClassDefinition = this.ddbClass.subclassDefinition;
    this._isSubClass = true;
    this.SPECIAL_ADVANCEMENTS = DDBSubClass.SPECIAL_ADVANCEMENTS;
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
    } else if (this.data.name.startsWith("Path of the Storm Herald")) {
      const desert = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `storm-aura-desert`,
          type: "number",
          scale: {
            3: {
              value: 2,
            },
            5: {
              value: 3,
            },
            10: {
              value: 4,
            },
            15: {
              value: 5,
            },
            20: {
              value: 6,
            },
          },
        },
        value: {},
        title: `Storm Aura Desert`,
        icon: null,
      };

      const sea = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `storm-aura-sea`,
          type: "dice",
          scale: {
            3: {
              number: 1,
              faces: 6,
            },
            10: {
              number: 2,
              faces: 6,
            },
            15: {
              number: 3,
              faces: 6,
            },
            20: {
              number: 4,
              faces: 6,
            },
          },
        },
        value: {},
        title: `Storm Aura Sea`,
        icon: null,
      };

      const tundra = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `storm-aura-tundra`,
          type: "number",
          scale: {
            3: {
              value: 2,
            },
            5: {
              value: 3,
            },
            10: {
              value: 4,
            },
            15: {
              value: 5,
            },
            20: {
              value: 6,
            },
          },
        },
        value: {},
        title: `Storm Aura Tundra`,
        icon: null,
      };

      this.data.system.advancement.push(desert, sea, tundra);
    } else if (this.data.name.startsWith("Circle of the Moon")) {
      const cr = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `wild-shape-cr`,
          type: "cr",
          scale: {
            6: {
              value: 2,
            },
            9: {
              value: 3,
            },
            12: {
              value: 4,
            },
            15: {
              value: 5,
            },
            18: {
              value: 6,
            },
          },
        },
        value: {},
        title: `Wild Shape CR`,
        icon: null,
      };
      if (this.is2014) {
        cr.configuration.scale[2] = {
          value: 1,
        };
      } else {
        cr.configuration.scale[3] = {
          value: 1,
        };
      }
      this.data.system.advancement.push(cr);
    } else if (this.data.name.startsWith("Circle of the Land") && !this.is2014) {
      const aid = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `lands-aid`,
          type: "dice",
          scale: {
            3: {
              number: 2,
              faces: 6,
            },
            10: {
              number: 3,
              faces: 6,
            },
            14: {
              number: 4,
              faces: 6,
            },
          },
        },
        value: {},
        title: `Lands Aid Dice`,
        icon: null,
      };
      this.data.system.advancement.push(aid);
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
