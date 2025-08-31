import AdvancementHelper from "../advancements/AdvancementHelper.js";
import { DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";
import DDBClass from "./DDBClass.js";

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
    "Psionic Power": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Energy Die", identifier: "energy-die" },
      // fixFunctions: [
      // {
      //   fn: AdvancementHelper.addDiceRange,
      //   args: { number: [4, 6, 8, 8, 10, 12] },
      // },
      // ],
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    // "Arcane Shot Options": {
    //   fix: true,
    //   fixFunction: AdvancementHelper.rename,
    //   functionArgs: { newName: "Damage", identifier: "damage" },
    //   additionalAdvancements: false,
    //   additionalFunctions: [],
    // },
  };

  static NOT_ADVANCEMENT_FOR_FEATURE = ["Soul Blades"];

  static NO_ADVANCEMENT_2014 = [];

  static NO_ADVANCEMENT_2024 = [];

  _fleshOutCommonDataStub() {
    super._fleshOutCommonDataStub();
    // add parent class identifier
    this.data.system.classIdentifier = DDBDataUtils.classIdentifierName(this.ddbClass.definition.name);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.ddbClass.subclassDefinition.name,
      type: "subclass",
      system: SystemHelpers.getTemplate("subclass"),
      flags: {
        ddbimporter: {
          class: this.ddbClass.definition.name,
          subclass: this.ddbClass.subclassDefinition.name,
          subclassDefinitionId: this.ddbClass.id,
          id: this.ddbClass.subclassDefinition.id,
          type: "class",
          ddbImg: this.ddbClass.subclassDefinition.portraitAvatarUrl ?? this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
      },
      img: null,
    };
  }

  constructor(ddb, classId, options = {}) {
    super(ddb, classId, options);

    this.ddbClassDefinition = this.ddbClass.subclassDefinition;
    this._isSubClass = true;
    this.SPECIAL_ADVANCEMENTS = DDBSubClass.SPECIAL_ADVANCEMENTS;
    this.NOT_ADVANCEMENT_FOR_FEATURE = DDBSubClass.NOT_ADVANCEMENT_FOR_FEATURE;
    this.NO_ADVANCEMENT_2014 = DDBSubClass.NO_ADVANCEMENT_2014;
    this.NO_ADVANCEMENT_2024 = DDBSubClass.NO_ADVANCEMENT_2024;
  }

  // eslint-disable-next-line complexity
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
            3: { value: 1 },
            6: { value: 2 },
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
            3: { value: 1 },
            7: { value: 2 },
            13: { value: 3 },
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
            3: { value: 2 },
            5: { value: 3 },
            10: { value: 4 },
            15: { value: 5 },
            20: { value: 6 },
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
            3: { number: 1, faces: 6 },
            10: { number: 2, faces: 6 },
            15: { number: 3, faces: 6 },
            20: { number: 4, faces: 6 },
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
            3: { value: 2 },
            5: { value: 3 },
            10: { value: 4 },
            15: { value: 5 },
            20: { value: 6 },
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
            6: { value: 2 },
            9: { value: 3 },
            12: { value: 4 },
            15: { value: 5 },
            18: { value: 6 },
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
            3: { number: 2, faces: 6 },
            10: { number: 3, faces: 6 },
            14: { number: 4, faces: 6 },
          },
        },
        value: {},
        title: `Lands Aid Dice`,
        icon: null,
      };
      this.data.system.advancement.push(aid);
    } else if (this.data.name.startsWith("Circle of the Stars") && !this.is2014) {
      const form = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `starry-form`,
          type: "dice",
          scale: {
            3: { number: 1, faces: 8 },
            10: { number: 2, faces: 8 },
          },
        },
        value: {},
        title: `Starry Form Dice`,
        icon: null,
      };
      this.data.system.advancement.push(form);
    } else if ((this.data.name.startsWith("Psi Warrior") || this.data.name.startsWith("Soulknife")) && !this.is2014) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Energy Die") continue;
        advancement.configuration.scale = foundry.utils.mergeObject(advancement.configuration.scale, {
          3: { number: 4, faces: 6 },
          5: { number: 6, faces: 8 },
          9: { number: 8, faces: 8 },
          11: { number: 8, faces: 10 },
          13: { number: 10, faces: 10 },
          17: { number: 12, faces: 12 },
        });
      }
    } else if (this.data.name.startsWith("Rune Knight")) {
      const number = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `rune-uses`,
          type: "number",
          scale: {
            3: { value: 1 },
            15: { value: 2 },
          },
        },
        value: {},
        title: `Rune Uses`,
        icon: null,
      };

      this.data.system.advancement.push(number);
    } else if (this.data.name.startsWith("Drake Warden")) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Drake Companion") continue;
        advancement.configuration.type = "dice";
        advancement.configuration.scale = {
          7: { number: 1, faces: 6 },
          15: { number: 2, faces: 6 },
        };
      }
    } else if (this.data.name.startsWith("Steel Hawk")) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Launch") continue;
        advancement.configuration.scale = {
          3: { number: 3, faces: 8 },
          7: { number: 4, faces: 8 },
          10: { number: 4, faces: 10 },
          15: { number: 5, faces: 10 },
          18: { number: 5, faces: 12 },
        };
      }
    } else if (this.data.name.startsWith("Arcane Archer")) {
      const form = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `secondary-damage`,
          type: "dice",
          scale: {
            18: { number: 2, faces: 6 },
          },
        },
        value: {},
        title: `Secondary Damage Dice`,
        icon: null,
      };
      this.data.system.advancement.push(form);
    }
  }

  async generateFromCharacter(character) {
    await this._buildCompendiumIndex("features");
    this._fleshOutCommonDataStub();
    await this._generateCommonAdvancements();
    await this._generateDescriptionStub(character);
    this._fixes();
    await this._addToCompendium();
  }
}
