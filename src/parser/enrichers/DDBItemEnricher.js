import DDBItemActivity from "../item/DDBItemActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDItemEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBItemActivity;
  }

  DND_2014 = {
    NAME_HINTS: {},
    ACTIVITY_HINTS: {},
    ADDITIONAL_ACTIVITIES: {},
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {
    "Absorbing Tattoo, Acid": "Absorbing Tattoo",
    "Absorbing Tattoo, Cold": "Absorbing Tattoo",
    "Absorbing Tattoo, Fire": "Absorbing Tattoo",
    "Absorbing Tattoo, Force": "Absorbing Tattoo",
    "Absorbing Tattoo, Lightning": "Absorbing Tattoo",
    "Absorbing Tattoo, Necrotic": "Absorbing Tattoo",
    "Absorbing Tattoo, Poison": "Absorbing Tattoo",
    "Absorbing Tattoo, Psychic": "Absorbing Tattoo",
    "Absorbing Tattoo, Radiant": "Absorbing Tattoo",
    "Absorbing Tattoo, Thunder": "Absorbing Tattoo",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  ACTIVITY_HINTS = {
    "Acid": {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: {
          value: 20,
          units: "ft",
        },
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, type: "acid" })],
        },
        save: {
          ability: "con",
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    },
    "Acid (vial)": {
      type: "attack",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: {
          value: 20,
          units: "ft",
        },
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, type: "acid" })],
        },
        attack: {
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
        },
      },
    },
    "Arcane Oil": {
      type: "enchant",
    },
    "Absorbing Tattoo": {
      type: "utility",
      addItemConsume: true,
      activationType: "reaction",
      activationCondition: `When you take ${this.ddbParser.originalName.split(',').pop().trim().toLowerCase()} damage`,
      targetType: "self",
      data: {
        name: "Healing Reaction",
      },
    },
    "Bead of Force": {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: {
          value: 60,
          units: "ft",
        },
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 5, denomination: 4, type: "force" })],
        },
        target: {
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "10",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "",
            type: "creature",
            choice: false,
            special: "",
          },
          prompt: true,
        },
      },
    },
    "Blood Fury Tattoo": {
      type: "damage",
      addItemConsume: true,
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 4, denomination: 6, type: "necrotic" })],
        },
      },
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
    },
    "Far Realm Shard": {
      type: "save",
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 6, type: "psychic" })],
        },
      },
    },
    "Iron Bands of Binding": {
      type: "attack",
      targetType: "creature",
      data: {
        attack: {
          ability: "dex",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        range: {
          value: 60,
          units: "ft",
        },
      },
    },
    "Needler Pistol": {
      type: "save",
      addItemConsume: true,
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 8, denomination: 4, type: "piercing" })],
        },
        target: {
          template: {
            count: "",
            contiguous: false,
            type: "cone",
            size: "15",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "",
            type: "creature",
            choice: false,
            special: "",
          },
          prompt: true,
        },
      },
    },
    "Oil of Sharpness": {
      type: "enchant",
      allowMagical: true,
    },
    "Paralysis Pistol": {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
    },
    "Potion of Healing": {
      type: "heal",
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "reaction",
      targetType: "creature",
      data: {
        healing: {
          number: 2,
          denomination: 4,
          bonus: "2",
          type: "healing",
        },
        range: {
          units: "touch",
        },
      },
    },
    "Potion of Healing (Greater)": {
      type: "heal",
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "reaction",
      targetType: "creature",
      data: {
        healing: {
          number: 4,
          denomination: 4,
          bonus: "4",
          type: "healing",
        },
        range: {
          units: "touch",
        },
      },
    },
    "Potion of Healing (Superior)": {
      type: "heal",
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "reaction",
      targetType: "creature",
      data: {
        healing: {
          number: 8,
          denomination: 4,
          bonus: "8",
          type: "healing",
        },
        range: {
          units: "touch",
        },
      },
    },
    "Potion of Healing (Supreme)": {
      type: "heal",
      addItemConsume: true,
      activationType: this.is2014 ? "action" : "reaction",
      targetType: "creature",
      data: {
        healing: {
          number: 10,
          denomination: 4,
          bonus: "20",
          type: "healing",
        },
        range: {
          units: "touch",
        },
      },
    },
    "Waterskin": {
      type: "utility",
      activationType: "special",
      addItemConsume: true,
    },
  };

  DOCUMENT_OVERRIDES = {
    "Iron Bands of Binding": {
      data: {
        "system.uses": {
          spent: 0,
          max: 1,
          recovery: [{
            period: "day",
            type: "recoverAll",
          }],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },
    "Needler Pistol": {
      "flags.ddbimporter.retainUseSpent": true,
      data: {
        "system.uses": {
          spent: 0,
          max: 10,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },
    "Paralysis Pistol": {
      data: {
        "flags.ddbimporter.retainUseSpent": true,
        "system.uses": {
          spent: 0,
          max: 6,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },
    "Potion of Healing (Greater)": {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": "Potion of Greater Healing",
      },
    },
    "Potion of Healing (Superior)": {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": "Potion of Superior Healing",
      },
    },
    "Potion of Healing (Supreme)": {
      data: {
        "flags.ddbimporter.dndbeyond.alternativeNames": "Potion of Supreme Healing",
      },
    },
    "Warrior's Passkey": {
      data: {
        "system.damage.base": {
          number: 1,
          denomination: 10,
          bonus: "",
          type: "force",
        },
      },
    },
    "Waterskin": {
      data: {
        "system.uses": {
          spent: 0,
          max: 4,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },

  };

  EFFECT_HINTS = {
    "Arcane Oil": {
      type: "enchant",
      magicalBonus: {
        makeMagical: false,
        bonus: "2",
      },
    },
    "Bead of Force": {
      type: "item",
      options: {
        transfer: false,
        description: "Trapped in a sphere of force!",
        durationRounds: 10,
        durationSeconds: 60,
      },
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
      magicalBonus: {
        bonus: "1",
      },
    },
    "Oil of Sharpness": {
      type: "enchant",
      magicalBonus: {
        bonus: "3",
      },
    },
    "Paralysis Pistol": {
      name: "Paralysis",
      type: "item",
      statuses: ["Paralyzed"],
      options: {
        transfer: false,
        description: "The target can repeat the save at the end of each os its turns.",
        durationRounds: 10,
        durationSeconds: 60,
      },
    },
  };

  DOCUMENT_STUB = {
    "Korolnor Scepter": {
      // scepter can be used as a regular club
      documentType: "weapon",
      parsingType: "weapon",
      stopDefaultActivity: true,
      replaceDefaultActivity: false,
      systemType: {
        value: "simpleM",
        baseItem: "club",
      },
      copySRD: {
        name: "Club",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.nfIRTECQIG81CvM4",
      },
    },
    "Needler Pistol": {
      documentType: "consumable",
      parsingType: "wonderous",
      systemType: {
        value: "trinket",
      },
    },
    "Paralysis Pistol": {
      documentType: "consumable",
      parsingType: "wonderous",
      systemType: {
        value: "trinket",
      },
    },
    "Warrior's Passkey": {
      documentType: "weapon",
      parsingType: "weapon",
      stopDefaultActivity: true,
      replaceDefaultActivity: false,
      systemType: {
        value: "martialM",
        baseItem: "longsword",
      },
      copySRD: {
        name: "Longsword +1",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.IPkf0XNowClwXnjQ",
      },
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Blood Fury Tattoo": [
      {
        constructor: {
          name: "Reactive Strike",
          type: "utility",
        },
        build: {
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ],
    "Iron Bands of Binding": [
      {
        constructor: {
          name: "Escape Check",
          type: "check",
        },
        build: {
          generateCheck: true,
          checkOverride: {
            associated: [],
            ability: "str",
            dc: {
              calculation: "",
              formula: "20",
            },
          },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ],
    "Donjon's Sundering Sphere": [
      {
        constructor: {
          name: "Isolating Smite: Save vs Banishment",
          type: "save",
        },
        build: {
          generateSave: true,
          generateUses: true,
          usesOverride: {
            max: 1,
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      },
    ],
  };
}
