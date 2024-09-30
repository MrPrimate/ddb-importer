import { effectModules, generateATLChange, generateUpgradeChange } from "../../effects/effects.js";
import utils from "../../lib/utils.js";
import DDBFeatureActivity from "../features/DDBFeatureActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDBFeatureEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBFeatureActivity;
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  DND_2014 = {
    NAME_HINTS: {
      "Channel Divinity: Sacred Weapon": "Sacred Weapon",
      "Lay on Hands Pool": "Lay On Hands: Healing Pool",
    },
    ACTIVITY_HINTS: {
      "Breath Weapon (Acid)": {},
      "Breath Weapon (Cold)": {},
      "Breath Weapon (Fire)": {},
      "Breath Weapon (Lightning)": {},
      "Breath Weapon (Poison)": {},
      // "Celestial Revelation": {},
      "Eldritch Invocations: Ghostly Gaze": {
        type: "utility",
      },
      "Relentless": {},
    },
    ADDITIONAL_ACTIVITIES: {
      "Breath Weapon (Acid)": {},
      "Breath Weapon (Cold)": {},
      "Breath Weapon (Fire)": {},
      "Breath Weapon (Lightning)": {},
      "Breath Weapon (Poison)": {},
    },
    DOCUMENT_OVERRIDES: {
      "Breath Weapon (Acid)": {},
      "Breath Weapon (Cold)": {},
      "Breath Weapon (Fire)": {},
      "Breath Weapon (Lightning)": {},
      "Breath Weapon (Poison)": {},
      "Dark One's Own Luck": {},
      "Eldritch Invocations: Ghostly Gaze": {
        data: {
          "duration": {
            value: 1,
            units: "minute",
          },
          "system.uses": {
            value: this.ddbParser?.ddbData?.character.actions.class.find((a) => a.name === "Ghostly Gaze")?.limitedUse?.numberUsed ?? null,
            max: 1,
            recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
          },
        },
      },
    },
    EFFECT_HINTS: {
      "Sacred Weapon": {
        type: "enchant",
        name: "Sacred Weapon",
        magicalBonus: {
          makeMagical: true,
        },
        descriptionSuffix: `<br><p>[[/ddbifunc functionName="sacredWeaponLight" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`,
        changes: [
          {
            key: "attack.bonus",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: "@abilities.cha.mod",
            priority: 20,
          },
        ],
        options: {
          name: "Sacred Weapon",
          description: `The weapon shines with Sacred Energy.`,
          durationSeconds: 60,
        },
      },
    },
    DOCUMENT_STUB: {
      // "Celestial Revelation": {
      //   stopDefaultActivity: true,
      // },
    },
  };

  NAME_HINTS = {
    "Aura of Courage": "Aura of",
    "Aura Of Courage": "Aura of",
    "Aura of Protection": "Aura of",
    "Aura Of Protection": "Aura of",
    "Font of Magic: Convert Spell Slots": "Convert Sorcery Points",
    "Font Of Magic": "Font of Magic",
    "Interception": "Fighting Style: Interception",
    "Invoke Duplicity": "Channel Divinity: Invoke Duplicity",
    "Preserve Life": "Channel Divinity: Preserve Life",
    "Psychic Blades: Attack (DEX)": "Psychic Blades: Attack",
    "Psychic Blades: Attack (STR)": "Psychic Blades: Attack",
    "Psychic Blades: Bonus Attack (DEX)": "Psychic Blades: Bonus Attack",
    "Psychic Blades: Bonus Attack (STR)": "Psychic Blades: Bonus Attack",
    "Psychic Blades: Homing Strikes": "Soul Blades: Homing Strikes",
    "Psychic Blades: Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Psychic Blades": "Psychic Blades: Attack",
    "Psychic Teleportation": "Soul Blades: Psychic Teleportation",
    "Radiance of the Dawn": "Channel Divinity: Radiance of the Dawn",
    "Rage (Enter)": "Rage",
    "War God's Blessing": "Channel Divinity: War God's Blessing",
  };

  ACTIVITY_HINTS = {
    "Arcane Recovery": {
      type: "ddbmacro",
      data: {
        macro: {
          name: "Arcane Recovery",
          function: "ddb.feat.arcaneRecovery",
          visible: false,
          parameters: "",
        },
      },
    },
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        "attack.ability": "",
      },
    },
    "Arms of the Astral Self: Summon": {
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts", type: "force" })],
          onSave: "none",
        },
      },
    },
    "Bardic Inspiration": {
      targetType: "creature",
      addItemConsumed: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
        duration: {
          value: "10",
          units: "minutes",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    },
    "Beguiling Magic": {
      data: {
        name: "Save",
      },
    },
    "Blessed Healer": {
      type: "heal",
      activationType: "special",
      name: "Heal Self",
      targetType: "self",
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: {
          custom: {
            enabled: true,
            formula: "3",
          },
          types: ["healing"],
          scaling: {
            number: null,
            mode: "whole",
            formula: "1",
          },
        },
      },
    },
    "Breath Weapon (Acid)": {
      name: "Cone",
      type: "save",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "acid" })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    },
    "Breath Weapon (Cold)": {
      name: "Cone",
      type: "save",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "cold" })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    },
    "Breath Weapon (Fire)": {
      name: "Cone",
      type: "save",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "fire" })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    },
    "Breath Weapon (Lightning)": {
      name: "Cone",
      type: "save",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "lightning" })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    },
    "Breath Weapon (Poison)": {
      name: "Cone",
      type: "save",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "poison" })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    },
    "Celestial Revelation": {
      type: this.is2014 ? "utility" : "damage",
      noTemplate: true,
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", types: ["radiant", "necrotic"] }),
          ],
        },
      },
    },
    "Celestial Revelation (Heavenly Wings)": {
      type: "utility",
      activationType: "special",
    },
    "Celestial Revelation (Inner Radiance)": {
      type: "damage",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
          ],
        },
      },
    },
    "Celestial Revelation (Radiant Consumption)": {
      type: "damage",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
          ],
        },
      },
    },
    "Celestial Revelation (Radiant Soul)": {
      type: "damage",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: foundry.utils.getProperty(this.data, "flags.ddbimporter.type") === "class" ? "@abilities.cha.mod" : "@prof", type: "radiant" }),
          ],
        },
      },
    },
    "Celestial Revelation (Necrotic Shroud)": {
      type: "save",
      activationType: "special",
      targetType: "enemy",
    },
    "Channel Divinity: Preserve Life": {
      type: "heal",
      targetType: "ally",
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@classes.cleric.levels * 5",
          },
          types: ["healing"],
        },
      },
    },
    "Channel Divinity: Radiance of the Dawn": {
      type: "save",
      targetType: "enemy",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "2d10 + @classes.cleric.levels", type: "radiant" })],
        },
      },
    },
    "Charger": {
      type: "damage",
      targetType: "enemy",
      data: {
        name: "Charge Damage",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8 })],
        },
      },
    },
    "Combat Inspiration": {
      type: "utility",
      targetType: "creature",
      data: {
        name: "Defense",
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
      },
    },
    "Convert Sorcery Points": {
      type: "ddbmacro",
      data: {
        name: "Font of Magic",
        macro: {
          name: "Convert Sorcery Points/Spell Slots",
          function: "ddb.feat.fontOfMagic",
          visible: false,
          parameters: "",
        },
      },
    },
    "Cunning Action": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Cunning Strike": {
      type: "save",
      targetType: "creature",
      activationType: "spec",
      data: {
        name: "Poison",
        save: {
          ability: "con",
          dc: { calculation: "dex", formula: "" },
        },
        activation: {
          type: "",
          condition: "Dealing Sneak Attack damage",
        },
        duration: { units: "inst" },
      },
    },
    "Cutting Words": {
      targetType: "creature",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Subtraction Roll",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    },
    "Dark One's Blessing": {
      type: "heal",
      targetType: "self",
      data: {
        "activation.condition": "Reduce a hostile creature to 0 HP",
        healing: {
          custom: {
            enabled: true,
            formula: "@abilities.cha.mod + @classes.warlock.levels",
          },
          types: ["temphp"],
        },
      },
    },
    "Dark One's Own Luck": {
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll for your luck",
        },
      },
    },
    "Dazzling Footwork": {
      type: "enchant",
      targetType: "self",
      data: {
        name: "Bardic Damage",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    },
    "Deflect Missiles": {
      targetType: "self",
      data: {
        "consumption.targets": [],
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @mod + @classes.monk.levels",
          name: "Reduce Damage Amount",
        },
      },
    },
    "Deflect Missiles Attack": {
      activationType: "special",
      targetType: "creature",
      data: {
        "damage.parts": [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts + @mod", types: ["piercing", "slashing", "bludgeoning"] })],
      },
    },
    "Devious Strikes": {
      type: "save",
      targetType: "creature",
      activationType: "spec",
      data: {
        name: "Daze",
        save: {
          ability: "con",
          dc: { calculation: "dex", formula: "" },
        },
        activation: {
          type: "",
          condition: "Dealing Sneak Attack damage",
        },
        duration: { units: "inst" },
      },
    },
    "Divine Intervention": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d100",
          name: "Implore Aid",
        },
      },
    },
    "Eldritch Cannon: Flamethrower": {
      type: "save",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Ignites flammable objects.",
        },
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "fire" })],
        },
      },
    },
    "Eldritch Cannon: Force Ballista": {
      type: "attack",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "On hit pushed 5 ft away.",
        },
        range: {
          value: 120,
          units: "ft",
        },
        target: {},
        attack: {
          ability: "int",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "force" })],
        },
      },
    },
    "Eldritch Cannon: Protector": {
      type: "heal",
      targetType: "creature",
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "1d8 + @abilities.int.mod",
          },
          types: ["temphp"],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Eldritch Invocations: Lifedrinker": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic", "psychic", "radiant"] })],
        },
      },
    },
    "Eldritch Invocations: Pact of the Blade": {
      type: "enchant",
      data: {
        name: "Bond With Weapon",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    },
    "Empty Body": {
      targetType: "self",
    },
    "Expert Divination": {
      targetType: "self",
      type: "utility",
      noConsumeTargets: true,
      addConsumptionScalingMax: "5",
      additionalConsumptionTargets: [
        {
          "type": "spellSlots",
          "value": "-1",
          "target": "1",
          "scaling": {
            "mode": "level",
            "formula": "",
          },
        },
      ],
      data: {
        name: "Regain Spell Slot",
      },
    },
    "Fighting Style: Interception": {
      type: "utility",
      targetType: "creature",
      data: {
        target: {
          "affects.type": "creature",
          template: {},
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @prof",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Fire's Burn (Fire Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, type: "fire" })],
        },
      },
    },
    "Font of Magic": {
      type: "ddbmacro",
      data: {
        name: "Font of Magic",
        macro: {
          name: "Convert Sorcery Points/Spell Slots",
          function: "ddb.feat.fontOfMagic",
          visible: false,
          parameters: "",
        },
      },
    },
    "Form of the Beast: Tail": {
      noTemplate: true,
      data: {
        range: {
          value: 10,
          units: "ft",
        },
      },
    },
    "Full of Stars": {
      type: "utility",
      targetType: "self",
      activationType: "special",
    },
    "Genie's Vessel: Genie's Wrath (Dao)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "bludgeoning" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Djinni)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "thunder" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Efreeti)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "fire" })],
        },
      },
    },
    "Genie's Vessel: Genie's Wrath (Marid)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "cold" })],
        },
      },
    },
    "Giant's Might": {
      type: "utility",
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    },
    "Gift of the Chromatic Dragon: Chromatic Infusion": {
      type: "enchant",
      data: {
        name: "Chromatic Infusion",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    },
    "Guardian Armor: Defensive Field": {
      type: "heal",
      targetType: "self",
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@classes.artificer.levels",
          },
          types: ["temphp"],
        },
      },
    },
    "Hand of Healing": {
      type: "heal",
      targetType: "creature",
      data: {
        "range.units": "touch",
        "healing.custom.formula": "@scale.way-of-mercy.hand-of-healing + @abilities.wis.mod",
      },
    },
    "Hand of Harm": {
      type: "damage",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts", type: "necrotic" })],
        },
      },
    },
    "Harness Divine Power": {
      type: "utility",
      activationType: "bonus",
      addItemConsume: true,
    },
    "Healing Hands": {
      type: "heal",
      targetType: "creature",
      data: {
        // "range.units": "touch",
        healing: {
          custom: {
            enabled: true,
            formula: "(@prof)d4",
          },
          types: ["healing"],
        },
      },
    },
    "Healing Light": {
      type: "heal",
      addItemConsume: true,
      addScalingMode: "amount",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        healing: {
          number: 1,
          denomination: 6,
          custom: {
            enabled: false,
          },
          types: ["healing"],
          scaling: {
            number: 1,
            mode: "whole",
          },
        },
      },
    },
    "Hold Breath": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      data: {
        duration: {
          value: "15",
          units: "minute",
        },
      },
    },
    "Hound of Ill Omen": {
      type: "summon",
      noTemplate: true,
      profileKeys: ["HoundOfIllOmen"],
      summons: {
        "creatureSizes": ["med"],
        "creatureTypes": ["monstrosity"],
        "bonuses.hp": "floor(@classes.sorcerer.levels / 2)",
      },
    },
    "Imbue Aura of Protection": () => {
      if (effectModules().atlInstalled) {
        return {
          type: "utility",
          data: {
            name: "Use/Apply Light",
          },
        };
      } else {
        return {
          type: "ddbmacro",
          data: {
            name: "Use/Apply Light",
            macro: {
              name: "Apply Light",
              function: "ddb.generic.light",
              visible: false,
              parameters: '{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":0,"bright":20},"flag":"light"}',
            },
          },
        };
      }
    },
    "Inspiring Movement": {
      type: "utility",
      activationType: "reaction",
    },
    "Intimidating Presence": {
      // type: "save",
      targetType: "creature",
      data: {
        name: "Save",
        save: {
          ability: "wis",
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    },
    "Large Form": {
      type: "utility",
      activationType: "bonus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    },
    "Lay On Hands: Healing Pool": {
      type: "heal",
      name: "Healing",
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        healing: {
          custom: {
            enabled: true,
            formula: "1",
          },
          types: ["healing"],
          scaling: {
            number: null,
            mode: "whole",
            formula: "1",
          },
        },
      },
    },
    "Lay On Hands: Purify Poison": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "5",
    },
    "Magical Cunning": {
      targetType: "self",
      type: "utility",
      additionalConsumptionTargets: [
        {
          "type": "attribute",
          "value": "-(ceil(@spells.pact.max / 2))",
          "target": "spells.pact.value",
        },
      ],
      data: {
        name: "Regain Pact Slots",
      },
    },
    "Maneuver: Disarming Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Distracting Strike": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Goading Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "wis",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Lunging Attack": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Lunging Dash": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Menacing Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "wis",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Parry (Str.)": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.battle-master.combat-superiority-die",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Maneuver: Pushing Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Maneuver: Precision Attack": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.battle-master.combat-superiority-die",
          name: "Add to Attack Roll",
        },
      },
    },
    "Maneuver: Rally": {
      type: "heal",
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@scale.battle-master.combat-superiority-die",
          },
          types: ["temphp"],
        },
      },
    },
    "Maneuver: Riposte": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die" })],
        },
      },
    },
    "Maneuver: Sweeping Attack": {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die", types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    },
    "Maneuver: Tactical Assessment": {
      type: "check",
      data: {
        name: "Roll Check (Apply Effect First)",
        "flags.ddbimporter.noeffect": true,
        check: {
          associated: ["his", "inv", "ins"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    },
    "Maneuver: Trip Attack (Str.)": {
      type: "save",
      data: {
        damage: {
          onSave: "full",
        },
        save: {
          ability: "str",
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    },
    "Mantle of Inspiration": {
      type: "heal",
      data: {
        "description.chatFlavor": "Each creature can immediately use its reaction to move up to its speed, without provoking opportunity attacks.",
        "range.units": "self",
        target: {
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "60",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "@abilities.cha.mod",
            type: "ally",
            choice: true,
            special: "",
          },
          prompt: false,
        },
        healing: {
          custom: {
            enabled: true,
            formula: "2 * @scale.college-of-glamour.mantle-of-inspiration",
          },
          types: ["temphp"],
        },
      },
    },
    "Mind Link Response": {
      data: {
        range: {
          units: "spec",
          special: "Withing sight",
        },
      },
    },
    "Mystic Arcanum (Level 8 Spell)": {
      type: "none",
    },
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
    },
    "Pact Boon: Pact of the Talisman": {
      type: "utility",
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d4",
          name: "Roll Ability Check Bonus",
        },
      },
    },
    "Persistent Rage": {
      type: "utility",
      targetType: "self",
      data: {
        "range.units": "self",
      },
    },
    "Polearm Master - Bonus Attack": {
      type: "attack",
      activationType: "bonus",
      targetType: "creature",
      data: {
        "reach.value": "10",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] })],
        },
      },
    },
    "Psionic Power: Recovery": {
      data: {
        "consumption.targets": [{
          type: "itemUses",
          target: "", // adjusted later
          value: "-1",
        }],
      },
    },
    "Psionic Power: Psi-Bolstered Knack": {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.psionic-power",
          name: "Roll Additional Bonus",
        },
      },
    },
    "Psionic Power: Psychic Whispers": {
      data: {
        target: {
          affects: {
            count: "@prof",
            type: "ally",
            choice: true,
            special: "",
          },
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.psionic-power",
          name: "Hours active roll",
        },
      },
    },
    "Quickened Healing": {
      type: "heal",
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@item.monk.@scale.monk.martial-arts + @prof",
          },
          types: ["healing"],
        },
      },
    },
    "Rage": {
      targetType: "self",
      data: {
        "range.units": "self",
      },
    },
    "Raging Storm: Desert": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "floor(@classes.barbarian.levels / 2)", types: ["fire"] })],
        },
        target: {
          save: {
            ability: "dex",
            dc: {
              calculation: "con",
              formula: "",
            },
          },
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Raging Storm: Sea": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        "range.units": "self",
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Raging Storm: Tundra": {
      type: "save",
      activationType: "reaction",
      targetType: "creature",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "con",
            formula: "",
          },
        },
        "range.units": "self",
        target: {
          affects: {
            count: "1",
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
      },
    },
    "Regain Bardic Inspiration": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      addConsumptionScalingMax: "9",
      additionalConsumptionTargets: [
        {
          "type": "spellSlots",
          "value": "1",
          "target": "1",
          "scaling": {
            "mode": "level",
          },
        },
      ],
      data: {
        name: "Regain via Spell Slot",
      },
    },
    "Relentless": {
      type: "utility",
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d8",
          name: "Maneuver Roll",
        },
      },
    },
    "Relentless Rage": {
      type: "save",
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      data: {
        save: {
          ability: "con",
          dc: {
            calculation: "",
            formula: "10 + (@item.uses.spent * 5)",
          },
        },
      },
    },
    "Retaliation": {
      type: "utility",
      activationType: "reaction",
    },
    "Sacred Weapon": {
      type: "enchant",
      activationType: "special",
      noTemplate: true,
      targetType: "self",
    },
    "Second Wind": {
      type: "heal",
      func: undefined,
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: {
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
          scaling: {
            mode: "whole",
            number: null,
            formula: "",
          },
        },
      },
    },
    "Shielding Storm": {
      type: "utility",
      activationType: "special",
      data: {
        name: "Shielding Storm: Desert",
      },
    },
    "Shifting: Beasthide": {
      type: "heal",
      activationType: "bonus",
      targetSelf: true,
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "(@prof * 2) + 1d6",
          },
          types: ["temphp"],
        },
      },
    },
    "Shifting: Longtooth": {
      type: "heal",
      activationType: "bonus",
      targetSelf: true,
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@prof * 2",
          },
          types: ["temphp"],
        },
      },
    },
    "Shifting: Swiftstride": {
      type: "heal",
      activationType: "bonus",
      targetSelf: true,
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@prof * 2",
          },
          types: ["temphp"],
        },
      },
    },
    "Shifting: Wildhunt": {
      type: "heal",
      activationType: "bonus",
      targetSelf: true,
      data: {
        healing: {
          custom: {
            enabled: true,
            formula: "@prof * 2",
          },
          types: ["temphp"],
        },
      },
    },
    "Sneak Attack": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.rogue.sneak-attack", types: ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"] }),
          ],
        },
      },
    },
    "Song of Rest": {
      type: "heal",
      data: {
        duration: {
          value: "1",
          units: "hour",
        },
        healing: {
          custom: {
            enabled: true,
            formula: "@scale.bard.song-of-rest",
          },
          types: ["healing"],
        },
      },
    },
    "Soul Blades: Homing Strikes": {
      data: {
        img: "systems/dnd5e/icons/svg/damage/force.svg",
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.psionic-power",
          name: "Roll Attack Bonus",
        },
      },
    },
    "Soul Blades: Psychic Teleportation": {
      data: {
        img: "systems/dnd5e/icons/svg/trait-saves.svg",
      },
    },
    "Sorcerous Restoration": {
      type: "utility",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-(floor(@classes.sorcerer.levels / 2))",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    },
    "Starry Form": {
      type: "utility",
      noTemplate: true,
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Activate Starry Form",
      },
    },
    "Steel Defender": {
      noConsumeTargets: true,
      noTemplate: true,
    },
    "Steps of the Fey": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        name: "Refreshing Step",
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, types: ["temphp"] }),
      },
    },
    "Stone's Endurance": {
      type: "utility",
      activationType: "reaction",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d12 + @abilities.con.mod",
          name: "Reduce Damage Roll",
        },
      },
    },
    "Storm Soul: Dessert": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Sea": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Tundra": {
      type: "utility",
      activationType: "special",
    },
    "Storm Soul: Tundra - Freeze Water": {
      data: {
        target: {
          affects: {
            type: "space",
          },
          template: {
            contiguous: false,
            type: "cube",
            size: "5",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Desert": {
      type: "damage",
      activationType: "bonus",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.path-of-the-storm-herald.storm-aura-desert", types: ["fire"] })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Sea": {
      type: "save",
      activationType: "bonus",
      data: {
        "range.units": "self",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.path-of-the-storm-herald.storm-aura-sea", types: ["lightning"] })],
        },
        target: {
          save: {
            ability: "dex",
            dc: {
              calculation: "con",
              formula: "",
            },
          },
          affects: {
            count: "1",
            choice: true,
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    },
    "Storm Aura: Tundra": {
      type: "heal",
      activationType: "bonus",
      data: {
        "range.units": "self",
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        healing: {
          custom: {
            enabled: true,
            formula: "@scale.path-of-the-storm-herald.storm-aura-tundra",
          },
          types: ["temphp"],
        },
      },
    },
    "Stunning Strike": {
      type: "save",
      targetType: "creature",
      data: {
        "range.units": "touch",
        save: {
          ability: "con",
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    },
    "Superior Inspiration": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      data: {
        name: "Regain 1 Use",
      },
    },
    "Surprise Attack": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    },
    "Tactical Mind": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll Ability Check Bonus",
        },
      },
    },
    "Tandem Footwork": {
      type: "utility",
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Initiative bonus",
        },
      },
    },
    "The Third Eye": {
      type: "utility",
      targetType: "self",
      data: {
        name: "Darkvision",
      },
    },
    "Unbreakable Majesty": {
      type: "utility",
      data: {
        name: "Assume Unbreakable Majesty",
      },
    },
    "Uncanny Dodge": {
      type: "utility",
      activationType: "reaction",
    },
    "War Caster": {
      type: "utility",
      midiManualReaction: true,
    },
    "Wild Shape": {
      type: "utility",
      data: {
        duration: {
          value: "(floor(@classes.druid.levels / 2))",
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
    },
    "Wrath of the Storm": {
      data: {
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, types: ["thunder", "lightning"] })],
        },
      },
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Beguiling Magic": [
      {
        constructor: {
          name: "Recharge",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ],
    "Breath Weapon (Acid)": [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "acid" })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ],
    "Breath Weapon (Cold)": [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "cold" })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ],
    "Breath Weapon (Lightning)": [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "lightning" })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ],
    "Breath Weapon (Fire)": [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "fire" })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ],
    "Breath Weapon (Poison)": [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: "poison" })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ],
    "Combat Inspiration": [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.bard.bardic-inspiration" }),
          ],
        },
      },
    ],
    "Cunning Strike": [
      {
        constructor: {
          name: "Trip",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: "dex",
            dc: { calculation: "dex", formula: "" },
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Withdraw",
          type: "utility",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          noeffect: true,
          generateActivation: true,
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
        },
      },
      {
        constructor: {
          name: "Modified Sneak Attack Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
          activationOverride: {
            type: "spec",
            condition: "",
          },
          rangeOverride: {
            units: "spec",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          consumptionOverride: {
            scaling: {
              allowed: true,
              max: "@scale.rogue.sneak-attack.number",
            },
          },
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.rogue.sneak-attack.number - @scaling)d6", types: ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"] }),
          ],
        },
      },
    ],
    "Devious Strikes": [
      {
        constructor: {
          name: "Knock Out",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: "con",
            dc: { calculation: "dex", formula: "" },
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Obscure",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            value: "1",
            units: "min",
          },
          activationOverride: {
            type: "",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: "dex",
            dc: { calculation: "dex", formula: "" },
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Modified Sneak Attack Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
          activationOverride: {
            type: "spec",
            condition: "",
          },
          rangeOverride: {
            units: "spec",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
          consumptionOverride: {
            scaling: {
              allowed: true,
              max: "@scale.rogue.sneak-attack.number",
            },
          },
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.rogue.sneak-attack.number - @scaling)d6", types: ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"] }),
          ],
        },
      },
    ],
    "Eldritch Invocations: Lifedrinker": () => {
      return ["Smallest", "Largest"].map((size) => {
        return {
          constructor: {
            name: `Healing - ${size} Hit Die`,
            type: "heal",
          },
          build: {
            generateConsumption: true,
            generateTarget: false,
            targetSelf: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: false,
            generateHealing: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "Once per turn when you hit a creature with your pact weapon",
            },
            healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: `@attributes.hd.${size.toLowerCase()}Available + (max(1,@abilities.con.mod))`, type: "healing" }),
            consumptionOverride: {
              targets: [
                {
                  type: "hitDice",
                  target: size.toLowerCase(),
                  value: 1,
                  scaling: {
                    mode: "",
                    formula: "",
                  },
                },
              ],
              scaling: {
                allowed: false,
                max: "",
              },
            },
          },
        };
      });
    },
    "Form of the Beast: Bite": [
      {
        constructor: {
          name: "Healing Bonus (1/your turn)",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "healing" }),
        },
      },
    ],
    "Form of the Beast: Tail": [
      {
        constructor: {
          name: "Reactive Attack",
          type: "attack",
        },
        build: {
          noTemplate: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          generateAttack: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Giant's Might": [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6 })],
        },
      },
    ],
    "Intimidating Presence": [
      {
        constructor: {
          name: "Restore With Rage Use",
          type: "utility",
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ],
    "Imbue Aura of Protection": [
      {
        constructor: {
          name: "Aura Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@abilities.mod.cha + @prof", types: ["radiant"] })],
        },
      },
    ],
    "Lay On Hands: Healing Pool": [
      {
        constructor: {
          name: "Lay On Hands Macro",
          type: "ddbmacro",
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDDBMacro: true,
          ddbMacroOverride: {
            name: "Lay On Hands Macro",
            function: "ddb.feat.layOnHands",
            visible: false,
            parameters: "",
          },
        },
      },
    ],
    "Maneuver: Tactical Assessment": [
      {
        constructor: {
          name: "Bonus Dice Effect",
          type: "utility",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Psychic Blades: Attack": [
      {
        constructor: {
          name: "Bonus Action Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          includeBase: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "cha",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 4, type: "psychic" })],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
      },
    ],
    "Relentless Rage": [
      {
        constructor: {
          name: "Apply Healing",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          targetSelf: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.barbarian.levels * 2", type: "healing" }),
        },
      },
    ],
    "Shielding Storm": [
      {
        constructor: {
          name: "Shielding Storm: Sea",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateAttack: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Shielding Storm: Tundra",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateAttack: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Shifting: Longtooth": [
      {
        constructor: {
          name: "Longtooth Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "str",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "piercing" })],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
      },
    ],
    "Summon Wildfire Spirit": [
      {
        constructor: {
          name: "Wildfire Summoning Damage",
          type: "save",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          generateSave: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          saveOverride: {
            ability: "dex",
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          targetOverride: {
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
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, type: "fire" })],
        },
      },
    ],
    "The Third Eye": [
      {
        constructor: {
          name: "Greater Comprehension",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
      {
        constructor: {
          name: "See Invisibility",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
    ],
    "Starry Form": [
      {
        constructor: {
          name: "Archer Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "spellcasting",
            type: {
              classification: "spell",
              value: "range",
            },
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.circle-of-stars.starry-form + @mod", type: "radiant" })],
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Chalice Healing",
          type: "heal",
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: false,
          generateHealing: true,
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.circle-of-stars.starry-form + @mod", type: "healing" }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "30",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Dragon Constitution",
          type: "utility",
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: false,
          generateHealing: false,
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          rangeOverride: {
            units: "self",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
    ],
    "Steps of the Fey": [
      {
        constructor: {
          name: "Taunting Step",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    ],
    "Unbreakable Majesty": [
      {
        constructor: {
          name: "Save",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "spec",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
        },
      },
    ],
  };

  DOCUMENT_OVERRIDES = {
    "Action Surge": {
      removeDamage: true,
    },
    "Arcane Propulsion Armor Gauntlet": () => {
      return {
        data: {
          "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
        },
      };
    },
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        name: "Arms of the Astral Self",
      },
    },
    "Beguiling Magic": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save"],
          retainOriginalConsumption: true,
        },
      },
    },
    "Celestial Revelation (Inner Radiance)": {
      descriptionSuffix: `<br><p>[[/ddbifunc functionName="innerRadiance" functionType="feat"]]{Toggle Inner Radiance Light}</div></p>`,
    },
    "Combat Superiority": {
      data: {
        "system.uses.max": "@scale.battle-master.combat-superiority-uses",
      },
    },
    "Dark One's Own Luck": {
      data: {
        "system.uses.max": "@abilities.cha.mod",
      },
    },
    "Drake Companion": {
      data: {
        "system.uses.max": "",
        "system.uses.recovery": [],
      },
    },
    "Eldritch Cannon: Flamethrower": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Eldritch Cannon: Force Ballista": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Eldritch Cannon: Protector": {
      data: {
        "system.uses": { value: null, max: null },
      },
    },
    "Epic Boon: Choose an Epic Boon feat": {
      data: {
        "name": "Epic Boon",
      },
    },
    "Font of Magic: Convert Spell Slots": {
      data: {
        name: "Convert Spell Slots",
      },
    },
    "Font of Magic: Sorcery Points": {
      data: {
        "name": "Sorcery Points",
      },
    },
    "Form of the Beast: Bite": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Form of the Beast: Claws": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Form of the Beast: Tail": () => {
      return {
        data: {
          "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
            ? utils.addToProperties(this.data.system.properties, "mgc")
            : this.data.system.properties),
        },
      };
    },
    "Harness Divine Power": {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
      },
    },
    "Healing Light": {
      data: {
        "system.uses.max": "1 + @classes.warlock.levels",
      },
    },
    "Hypnotic Gaze": {
      data: {
        "system.uses": {
          value: null,
          max: null,
          recovery: [],
        },
      },
    },
    "Intimidating Presence": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save"],
          retainOriginalConsumption: true,
          retainChildUses: true,
        },
      },
    },
    "Ki Points": {
      data: {
        "system.uses.max": "@scale.monk.ki-points",
      },
    },
    "Large Form": () => {
      return {
        data: {
          "system.uses": {
            value: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Activate Large Form")?.limitedUse?.numberUsed ?? null,
            max: 1,
            recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
          },
        },
      };
    },
    "Lay on Hands Pool": {
      data: {
        name: "Lay On Hands",
      },
    },
    "Lay On Hands: Healing Pool": {
      data: {
        name: "Lay On Hands",
      },
    },
    "Maneuver: Disarming Attack (Str.)": {
      data: {
        name: "Maneuver: Disarming Attack",
      },
    },
    "Maneuver: Goading Attack (Str.)": {
      data: {
        name: "Maneuver: Goading Attack",
      },
    },
    "Maneuver: Menacing Attack (Str.)": {
      data: {
        name: "Maneuver: Menacing Attack",
      },
    },
    "Maneuver: Parry (Str.)": {
      data: {
        name: "Maneuver: Parry",
      },
    },
    "Maneuver: Pushing Attack (Str.)": {
      data: {
        name: "Maneuver: Pushing Attack",
      },
    },
    "Maneuver: Trip Attack (Str.)": {
      data: {
        name: "Maneuver: Trip Attack",
      },
    },
    "Partially Amphibious": {
      data: {
        "system.uses": {
          spent: 0,
          max: "1",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.midiProperties.toggleEffect": true,
      },
    },
    "Psychic Blades: Attack": () => {
      return {
        data: {
          name: "Psychic Blades",
          system: {
            mastery: "vex",
            range: {
              long: 120,
            },
            "type.value": "simpleM",
            properties: ["fin", "thr"].concat(this.data.system.properties ?? []),
          },
        },
      };
    },
    "Rage": {
      data: {
        name: "Rage",
        uses: {
          max: "@scale.barbarian.rage",
        },
      },
    },
    "Persistent Rage": {
      data: {
        "system.uses": {
          value: this.ddbParser?.ddbData?.character.actions.class.find((a) => a.name === "Rage: Regain Expended Uses")?.limitedUse?.numberUsed ?? null,
          max: 1,
          recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
        },
        "flags.ddbimporter": {
          retainOriginalConsumption: true,
          consumptionValue: "-@scale.barbarian.rage",
          retainChildUses: true,
        },
      },
    },
    "Relentless Rage": {
      data: {
        "system.uses": {
          spent: 0,
          max: "30",
          recovery: [
            {
              period: "lr",
              type: "recoverAll",
            },
          ],
        },
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
      },
    },
    "Shifting": {
      data: {
        "system.uses": {
          spent: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Shift")?.limitedUse?.numberUsed ?? null,
          max: "@prof",
        },
      },
    },
    "Shifting: Beasthide": {
      data: {
        "system.uses": {
          spent: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Shift")?.limitedUse?.numberUsed ?? null,
          max: "@prof",
        },
      },
    },
    "Shifting: Longtooth": {
      data: {
        "system.uses": {
          spent: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Shift")?.limitedUse?.numberUsed ?? null,
          max: "@prof",
        },
      },
    },
    "Shifting: Swiftstride": {
      data: {
        "system.uses": {
          spent: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Shift")?.limitedUse?.numberUsed ?? null,
          max: "@prof",
        },
      },
    },
    "Shifting: Wildhunt": {
      data: {
        "system.uses": {
          spent: this.ddbParser?.ddbData?.character.actions.race.find((a) => a.name === "Shift")?.limitedUse?.numberUsed ?? null,
          max: "@prof",
        },
      },
    },
    "Starry Form": {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Archer Attack", "Chalice Healing", "Dragon Constitution"],
      },
    },
    "Steel Defender": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
          recovery: [],
        },
      },
    },
    "Summon Wildfire Spirit: Command": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
        },
      },
    },
    "The Third Eye": {
      "system.uses": {
        spent: 0,
        max: "1",
        recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
      },
    },
    "Unbreakable Majesty": () => {
      const spent = this.ddbParser?.ddbData?.character.actions.class.find((a) =>
        a.name === "Assume Unbreakable Majesty",
      )?.limitedUse?.numberUsed ?? 0;
      return {
        data: {
          "system.uses": {
            spent,
            max: "1",
            recovery: [
              {
                period: "sr",
                type: "recoverAll",
              },
            ],
          },
        },
      };
    },
    "Wild Shape": {
      data: {
        "system.uses.max": "@scale.druid.wild-shape-uses",
      },
    },
  };

  EFFECT_HINTS = {
    "Aura of": () => {
      return {
        noCreate: true,
        data: {
          flags: {
            "dae.stackable": "noneName",
            ActiveAuras: {
              aura: "Allies",
              radius: `@scale.paladin.${this.data.name.toLowerCase().replaceAll(" ", "-")}`,
              isAura: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      };
    },
    "Bardic Inspiration": {
      type: "feat",
      options: {
        durationSeconds: 600,
      },
    },
    "Beguiling Magic": {
      multiple: [
        {
          name: "Frightened",
          type: "feat",
          options: {
            transfer: false,
          },
          statuses: ["Frightened"],
        },
        {
          name: "Charmed",
          type: "feat",
          options: {
            transfer: false,
          },
          statuses: ["Charmed"],
        },
      ],
    },
    "Celestial Revelation": {
      type: "feat",
      options: {
        transfer: false,
      },
    },
    "Celestial Revelation (Heavenly Wings)": {
      type: "feat",
      options: {
        transfer: false,
        durationSeconds: 60,
      },
      changes: [
        generateUpgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      ],
    },
    "Cunning Strike": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Poisoned",
          type: "feat",
          options: {
            transfer: false,
            durationSeconds: 60,
          },
          statuses: ["Poisoned"],
          data: {
            "flags.ddbimporter.activityMatch": "Poison",
          },
        },
        {
          name: "Prone",
          type: "feat",
          options: {
            transfer: false,
          },
          statuses: ["Prone"],
          data: {
            "flags.ddbimporter.activityMatch": "Trip",
          },
        },
      ],
    },
    "Dazzling Footwork": {
      clearAutoEffects: true,
      multiple: [
        {
          type: "feat",
          options: {
            transfer: true,
          },
          changes: [
            {
              key: "system.attributes.ac.calc",
              value: "unarmoredBard",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 10,
            },
          ],
          data: {
            "flags.ddbimporter.activityMatch": "No Activity",
          },
        },
        {
          type: "enchant",
          changes: [
            {
              key: "name",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: `{} [Dazzling Footwork]`,
              priority: 20,
            },
            {
              key: "system.damage.base.types",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: "bludgeoning",
              priority: 20,
            },
            {
              key: "system.ability",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: "dex",
              priority: 20,
            },
            {
              key: "system.damage.base.custom.enabled",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: "true",
              priority: 20,
            },
            {
              key: "system.damage.base.custom.formula",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: "@scale.college-of-dance.dazzling-footwork + @abilities.dex.mod",
              priority: 20,
            },
          ],
          data: {
            "flags.ddbimporter.activityMatch": "Bardic Damage",
          },
        },
      ],

    },
    "Devious Strikes": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Knocked Out",
          type: "feat",
          options: {
            transfer: false,
            durationSeconds: 60,
          },
          statuses: ["Unconscious"],
          data: {
            "flags.ddbimporter.activityMatch": "Knock Out",
          },
        },
        {
          name: "Blinded",
          type: "feat",
          options: {
            transfer: false,
          },
          statuses: ["Blinded"],
          data: {
            "flags.ddbimporter.activityMatch": "Obscure",
          },
        },
      ],
    },
    "Diamond Soul": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.diamondSoul",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Draconic Resilience": {
      type: "feat",
      noCreate: true,
      changesOverwrite: true,
      changes: [
        {
          key: "system.attributes.hp.bonuses.overall",
          value: "1 * @classes.sorcerer.levels",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 10,
        },
        {
          key: "system.attributes.ac.calc",
          value: "draconic",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 10,
        },
      ],
    },
    "Dual Wielder": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.enhancedDualWielding",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Eldritch Invocations: Pact of the Blade": {
      type: "enchant",
      changes: [
        {
          key: "name",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `{} [Pact Weapon]`,
          priority: 20,
        },
        {
          key: "system.damage.base.types",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "necrotic",
          priority: 20,
        },
        {
          key: "system.damage.base.types",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "psychic",
          priority: 20,
        },
        {
          key: "system.damage.base.types",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "radiant",
          priority: 20,
        },
        {
          key: "system.proficient",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "true",
          priority: 20,
        },
        {
          key: "system.ability",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "cha",
          priority: 20,
        },
      ],
    },
    "Elven Accuracy": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.elvenAccuracy",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Empty Body": {
      type: "feat",
      options: {
        durationSeconds: 60,
      },
      statuses: ["invisible"],
      changes: [
        { key: "system.traits.dr.value", value: "acid", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "bludgeoning", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "cold", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "fire", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "force", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "lightning", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "necrotic", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "piercing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "psychic", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "radiant", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "slashing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "thunder", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
      ],
    },
    "Full of Stars": {
      type: "feat",
      changes: [
        { key: "system.traits.dr.value", value: "bludgeoning", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "piercing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
        { key: "system.traits.dr.value", value: "slashing", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
      ],
    },
    "Giant's Might": {
      type: "feat",
      options: {
        durationSeconds: 60,
        description: "You also gain advantage on Strength checks and saving throws.",
        transfer: false,
      },
      atlChanges: [
        generateATLChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        generateATLChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
      ],
      changes: [
        {
          key: "system.traits.size",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "lg",
          priority: 25,
        },
      ],
    },
    "Gift of the Chromatic Dragon: Chromatic Infusion": {
      multiple: [
        { type: "acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
        { type: "cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
        { type: "fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
        { type: "lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
        { type: "poison", img: "icons/skills/toxins/poison-bottle-corked-fire-green.webp" },
      ].map((element) => {
        return {
          type: "enchant",
          name: `Chromatic Infusion: ${utils.capitalize(element.type)}`,
          data: {
            img: element.img,
          },
          changes: [
            {
              key: "name",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: `{} [Chromatic Infusion ${utils.capitalize(element.type)}]`,
              priority: 20,
            },
            {
              key: "system.damage.parts",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: `[["1d4", "${element.type}"]]`,
              priority: 20,
            },
          ],
        };
      }),
    },
    "Halfling Lucky": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.halflingLucky",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Hold Breath": {
      type: "feat",
      data: {
        "duration.rounds": 600,
      },
    },
    "Innate Sorcery": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.bonuses.spell.dc",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Imbue Aura of Protection": {
      multiple: () => {
        let effects = [];
        if (effectModules().atlInstalled) {
          effects.push({
            type: "feat",
            options: {
              transfer: false,
            },
            data: {
              "flags.ddbimporter.activityMatch": "Use/Apply Light",
            },
            atlChanges: [
              generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '@scale.paladin.aura-of-protection'),
              generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
              generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
            ],
          });
        }
      },
    },
    "Jack of All Trades": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.jackOfAllTrades",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Large Form": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.traits.size",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "lg",
          priority: 25,
        },
      ],
      atlChanges: [
        {
          key: "ATL.width",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 30,
          value: 2,
        },
        {
          key: "ATL.height",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 30,
          value: 2,
        },
      ],
    },
    "Maneuver: Ambush": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.init.bonus",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Maneuver: Bait and Switch": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.ac.bonus",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Maneuver: Evasive Footwork": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.ac.bonus",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    // Future Enhancement: Add a macro that rolls dice and applies dr effect
    // "Maneuver: Parry": {
    //   type: "feat",
    //   options: {
    //     transfer: false,
    //   },
    //   changes: [
    //     {
    //       key: "system.traits.dm.amount.bludgeoning",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "system.traits.dm.amount.piercing",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "system.traits.dm.amount.slashing",
    //       value: "-@scale.battle-master.combat-superiority-die",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //   ],
    // },
    "Maneuver: Tactical Assessment": {
      name: "Tactical Assessment Bonus",
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.skills.his.bonuses.check",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "system.skills.inv.bonuses.check",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "system.skills.ins.bonuses.check",
          value: "@scale.battle-master.combat-superiority-die",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Mindless Rage": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.traits.ci.value",
          value: "charmed",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
        {
          key: "system.traits.ci.value",
          value: "frightened",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Momentary Stasis": {
      type: "feat",
      options: {
        durationRounds: 1,
      },
      changes: [
        {
          key: "system.attributes.movement.walk",
          value: "0",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 90,
        },
        {
          key: "system.attributes.movement.all",
          value: "0",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 90,
        },
        {
          key: "system.attributes.movement.fly",
          value: "0",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 90,
        },
        {
          key: "system.attributes.movement.swim",
          value: "0",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 90,
        },
        {
          key: "system.attributes.movement.climb",
          value: "0",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 90,
        },
      ],
      statuses: ["incapacitated"],
    },
    "Observant": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.observantFeat",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Partially Amphibious": {
      type: "feat",
      data: {
        "duration.rounds": 600,
      },
    },
    "Patient Defense": {
      type: "feat",
      options: {
        name: "Dodge",
        label: "Dodge",
        durationRounds: 1,
      },
      statuses: ["dodging"],
    },
    "Powerful Build": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.powerfulBuild",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Rage": {
      name: "Rage",
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.bonuses.mwak.damage",
          value: "+ @scale.barbarian.rage",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 0,
        },
        {
          key: "system.traits.dr.value",
          value: "piercing",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 0,
        },
        {
          key: "system.traits.dr.value",
          value: "slashing",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "system.traits.dr.value",
          value: "bludgeoning",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "flags.midi-qol.advantage.ability.save.str",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          priority: 20,
        },
        {
          key: "flags.midi-qol.advantage.ability.check.str",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          priority: 20,
        },
        {
          key: "macro.tokenMagic",
          value: "outline",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          priority: 10,
        },
      ],
    },
    "Raging Storm: Tundra": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.movement.all",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: "*0",
          priority: "20",
        },
        {
          key: "system.attributes.movement.walk",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "0",
          priority: "60",
        },
        {
          key: "system.attributes.movement.fly",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "0",
          priority: "60",
        },
      ],
    },
    "Radiant Strikes": {
      noActivity: true,
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "system.bonuses.mwak.damage",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "1d8[radiant]",
          priority: "20",
        },
      ],
    },
    "Reckless Attack": {
      name: "Attacking Recklessly",
      type: "feat",
      options: {
        transfer: false,
      },
    },
    "Reliable Talent": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.reliableTalent",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Remarkable Athlete": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.remarkableAthlete",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "Sacred Weapon": {
      type: "enchant",
      name: "Sacred Weapon",
      magicalBonus: {
        makeMagical: true,
      },
      descriptionSuffix: `<br><p>[[/ddbifunc functionName="sacredWeaponLight2024" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`,
      changes: [
        {
          key: "attack.bonus",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "@abilities.cha.mod",
          priority: 20,
        },
        {
          key: "damage.base.types",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "radiant",
          priority: 20,
        },
      ],
      options: {
        name: "Sacred Weapon",
        description: `The weapon shines with Sacred Energy.`,
        durationSeconds: 600,
      },
    },
    "Shielding Storm": {
      multiple: [
        {
          name: "Shielding Storm: Desert",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            flags: {
              ddbimporter: {
                activityMatch: "Shielding Storm: Desert",
              },
              ActiveAuras: {
                aura: "Allies",
                radius: "10",
                isAura: true,
                ignoreSelf: true,
                inactive: false,
                hidden: false,
                displayTemp: true,
              },
            },
          },
          changes: [
            {
              key: "system.traits.dr.value",
              value: "fire",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        },
        {
          name: "Shielding Storm: Sea",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            flags: {
              ddbimporter: {
                activityMatch: "Shielding Storm: Sea",
              },
              ActiveAuras: {
                aura: "Allies",
                radius: "10",
                isAura: true,
                ignoreSelf: true,
                inactive: false,
                hidden: false,
                displayTemp: true,
              },
            },
          },
          changes: [
            {
              key: "system.traits.dr.value",
              value: "lightning",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        },
        {
          name: "Shielding Storm: Tundra",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            flags: {
              ddbimporter: {
                activityMatch: "Shielding Storm: Tundra",
              },
              ActiveAuras: {
                aura: "Allies",
                radius: "10",
                isAura: true,
                ignoreSelf: true,
                inactive: false,
                hidden: false,
                displayTemp: true,
              },
            },
          },
          changes: [
            {
              key: "system.traits.dr.value",
              value: "cold",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        },
      ],
    },
    "Shifting: Beasthide": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.ac.bonus",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Shifting: Swiftstride": {
      type: "feat",
      options: {
        transfer: false,
      },
      changes: [
        {
          key: "system.attributes.movement.walk",
          value: "10",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Shifting: Wildhunt": {
      type: "feat",
      options: {
        transfer: false,
      },
    },
    "Slasher": {
      type: "feat",
      options: {
        transfer: false,
      },
      name: "Slashed",
    },
    "Starry Form": {
      multiple: [
        {
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            flags: {
              ddbimporter: {
                activityMatch: "Activate Starry Form",
              },
            },
          },
          atlChanges: [
            generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '20'),
            generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '10'),
            generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#f3f5e5'),
            generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.35'),
            generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": ""starlight"", "speed": 5,"intensity": 5}'),
          ],
        },
        {
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            flags: {
              ddbimporter: {
                activityMatch: "Dragon Constitution",
              },
            },
          },
          changes: [],
        },
        {
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            name: "Dragon Form: Twinkling Constellations",
            flags: {
              ddbimporter: {
                activityMatch: "Dragon Constitution",
              },
            },
          },
          changes: [
            {
              key: "system.attributes.movement.fly",
              value: "20",
              mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
              priority: 20,
            },
          ],
        },
      ],
    },
    "Steps of the Fey": {
      type: "feat",
      options: {
        transfer: false,
        description: "Disadvantage on attack rolls against creatures other than caster until the start of the casters next turn",
      },
      name: "Taunted",
    },
    "Tavern Brawler": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "flags.dnd5e.tavernBrawlerFeat",
          value: "true",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 20,
        },
      ],
    },
    "The Third Eye": {
      multiple: [
        {
          name: "Darkvision",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            "flags.ddbimporter.activityMatch": "Darkvision",
          },
          changes: [
            {
              key: "system.attributes.senses.darkvision",
              value: "120",
              mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
              priority: 20,
            },
          ],
          atlChanges: [
            generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5),
            generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
          ],
        },
        {
          name: "Greater Comprehension",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            "flags.ddbimporter.activityMatch": "Greater Comprehension",
            description: "You can read any language",
          },
          changes: [
            {
              key: "system.traits.languages.special",
              value: ";Read Any Language",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        },
        {
          name: "See Invisibility",
          type: "feat",
          options: {
            transfer: false,
          },
          data: {
            "flags.ddbimporter.activityMatch": "See Invisibility",
          },
          changes: [
            {
              key: "system.attributes.senses.special",
              value: ";Invisible creatures",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
            {
              key: "system.attributes.senses.special",
              value: ";Ethereal Plane",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        },
      ],
    },
    "Tongue of the Sun and Moon": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "system.traits.languages.value",
          value: "standard:*",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "system.traits.languages.value",
          value: "exotic:*",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
        {
          key: "system.traits.languages.value",
          value: "ddb:*",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    "Unbreakable Majesty": {
      type: "feat",
      options: {
        transfer: false,
        durationSeconds: 60,
      },
      data: {
        "flags.ddbimporter.activityMatch": "Assume Unbreakable Majesty",
      },
    },
    "Unarmored Defense": {
      type: "feat",
      noCreate: true,
      changesOverwrite: true,
      changes: (data) => {
        const klass = foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.class");
        if (klass === "Barbarian") {
          return [
            {
              key: "system.attributes.ac.calc",
              value: "unarmoredBarb",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 15,
            },
          ];
        } else if (klass === "Monk") {
          return [
            {
              key: "system.attributes.ac.calc",
              value: "unarmoredMonk",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              priority: 15,
            },
          ];
        }
        return [];
      },
    },
    "War Caster": {
      type: "feat",
      options: {
        transfer: true,
      },
      changes: [
        {
          key: "system.attributes.concentration.roll.mode",
          value: "1",
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          priority: 10,
        },
      ],
    },
  };

  DOCUMENT_STUB = {

  };
}
