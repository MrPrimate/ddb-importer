import { generateMultiplyChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
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
    },
    DOCUMENT_STUB: {},
  };

  //
  // Above this is 2014 Only Hints
  //
  //
  //
  //

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
    "Moon Sickle, +1": "Moon Sickle",
    "Moon Sickle, +2": "Moon Sickle",
    "Moon Sickle, +3": "Moon Sickle",
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
      },
    },
    "Arcane Oil": {
      type: "enchant",
    },
    "Armor of Invulnerability": {
      type: "utility",
      addItemConsume: true,
      targetType: "self",
      activationType: "action",
      data: {
        name: "Become Invulnerable!",
      },
    },
    "Bead of Force": {
      type: "save",
      addItemConsume: true,
    },
    "Blood Fury Tattoo": {
      type: "damage",
      addItemConsume: true,
    },
    "Boots of Speed": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Concussion Grenade": {
      data: {
        range: {
          value: "60",
          unit: "ft",
        },
      },
    },
    "Demon Armor": {
      type: "enchant",
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
    "Healer's Kit": {
      type: "utility",
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      data: {
        "range.units": "touch",
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
        range: {
          units: "touch",
        },
      },
    },
    "Stink Bomb": {
      targetType: "creature",
    },
    "Wand of Fireballs": {
      type: "save",
      addItemConsume: true,
      // addScalingMode: "scaling",
      data: {
        save: {
          ability: "dex",
          dc: {
            calculation: "",
            formula: "15",
          },
        },
        damage: {
          onSave: "half",
          parts: [foundry.utils.mergeObject(
            DDBBaseEnricher.basicDamagePart({ number: 8, denomination: 6, type: "fire" }),
            {
              scaling: {
                "mode": "whole",
                "number": 1,
                "formula": "",
              },
            },
          )],
        },
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        range: {
          value: "150",
          units: "ft",
        },
        target: {
          "affects": {
            "count": "",
            "type": "",
          },
          "template": {
            "contiguous": false,
            "type": "sphere",
            "size": "20",
            "units": "ft",
          },
        },
      },
    },
    "Wand of Magic Missiles": {
      type: "damage",
      addItemConsume: true,
      targetType: "creature",
      data: {
        damage: {
          onSave: "half",
          parts: [foundry.utils.mergeObject(
            DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 4, bonus: "3", type: "force" }),
            {
              scaling: {
                "mode": "whole",
                "number": null,
                "formula": "1d4 + 1",
              },
            },
          )],
        },
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        range: {
          value: "120",
          units: "ft",
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
    "Alchemist's Fire": {
      data: {
        "system.uses.autoDestroy": false,
      },
    },
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
    "Healer's Kit": {
      data: {
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
        "system.uses": {
          spent: 0,
          max: 10,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
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
      statuses: ["Burning"],
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
    "Armor of Invulnerability": {
      type: "item",
      name: "Invulnerable!",
      options: {
        transfer: false,
        description: "You are invincible!",
        durationRounds: 100,
        durationSeconds: 600,
      },
      changes: [
        generateUnsignedAddChange("bludgeoning", 20, "system.traits.di.value"),
        generateUnsignedAddChange("piercing", 20, "system.traits.di.value"),
        generateUnsignedAddChange("slashing", 20, "system.traits.di.value"),
        generateUnsignedAddChange("mgc", 20, "system.traits.di.bypasses"),
      ],
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
    "Belashyrra's Beholder Crown": {
      type: "item",
      changes: [
        generateUpgradeChange(120, 10, "system.attributes.senses.darkvision"),
      ],
    },
    "Boots of Speed": {
      type: "item",
      options: {
        transfer: false,
        durationSeconds: 600,
        durationRounds: 100,
      },
      data: {
        changes: [
          generateMultiplyChange(2, 20, "system.attributes.movement.walk"),
        ],
      },
    },
    "Bracers of Archery": {
      noCreate: true,
      changes: [
        {
          key: "system.bonuses.rwak.damage",
          value: "2",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    // "Demon Armor": {
    // previous DAE/Midi effect
    //   noCreate: true,
    //   changes: [
    //     {
    //       key: "items.Unarmed Strike.system.attack.bonus",
    //       value: "1",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "items.Unarmed Strike.system.damage.parts.0.0",
    //       value: "1d8+@mod+1",
    //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    //       priority: 20,
    //     },
    //     {
    //       key: "items.Unarmed Strike.system.properties.mgc",
    //       value: "true",
    //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    //       priority: 20,
    //     },
    //   ],
    // },
    "Demon Armor": {
      type: "enchant",
      descriptionHint: true,
      magicalBonus: {
        makeMagical: true,
        bonus: "1",
      },
      changes: [
        {
          key: "system.damage.base.number",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
        {
          key: "system.damage.base.denomination",
          value: "8",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
        {
          key: "system.damage.base.custom.enabled",
          value: "false",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
      data: {
        "restrictions.type": "weapon",
      },
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
      magicalBonus: {
        bonus: "1",
      },
    },
    "Dust of Sneezing and Choking": {
      type: "item",
      name: "Sneezing and Choking",
      options: {
        transfer: false,
        description: "You are &Reference[incapacitated]{incapacitated} and &Reference[suffocating]{suffocating}.",
      },
      statuses: ["Incapacitated", "Suffocating"], // ?
    },
    "Gnomengarde Grenade": {
      type: "item",
      options: {
        transfer: false,
      },
      statuses: ["Stunned"],
    },
    "Moon Sickle": {
      noCreate: true,
      changes: [
        {
          key: "system.bonuses.heal.damage",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "+ d4",
          priority: "20",
        },
      ],
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
          generateDamage: true,
          onSave: "half",
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ],
  };
}
