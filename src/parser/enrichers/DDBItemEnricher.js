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
    ACTIVITY_HINTS: {
      "Alchemist's Fire": {
        type: "attack",
        addItemConsume: true,
        targetType: "creature",
        data: {
          attack: {
            ability: "dex",
            type: {
              value: "ranged",
              classification: "weapon",
            },
          },
        },
      },
    },
    ADDITIONAL_ACTIVITIES: {
      "Alchemist's Fire": [
        {
          constructor: {
            name: "Damage",
            type: "damage",
          },
          build: {
            generateCheck: true,
            damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 4, type: "fire" })],
          },
        },
        {
          constructor: {
            name: "Estinquish Flames Check",
            type: "check",
          },
          build: {
            generateCheck: true,
            checkOverride: {
              associated: [],
              ability: "dex",
              dc: {
                calculation: "",
                formula: "10",
              },
            },
          },
        },
      ],
    },
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {
      "Alchemist's Fire": {
        type: "item",
        options: {
          transfer: false,
          description: "You are on fire, take [[/damage 1d4 fire]] at the start of your turn. You can use an action to distinguish with a [[/check dex 10]].",
        },
      },
      "Gnomengarde Grenade": {
        type: "item",
        options: {
          transfer: false,
          statuses: ["Stunned"],
        },
      },
    },
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
    "Alchemist's Fire (flask)": "Alchemist's Fire",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  ACTIVITY_HINTS = {
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
    "Acid": {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
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
    "Alchemist's Fire": {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
        save: {
          ability: "dex",
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, type: "acid" })],
        },
      },
    },
    "Arcane Oil": {
      type: "enchant",
    },
    "Bead of Force": {
      type: "save",
      addItemConsume: true,
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 5, denomination: 4, type: "force" })],
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
    "Bomb": {
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 6, type: "fire" })],
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
    "Gnomengarde Grenade": {
      data: {
        name: "Fire Damage",
        "flags.ddbimporter.noeffect": true,
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 8, denomination: 6, type: "fire" })],
        },
      },
    },
    "Iron Bands of Binding": {
      type: "attack",
      data: {
        attack: {
          bonus: "@prof",
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
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
    "Stink Bomb": {
      targetType: "creature",
    },
    "Waterskin": {
      type: "utility",
      activationType: "special",
      addItemConsume: true,
    },
  };

  DOCUMENT_OVERRIDES = {
    "Canaith Mandolin": {
      data: {
        "flags.magicitems": {
          charges: "1",
          chargeType: "c2",
          recharge: "1",
          rechargeType: "t1",
        },
      },
    },
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
    "Alchemist's Fire": {
      type: "item",
      // statuses: ["Burning"], // might this be added later?
      options: {
        transfer: false,
        description: "You are &Reference[Burning] take [[/damage 1d4 fire]] at the start of your turn.",
      },
    },
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
          generateTarget: false,
          generateRange: false,
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
          generateTarget: false,
          generateRange: false,
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
          generateTarget: false,
          generateRange: false,
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
    "Gnomengarde Grenade": [
      {
        constructor: {
          name: "Thunder Damage",
          type: "save",
        },
        build: {
          generateSave: true,
          onSave: "half",
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ],
  };
}
