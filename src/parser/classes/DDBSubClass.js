import { logger } from "../../lib/_module.mjs";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import SpellListExtractor from "../enrichers/data/SpellListExtractor.mjs";
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

  static NOT_SPELL_LIST_ADVANCEMENTS = [
    "Circle of the Land Spells",
  ];

  static FORCE_SPELL_LIST_ADVANCEMENTS = [];

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
      name: this.ddbClass.subclassDefinition.name.replace("(2014)", "").trim(),
      type: "subclass",
      system: SystemHelpers.getTemplate("subclass"),
      flags: {
        ddbimporter: {
          class: this.ddbClass.definition.name,
          subclass: this.ddbClass.subclassDefinition.name,
          id: this.ddbClass.id,
          classDefinitionId: this.ddbClass.definition.id,
          definitionId: this.ddbClass.subclassDefinition.id,
          subclassDefinitionId: this.ddbClass.subclassDefinition.id,
          type: "class",
          ddbImg: this.ddbClass.subclassDefinition.portraitAvatarUrl ?? this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
      },
      img: null,
    };
  }

  subClassName;

  isSubClass = true;

  constructor(ddb, classId, options = {}) {
    super(ddb, classId, options);

    // adjustments for subclass
    this.ddbClassDefinition = this.ddbClass.subclassDefinition;
    this.isSubClass = true;
    this.name = this.ddbClass.subclassDefinition.name;
    this.subClassName = this.ddbClass.subclassDefinition.name;
    this._processSources();
    this.advancementHelper.isSubclass = true;

    this.SPECIAL_ADVANCEMENTS = DDBSubClass.SPECIAL_ADVANCEMENTS;
    this.NOT_ADVANCEMENT_FOR_FEATURE = DDBSubClass.NOT_ADVANCEMENT_FOR_FEATURE;
    this.NO_ADVANCEMENT_2014 = DDBSubClass.NO_ADVANCEMENT_2014;
    this.NO_ADVANCEMENT_2024 = DDBSubClass.NO_ADVANCEMENT_2024;
    this.FORCE_SPELL_LIST_ADVANCEMENTS = DDBSubClass.FORCE_SPELL_LIST_ADVANCEMENTS;
    this.NOT_SPELL_LIST_ADVANCEMENTS = DDBSubClass.NOT_SPELL_LIST_ADVANCEMENTS;

  }

  _bloodHunterFixes() {
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
    }
  }

  _barbarianFixes() {
    if (this.data.name.startsWith("Path of the Storm Herald")) {
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
    }
  }

  _druidFixes() {
    if (this.data.name.startsWith("Circle of the Moon")) {
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
    } else if ((this.data.name.startsWith("Circle of the Sea"))) {
      const form = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `wrath-range`,
          type: "number",
          scale: {
            3: { value: 5 },
            6: { value: 10 },
          },
        },
        value: {},
        title: `Wrath Range`,
        icon: null,
      };
      this.data.system.advancement.push(form);
    }
  }

  _fighterFixes() {
    if ((this.data.name.startsWith("Psi Warrior") || this.data.name.startsWith("Soulknife")) && !this.is2014) {
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
    } else if (this.data.name.startsWith("Arcane Archer") && this.is2014) {
      const secondary = {
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
      this.data.system.advancement.push(secondary);
      const minor = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `minor-damage`,
          type: "dice",
          scale: {
            3: { number: 1, faces: 6 },
            18: { number: 2, faces: 6 },
          },
        },
        value: {},
        title: `Minor Damage Dice`,
        icon: null,
      };
      this.data.system.advancement.push(minor);
    }
  }

  _rangerFixes() {
    if (this.data.name.startsWith("Drake Warden")) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Drake Companion") continue;
        advancement.configuration.type = "dice";
        advancement.configuration.scale = {
          7: { number: 1, faces: 6 },
          15: { number: 2, faces: 6 },
        };
      }
    }
  }

  async _bardFixes() {
    if (this.data.name.startsWith("College of the Moon")) {
      const cantripChoiceAdvancement = await AdvancementHelper.getCantripChoiceAdvancement({
        choices: [],
        abilities: ["cha"],
        hint: "Pick a druid cantrip",
        name: "Druidic Lore",
        spellListChoice: "Druid",
        spellLinks: this.spellLinks,
        is2024: true,
        choiceLevel: 3,
      });
      if (cantripChoiceAdvancement) {
        cantripChoiceAdvancement.updateSource({
          configuration: {
            restriction: {
              list: [
                "class:druid",
              ],
            },
          },
        });
        this.data.system.advancement.push(cantripChoiceAdvancement.toObject());
      }
    }
  }

  _sorcererFixes() {
    if (this.data.name.startsWith("Spellfire Sorcery")) {
      const dice = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `spellfire-burst-damage-dice`,
          type: "dice",
          scale: {
            3: { number: 1, faces: 4 },
            14: { number: 1, faces: 8 },
          },
        },
        value: {},
        title: `Spellfire Burst Damage Dice`,
        icon: null,
      };
      this.data.system.advancement.push(dice);
    }
  }

  _artificerFixes() {
    if (this.data.name.startsWith("Alchemist")) {
      if (this.is2024) {
        const elixir = {
          type: "ScaleValue",
          configuration: {
            identifier: "experimental-elixir",
            type: "number",
            scale: {
              "3": {
                "value": 2,
              },
              "5": {
                "value": 3,
              },
              "9": {
                "value": 4,
              },
              "15": {
                "value": 5,
              },
            },
          },
          title: "Experimental Elixir",
        };
        this.data.system.advancement.push(elixir);
      }
    } else if (this.data.name.startsWith("Armorer") && this.is2024) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Improved Armorer") continue;
        advancement.configuration.scale[3] = { value: 0 };
      }
      const forceDemolisher = {
        type: "ScaleValue",
        configuration: {
          identifier: "force-demolisher",
          type: "dice",
          scale: {
            3: { number: 1, faces: 10 },
            14: { number: 2, faces: 6 },
          },
        },
        title: "Force Demolisher",
      };
      this.data.system.advancement.push(forceDemolisher);
      const lightningLauncher = {
        type: "ScaleValue",
        configuration: {
          identifier: "lightning-launcher",
          type: "dice",
          scale: {
            3: { number: 1, faces: 8 },
            14: { number: 1, faces: 10 },
          },
        },
        title: "Lightning Launcher",
      };
      this.data.system.advancement.push(lightningLauncher);
      const thunderPulse = {
        type: "ScaleValue",
        configuration: {
          identifier: "thunder-pulse",
          type: "dice",
          scale: {
            3: { number: 1, faces: 6 },
            14: { number: 2, faces: 6 },
          },
        },
        title: "Thunder Pulse",
      };
      this.data.system.advancement.push(thunderPulse);
    } else if (this.data.name.startsWith("Artillerist") && this.is2024) {
      const damage = {
        type: "ScaleValue",
        configuration: {
          identifier: "eldritch-cannon",
          type: "dice",
          scale: {
            3: { number: 2, faces: 8 },
            9: { number: 3, faces: 8 },
          },
        },
        title: "Eldritch Cannon Damage Dice",
      };
      this.data.system.advancement.push(damage);
      const healing = {
        type: "ScaleValue",
        configuration: {
          identifier: "healing-dice",
          type: "dice",
          scale: {
            3: { number: 1, faces: 8 },
            9: { number: 2, faces: 8 },
          },
        },
        title: "Protector Healing Dice",
      };
      this.data.system.advancement.push(healing);
    }
  }

  // eslint-disable-next-line complexity
  async _fixes() {
    this._fightingStyleAdvancement();
    this._bloodHunterFixes();
    this._barbarianFixes();
    this._druidFixes();
    this._fighterFixes();
    this._rangerFixes();
    this._sorcererFixes();
    this._artificerFixes();
    await this._bardFixes();
  }

  async _generateSpellListAdvancement(feature) {
    const advancements = [];

    const extractor = new SpellListExtractor({
      name: feature.name,
      description: feature.description,
      is2014: this.is2014,
      is2024: this.is2024,
      sourceId: feature.sourceId,
    });

    const extractedSpells = extractor.extractSpells(true);

    const name = feature.name.toLowerCase().includes("spell")
      ? feature.name
      : `${feature.name} (Spells)`;

    logger.debug("Spell List Advancement Data", {
      extractedSpells,
      this: this,
      trait: feature,
      name,
    });

    for (const [key, spells] of Object.entries(extractedSpells)) {
      logger.debug(`Extracted Spells for ${key}`, { spells });
      const options = {
        name,
        spellLinks: this.spellLinks,
        spellGrants: spells.map((name) => {
          return {
            name,
            level: key,
          };
        }),
        level: key,
        requireSlot: true,
        method: "spell",
        is2024: this.is2024,
        prepared: feature.description.includes("always have the listed spells prepared")
          ? CONFIG.DND5E.spellPreparationStates.always.value
          : CONFIG.DND5E.spellPreparationStates.unprepared.value,
      };
      const grantAdvancement = await AdvancementHelper.getSpellGrantAdvancement(options);

      if (grantAdvancement) {
        advancements.push(grantAdvancement);
      }
    }

    logger.debug("Spell Advancements", {
      advancements,
    });

    advancements.forEach((advancement) => {
      this.data.system.advancement.push(advancement.toObject());
    });
  }

  async _generateSpellListAdvancements() {
    const advancementFeatures = this.classFeatures
      .filter((feature) => !this.NOT_SPELL_LIST_ADVANCEMENTS.includes(feature.name))
      .filter((feature) => feature.name.toLowerCase().endsWith("spells")
        || this.FORCE_SPELL_LIST_ADVANCEMENTS.includes(feature.name))
      .filter((feature) => feature.description.includes("<table"));

    for (const feature of advancementFeatures) {
      // console.warn("Generating spell list advancement for feature:", feature);
      let advancement = await this._generateSpellListAdvancement(feature);
      if (!advancement) continue;
      if ((this.is2014 && !this.NO_ADVANCEMENT_2014.includes(advancement.configuration?.identifier))
        || (!this.is2014 && !this.NO_ADVANCEMENT_2024.includes(advancement.configuration?.identifier)))
        continue;
      this.data.system.advancement.push(advancement);
    }
  }

  async generateFromCharacter(character) {
    await this._buildCompendiumIndex("features");
    await this._buildCompendiumIndex("feats");
    this._fleshOutCommonDataStub();
    await this._generateCommonAdvancements();
    await this._generateDescriptionStub(character);
    await this._generateSpellListAdvancements();
    await this._fixes();
    await this._addToCompendium();
  }
}
