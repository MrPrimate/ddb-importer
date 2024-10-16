import { effectModules, generateATLChange, generateCustomChange, generateDowngradeChange, generateOverrideChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import utils from "../../lib/utils.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";
import DDBFeatureActivity from "../features/DDBFeatureActivity.js";
import DDBHelper from "../../lib/DDBHelper.js";

export default class DDBFeatureEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBFeatureActivity;
    this.effectType = "feat";
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
      "Divine Intervention": {
        type: "utility",
        addItemConsume: true,
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "1d100",
            name: "Implore Aid",
          },
        },
      },
      // "Celestial Revelation": {},
      "Eldritch Invocations: Ghostly Gaze": {
        type: "utility",
      },
      "Relentless": {},
      "Channel Divinity": {},
      "Slow Fall": {},
    },
    ADDITIONAL_ACTIVITIES: {
      "Breath Weapon (Acid)": [],
      "Breath Weapon (Cold)": [],
      "Breath Weapon (Fire)": [],
      "Breath Weapon (Lightning)": [],
      "Breath Weapon (Poison)": [],
      "Channel Divinity": [],
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
      "Patient Defense": {
        name: "Patient Defense: Dodging",
        options: {
          durationRounds: 1,
          durationSeconds: 6,
        },
        statuses: ["dodging"],
        data: {
          "flags.ddbimporter.activitiesMatch": ["Patient Defense: Dodge"],
        },
      },
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
    // "War God's Blessing": "Channel Divinity: War God's Blessing",
    "Telekinetic Adept: Psi-Powered Leap": "Psionic Power: Psi-Powered Leap",
    "Telekinetic Adept: Telekinetic Thrust": "Psionic Power: Telekinetic Thrust",
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
    "Archdruid": {
      type: "utility",
      name: "Regain A Wild Shape Use",
      activationType: "special",
      condition: "When you roll initiative and have no Wild Shape uses remaining",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    },
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        "attack.ability": "",
      },
    },
    "Arms of the Astral Self: Summon": {
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die", type: "force" })],
          onSave: "none",
        },
      },
    },
    "Aspect of the Wilds": {
      type: "utility",
      targetType: "self",
      name: "Owl",
      activationType: "special",
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
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    },
    "Blessed Strikes: Divine Strike": {
      type: "damage",
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.cleric.divine-strike", types: ["radiant", "necrotic"] })],
        },
      },
    },
    "Branches of the Tree": {
      type: "save",
      activationType: "reaction",
      data: {
        save: {
          ability: "str",
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            value: "1",
          },
        },
        range: {
          value: "30",
          units: "ft",
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
    "Brutal Strike": {
      type: "damage",
      name: "Forceful Blow",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
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
    "Celestial Revelation (Radiant Soul)": () => {
      return {
        type: "damage",
        activationType: "special",
        data: {
          damage: {
            parts: [
              DDBBaseEnricher.basicDamagePart({ customFormula: foundry.utils.getProperty(this.data, "flags.ddbimporter.type") === "class" ? "@abilities.cha.mod" : "@prof", type: "radiant" }),
            ],
          },
        },
      };
    },
    "Celestial Revelation (Necrotic Shroud)": {
      type: "save",
      activationType: "special",
      targetType: "enemy",
    },
    "Channel Divinity": {
      type: "heal",
      name: "Divine Spark (Healing)",
      targetType: "creature",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "(ceil(@classes.cleric.levels/6))d8", types: ["healing"] }),
        range: {
          value: "30",
          units: "ft",
        },
      },
    },
    "Channel Divinity: Preserve Life": {
      type: "heal",
      targetType: "ally",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.cleric.levels * 5", types: ["healing"] }),
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
        target: {
          template: {
            value: "30",
            units: "ft",
            type: "radius",
          },
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
    "Cloud's Jaunt (Cloud Giant)": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
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
    "Corona of Light": () => {
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
              parameters: '{"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":60,"bright":30},"flag":"light"}',
            },
          },
        };
      }
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@abilities.cha.mod + @classes.warlock.levels", types: ["temphp"] }),
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
    "Deflect Attack": {
      name: "Reduce Damage",
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBBaseEnricher.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    },
    "Deflect Attack: Redirect Attack": {
      name: "Redirect Attack",
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      type: "save",
      data: {
        save: {
          ability: "dex",
          dc: { calculation: "dex", formula: "" },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "2@scale.monk.martial-arts.die + @abilities.dex.mod", types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    },
    "Deflect Energy": {
      type: "none",
    },
    "Deflect Missiles": {
      targetType: "self",
      type: "heal",
      data: {
        "consumption.targets": [],
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBBaseEnricher.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    },
    "Deflect Missiles Attack": {
      activationType: "special",
      targetType: "creature",
      data: {
        "damage.parts": [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @abilities.dex.mod", types: DDBBaseEnricher.allDamageTypes() })],
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
    "Disciple of Life": {
      type: "heal",
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    },
    "Disciplined Survivor": {
      type: "utility",
      targetType: "self",
    },
    "Divine Intervention": {
      type: "utility",
      addItemConsume: true,
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
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, bonus: "@abilities.int.mod", types: ["temphp"] }),
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
    "Elemental Fury: Primal Strike": {
      type: "damage",
      targetType: "creature",
      activationOverride: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.druid.elemental-fury", types: ["cold", "fire", "lighting", "thunder"] })],
        },
      },
    },
    "Empowered Strikes": {
      type: "attack",
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "weapon",
          },
        },
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @mod", types: ["bludgeoning", "force"] })],
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
    "Frenzy": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d6" })],
        },
      },
    },
    "Frost's Chill (Frost Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "cold" })],
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
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "@classes.artificer.levels", types: ["temphp"] }),
      },
    },
    "Guided Strike": {
      name: "Self",
      type: "utility",
      targetType: "self",
      activationType: "special",
      condition: "When you miss with an attack",
    },
    "Greater Divine Intervention": {
      type: "utility",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "2d4",
          name: "Long rests till next intervention",
        },
      },
    },
    "Hand of Healing": {
      name: "Hand of Healing",
      type: "heal",
      activationType: "special",
      targetType: "creature",
      data: {
        "range.units": "touch",
        "healing.custom.formula": "@scale.mercy.hand-of-healing + @abilities.wis.mod",
      },
    },
    "Hand of Harm": {
      name: "Hand of Harm",
      type: "damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die", type: "necrotic" })],
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "(@prof)d4", types: ["healing"] }),
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
        healing: DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, bonus: "3", types: ["healing"], scalingMode: "whole", scalingNumber: "1" }),
      },
    },
    "Heightened Focus": {
      name: "Patient Defense Healing",
      type: "heal",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "2@scale.monk.martial-arts.die", types: ["temphp"] }),
      },
    },
    "Hill's Tumble (Hill Giant)": {
      type: "utility",
      targetType: "creature",
      activationType: "special",
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
    "Improved Brutal Strike": {
      type: "damage",
      targetType: "creature",
      name: "Staggering Blow",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" })],
        },
      },
    },
    "Improved Blessed Strikes: Potent Spellcasting": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@abilities.wis.mod * 2", types: ["temphp"] }),
        range: {
          value: "60",
          units: "ft",
        },
      },
    },
    "Improved Duplicity": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.cleric.levels", types: ["healing"] }),
      },
    },
    "Improved Warding Flare": {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, bonus: "@abilities.wis.mod", types: ["temphp"] }),
        range: {
          value: "60",
          units: "ft",
        },
      },
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
    "Invoke Duplicity": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    },
    "Land's Aid": {
      type: "save",
      name: "Save vs Thorn Damage",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.land.lands-aid", types: ["necrotic"] })],
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
        healing: DDBBaseEnricher.basicDamagePart({ bonus: "1", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    },
    "Lay On Hands: Purify Poison": {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "5",
    },
    "Lucky": {
      type: "utility",
      name: "Spend Luck Point",
      activationType: "special",
      addItemConsume: true,
    },
    "Lunar Form": {
      type: "damage",
      name: "Lunar Radiance Damage",
      activationType: "special",
      condition: "Once per turn, on hit, whilst in Wild Shape",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 10, type: "radiant" })],
        },
      },
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.battle-master.combat-superiority-die", types: ["temphp"] }),
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "2 * @scale.college-of-glamour.mantle-of-inspiration", types: ["temphp"] }),
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
    "Moonlight Step": {
      name: "Transport",
      type: "utility",
      targetType: "self",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Mystic Arcanum (Level 8 Spell)": {
      type: "none",
    },
    "Natural Recovery": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Natural Recovery: Cast Circle Spell",
        max: "1",
        period: "1r",
      });

      return {
        type: "utility",
        name: "Cast Circle Spell",
        addActivityConsume: true,
        data: {
          uses,
        },
      };
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
    "Patient Defense": () => {
      const result = {
        name: this.is2014 ? "Patient Defense: Dodge" : "Patient Defense: Disengage",
        targetType: "self",
        type: "utility",
      };
      return result;
    },
    "Perfect Focus": {
      type: "ddbmacro",
      data: {
        name: "Recover Focus",
        macro: {
          name: "Reecover Focus",
          function: "ddb.feat.perfectFocus",
          visible: false,
          parameters: "",
        },
      },
    },
    "Persistent Rage": {
      type: "utility",
      targetType: "self",
      activationType: "special",
      data: {
        "range.units": "self",
      },
    },
    "Poisoner": {
      type: "utility",
      name: "Brew Poisons",
      addItemConsume: true,
      itemConsumeValue: "-@prof",
      data: {
        "flags.ddbimporter.noeffect": true,
        img: "systems/dnd5e/icons/svg/items/consumable.svg",
        duration: {
          value: "1",
          units: "hour",
        },
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
    "Power of the Wilds": {
      type: "utility",
      targetType: "self",
      name: "Falcon",
      activationType: "special",
    },
    "Psionic Power": () => {
      const formula = `1(@scale.${DDBHelper.classIdentifierName(this.ddbParser.subKlass)}.energy-die.die)`;
      const result = {
        name: "",
        type: "utility",
        addItemConsume: true,
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula,
            name: "Roll Bonus",
          },
        },
      };

      if (this.ddbParser.subKlass === "Soulknife") {
        result.name = "Psi-Bolstered Knack";
      } else {
        result.name = "Protective Field";
        result.activationType = "reaction";
        result.targetType = "creature";
        result.data.range = {
          units: "ft",
          value: "30",
        };
      }
      return result;

    },
    "Psionic Power: Recovery": () => {
      return {
        name: "Recovery",
        addActivityConsume: true,
        addItemConsume: true,
        itemConsumeValue: "-1",
        data: {
          uses: this._getUsesWithSpent({ type: "class", name: "Psionic Power: Recovery", max: 1, period: "lr" }),
        },
      };
    },
    "Psionic Power: Psi-Bolstered Knack": {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Additional Bonus",
        },
      },
    },
    "Psionic Power: Psychic Whispers": {
      name: "Psychic Whispers",
      addItemConsume: true,
      addSingleFreeUse: true,
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
          formula: "@scale.soulknife.energy-die.die",
          name: "Hours active roll",
        },
      },
    },
    "Psionic Power: Psi-Powered Leap": {
      name: "Psi-Powered Leap",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
    },
    "Psionic Power: Telekinetic Thrust": {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    },
    "Psionic Power: Telekinetic Movement": {
      name: "Telekinetic Movement",
      type: "utility",
      targetType: "creature",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Psionic Power: Psionic Strike": {
      name: "Psionic Strike",
      activationType: "special",
      type: "damage",
      targetType: "creature",
      addItemConsume: true,
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.psi-warrior.energy-die.die + @abilities.mod.int", types: ["psychic"] })],
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    },
    "Quickened Healing": {
      type: "heal",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die + @prof", types: ["healing"] }),
      },
    },
    "Rage": () => {
      return {
        targetType: "self",
        data: {
          "range.units": "self",
          duration: this.is2014
            ? { units: "second", value: "60" }
            : { units: "minute", value: "10" },
        },
      };
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
    "Rend Mind": () => {
      if (this.is2014) {
        return {
          addItemConsume: true,
        };
      } else {
        return {
          addItemConsume: true,
          data: {
            save: {
              dc: { formula: "", calculation: "dex" },
              ability: "wis",
            },
          },
        };
      }
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
    "Sear Undead": {
      type: "damage",
      targetType: "creature",
      activationType: "special",
      condition: "When you Turn Undead",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@abilities.wis.mod)d8", types: ["radiant"] })],
        },
      },
    },
    "Second Wind": {
      type: "heal",
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: "1", denomination: "10", bonus: "@classes.fighter.levels", types: ["healing"] }),
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
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "(@prof * 2) + 1d6", types: ["temphp"] }),
      },
    },
    "Shifting: Longtooth": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Shifting: Swiftstride": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Shifting: Wildhunt": {
      type: "heal",
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@prof * 2", types: ["temphp"] }),
      },
    },
    "Slow Fall": {
      type: "heal",
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.sorcerer.levels", types: ["healing"] }),
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
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.rogue.sneak-attack", types: DDBBaseEnricher.allDamageTypes() }),
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.bard.song-of-rest", types: ["healing"] }),
      },
    },
    "Soul Blades: Homing Strikes": {
      name: "Homing Strikes",
      data: {
        img: "systems/dnd5e/icons/svg/damage/force.svg",
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die",
          name: "Roll Attack Bonus",
        },
      },
    },
    "Soul Blades: Psychic Teleportation": {
      name: "Psychic Teleportation",
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
    "Stonecunning": {
      name: "Activate Tremorsense",
      type: "utility",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
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
    "Stone's Endurance (Stone Giant)": {
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
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.storm-herald.storm-aura-desert", types: ["fire"] })],
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
          parts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.storm-herald.storm-aura-sea", types: ["lightning"] })],
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.path-of-the-storm-herald.storm-aura-tundra", types: ["temphp"] }),
      },
    },
    "Storm's Thunder (Storm Giant)": {
      type: "damage",
      targetType: "creature",
      activationType: "reaction",
      data: {
        damage: {
          parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, type: "thunder" })],
        },
      },
    },
    "Stunning Strike": {
      type: "save",
      targetType: "creature",
      activationType: "special",
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
    "Survivor": {
      name: "Heroic Rally",
      type: "heal",
      targetType: "self",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "5 + @abilities.con.mod", types: ["healing"] }),
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
    "Telekinetic Master": {
      type: "utility",
      name: "Spend Energy Die to Regain Use",
      addItemConsume: true,
      activationType: "",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    },
    "The Third Eye": {
      type: "utility",
      targetType: "self",
      data: {
        name: "Darkvision",
      },
    },
    "Travel along the Tree": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Teleport 60 ft",
        range: {
          value: "60",
          units: "ft",
          special: "",
        },
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
    "Uncanny Metabolism": {
      type: "heal",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-@scale.monk.focus-points",
      additionalConsumptionTargets: [
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
    "Vitality of the Tree": {
      type: "heal",
      name: "Vitality Surge",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      condition: "You enter a rage.",
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "@classes.barbarian.levels", types: ["temphp"] }),
      },
    },
    "War Bond": {
      name: "Summon Weapon",
      type: "utility",
      activationType: "bonus",
      targetType: "self",
      data: {
        "flags.ddbimporter.noeffect": true,
      },
    },
    "War Caster": {
      type: "utility",
      midiManualReaction: true,
    },
    "War God's Blessing": {
      type: "utility",
    },
    "War Priest": {
      type: "utility",
    },
    "Wild Resurgence": {
      type: "utility",
      name: "Spend Spell Slot for Wild Shape Use",
      addItemConsume: true,
      itemConsumeValue: "-1",
      activationType: "special",
      condition: "Once on each of your turns",
      data: {
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "1",
          target: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
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
    "Wrath of the Sea": {
      name: "Activate Emination/Aura",
      type: "utility",
      targetType: "self",
      activationType: "bonus",
      data: {
        target: {
          template: {
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
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
    "Archdruid": () => {
      return [
        {
          constructor: {
            name: "Nature Magician",
            type: "utility",
          },
          build: {
            generateConsumption: true,
            generateRange: true,
            generateTarget: true,
            generateUses: true,
            activationOverride: {
              units: "",
            },
            usesOverride: this._getUsesWithSpent({ type: "class", name: "Nature Magician", max: 1, period: "lr" }),
            consumptionOverride: {
              targets: [
                {
                  type: "itemUses",
                  target: "",
                  value: "1",
                  scaling: { mode: "amount", formula: "" },
                },
                {
                  type: "activityUses",
                  target: "",
                  value: "1",
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "spellSlots",
                  value: "-1",
                  target: "2",
                  scaling: {
                    mode: "level",
                    formula: "2",
                  },
                },
              ],
              scaling: {
                allowed: true,
                max: "@scale.druid.wild-shape-uses",
              },
              spellSlot: true,
            },
            targetOverride: {
              affects: {
                type: "self",
              },
            },
            rangeOverride: {
              units: "self",
            },
          },
        },
      ];
    },
    "Aspect of the Wilds": [
      {
        constructor: {
          name: "Panther",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
      {
        constructor: {
          name: "Salmon",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      },
    ],
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
    "Brutal Strike": [
      {
        constructor: {
          name: "Hamstrung Blow",
          type: "damage",
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" }),
          ],
        },
      },
    ],
    "Channel Divinity": [
      {
        constructor: {
          name: "Divine Spark (Save vs Damage)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: {
            ability: "con",
            dc: { calculation: "wis", formula: "" },
          },
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "(ceil(@classes.cleric.levels/6))d8", types: ["radiant", "necrotic"] }),
          ],
          onSave: "half",
          rangeOverride: {
            units: "ft",
            value: "30",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Turn Undead",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: {
            ability: "wis",
            dc: { calculation: "wis", formula: "" },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: true,
              special: "Undead Creatures of your choice",
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
    "Deflect Attacks": () => {
      return [
        { action: { name: "Deflect Attack", type: "class" } },
        { action: { name: "Deflect Attack: Redirect Attack", type: "class" } },
      ];
    },
    "Deflect Energy": () => {
      return [
        { action: { name: "Deflect Attack", type: "class" } },
        {
          action: { name: "Deflect Attack: Redirect Attack", type: "class" },
          override: { data: {
            "damage.types": DDBBaseEnricher.allDamageTypes(),
          } },
        },
      ];
    },
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
    "Guided Strike": [
      {
        constructor: {
          name: "Other",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "ally",
              value: 1,
            },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
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
    "Invoke Duplicity": [
      {
        constructor: {
          name: "Move Duplicate",
          type: "utility",
        },
        build: {
          generateConsumption: false,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            units: "ft",
            value: "120",
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
    "Improved Brutal Strike": [
      {
        constructor: {
          name: "Staggering Blow",
          type: "damage",
        },
        build: {
          generateActivation: true,
          generateDamage: true,
          damageParts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.barbarian.brutal-strike" }),
          ],
        },
      },
    ],
    "Ki": () => {
      const results = [
        { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
        { action: { name: "Patient Defense", type: "class" } },
        { action: { name: "Step of the Wind", type: "class", rename: ["Step of the Wind"] }, overrides: { addItemConsume: true } },
      ];
      return results;
    },
    "Land's Aid": [
      {
        constructor: {
          name: "Healing",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.land.lands-aid", types: ["healing"] }),
          targetOverride: {
            affects: {
              type: "ally",
              value: 1,
            },
            template: {
              count: "",
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
    "Monk's Focus": () => {
      const results = [
        { action: { name: "Flurry of Blows", type: "class", rename: ["Flurry of Blows"] }, overrides: { addItemConsume: true } },
        { action: { name: "Patient Defense", type: "class" } },
        { action: { name: "Step of the Wind", type: "class", rename: ["Step of the Wind"] }, overrides: { addItemConsume: true } },
      ];
      return results;
    },
    "Natural Recovery": () => {
      return [
        {
          constructor: {
            name: "Recover Spell Slots",
            type: "ddbmacro",
          },
          build: {
            generateConsumption: true,
            generateRange: true,
            generateTarget: true,
            generateUses: true,
            generateDDBMacro: true,
            usesOverride: this._getUsesWithSpent({ type: "class", name: "Natural Recovery: Recover Spell Slots", max: 1, period: "lr" }),
            targetOverride: {
              affects: {
                type: "self",
              },
            },
            rangeOverride: {
              units: "self",
            },
            consumptionOverride: {
              targets: [
                {
                  type: "activityUses",
                  target: "",
                  value: "1",
                  scaling: { mode: "", formula: "" },
                },
              ],
              scaling: { allowed: false, max: "" },
            },
            ddbMacroOverride: {
              name: "Natural Recovery",
              function: "ddb.feat.naturalRecovery",
              visible: false,
              parameters: "",
            },
          },
        },
      ];
    },
    "Patient Defense": () => {
      if (this.is2014) return [];
      return [
        {
          duplicate: true,
          overrides: {
            addItemConsume: true,
            data: { name: "Patient Defense: Disengage & Dodge" },
          },
        },
      ];
    },
    "Physician's Touch": () => {
      return [
        { action: { name: "Hand of Healing", type: "class", rename: ["Hand of Healing"] } },
        { action: { name: "Hand of Harm", type: "class", rename: ["Hand of Harm"] } },
      ];
    },
    "Poisoner": () => {
      const results = [{
        constructor: {
          name: "Apply Poison",
          type: "utility",
        },
        build: {
          img: "icons/skills/toxins/poison-bottle-corked-fire-green.webp",
          generateConsumption: true,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              value: 1,
            },
          },
          consumptionOverride: {
            targets: [{
              type: "itemUses",
              target: "",
              value: 1,
              scaling: {
                mode: "",
                formula: "",
              },
            }],
            scaling: { allowed: false, max: "" },
          },
        },
      }];
      if (this.is2014) {
        results.push({
          constructor: {
            name: "Poison Save",
            type: "save",
          },
          build: {
            generateConsumption: false,
            generateTarget: true,
            generateSave: true,
            generateRange: false,
            generateActivation: true,
            generateDamage: true,
            activationOverride: {
              type: "special",
              value: 1,
              condition: "",
            },
            damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
            saveOverride: {
              ability: "con",
              dc: {
                formula: "14",
                calculation: "",
              },
            },
          },
        });
      } else {
        results.push(
          {
            constructor: {
              name: "Poison Save (Dexterity)",
              type: "save",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              generateSave: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: true,
              activationOverride: {
                type: "special",
                value: 1,
                condition: "",
              },
              damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
              saveOverride: {
                ability: "con",
                dc: {
                  formula: "",
                  calculation: "dex",
                },
              },
            },
          },
          {
            constructor: {
              name: "Poison Save (Intelligence)",
              type: "save",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              generateSave: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: true,
              activationOverride: {
                type: "special",
                value: 1,
                condition: "",
              },
              damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "poison" })],
              saveOverride: {
                ability: "con",
                dc: {
                  formula: "",
                  calculation: "int",
                },
              },
            },
          },
        );
      }

      return results;
    },
    "Power of the Wilds": [
      {
        constructor: {
          name: "Lion",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
        },
      },
      {
        constructor: {
          name: "Ram",
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creature",
            },
          },
        },
      },
    ],
    "Psionic Power": () => {
      const results = [];
      if (this.ddbParser.subKlass === "Soulknife") {
        results.push(
          { action: { name: "Psionic Power: Psychic Whispers", type: "class" } },
        );
      } else {
        results.push(
          { action: { name: "Psionic Power: Psionic Strike", type: "class" } },
          { action: { name: "Psionic Power: Telekinetic Movement", type: "class" } },
        );
      }

      if (this.is2014) {
        results.push({
          action: { name: "Psionic Power: Recovery", type: "class" },
        });
      }
      return results;
    },
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
    // "Rend Mind": () => {
    //   return this.is2014
    //     ? [

    //     ]
    //     : [
    //       { action: { name: "Psychic Blades: Rend Mind", type: "class" } },
    //     ];
    // },
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
    "Soul Blades": () => {
      return this.is2014
        ? [
          { action: { name: "Soul Blades: Homing Strikes", type: "class" } },
          { action: { name: "Soul Blades: Psychic Teleportation", type: "class" } },
        ]
        : [
          { action: { name: "Psychic Blades: Homing Strikes", type: "class" } },
          { action: { name: "Psychic Teleportation", type: "class" } },
        ];
    },
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
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.stars.starry-form + @mod", type: "radiant" })],
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
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@scale.stars.starry-form + @mod", type: "healing" }),
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
    "Travel along the Tree": [
      {
        constructor: {
          name: "Group Teleport",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateActivation: true,
          targetOverride: {
            affects: {
              count: "7",
              type: "willing",
              special: "Within 10 feet of you.",
            },
          },
          rangeOverride: {
            value: "150",
            units: "ft",
          },
          durationOverride: {
            units: "inst",
          },
          activationOverride: {
            type: "bonus",
          },
        },
      },
    ],
    "Telekinetic Adept": () => {
      return this.is2024
        ? [
          { action: { name: "Psionic Power: Psi-Powered Leap", type: "class" } },
          { action: { name: "Psionic Power: Telekinetic Thrust", type: "class" } },
        ]
        : [
          { action: { name: "Telekinetic Adept: Psi-Powered Leap", type: "class" } },
          { action: { name: "Telekinetic Adept: Telekinetic Thrust", type: "class" } },
        ];
    },
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
    "Vitality of the Tree": [
      {
        constructor: {
          name: "Life-Giving Force",
          type: "heal",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          rangeOverride: {
            value: "10",
            units: "ft",
          },
          activationOverride: {
            type: "special",
            value: 1,
            condition: "At the start of each of your turns (whilst raging)",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "ally",
            },
          },
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "(@scale.barbarian.rage-damage)d4", type: "temphp" }),
        },
      },
    ],
    "War Bond": [
      {
        constructor: {
          name: "Bond, 1st Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Bond, 2nd Weapon",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: {
            value: "1",
            units: "hour",
          },
          rangeOverride: {
            units: "self",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ],
    "Wild Resurgence": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Wild Resurgence: Regain Spell Slot",
        max: 1,
        period: "lr",
        override: true,
      });
      return [
        {
          constructor: {
            name: "Spend Wild Shape to Regain Spell Slot",
            type: "utility",
          },
          build: {
            img: "systems/dnd5e/icons/svg/trait.svg",
            generateConsumption: true,
            generateTarget: true,
            generateUses: true,
            consumptionOverride: {
              targets: [
                {
                  type: "itemUses",
                  target: "",
                  value: 1,
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "activityUses",
                  target: "",
                  value: 1,
                  scaling: { mode: "", formula: "" },
                },
                {
                  type: "spellSlots",
                  value: "-1",
                  target: "1",
                  scaling: {},
                },
              ],
              scaling: { allowed: true, max: "9" },
            },
            targetOverride: {
              affects: {
                value: "1",
                type: "self",
              },
            },
            usesOverride: uses,
          },
        },
      ];
    },
    "Wrath of the Sea": [
      {
        constructor: {
          name: "Save for Damage",
          type: "save",
        },
        build: {
          generateActivation: true,
          activationOverride: {
            type: "bonus",
          },
          generateTarget: true,
          targetOverride: {
            affects: {
              value: "1",
              type: "self",
            },
          },
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "(@abilities.wis.mod)d6", types: ["cold"] })],
          generateSave: true,
          saveOverride: {
            ability: "con",
            dc: { calculation: "spellcasting", formula: "" },
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
    "Combat Superiority": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Superiority Dice",
        max: "@scale.battle-master.combat-superiority-uses",
        period: "lr",
      });
      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Dark One's Own Luck": {
      data: {
        "system.uses.max": "@abilities.cha.mod",
      },
    },
    "Deflect Attacks": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
        },
      },
    },
    "Deflect Energy": {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Reduce Damage"],
        },
      },
    },
    "Divine Intervention": {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          value: "0",
          max: "1",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
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
    "Ki": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Ki Points",
            max: "@scale.monk.ki-points",
            period: "sr",
          }),
        },
      };
    },
    "Land's Aid": {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Healing"],
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
    "Lucky": () => {
      const uses = this._getUsesWithSpent({
        type: "feat",
        name: "Luck Points",
        max: this.is2014 ? 3 : "@prof",
        period: "lr",
      });
      return {
        data: {
          "system.uses": uses,
        },
      };
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
    "Monk's Focus": () => {
      return {
        data: {
          "flags.ddbimporter.ignoredConsumptionActivities": ["Patient Defense: Disengage"],
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Focus Points",
            max: "@scale.monk.focus-points",
            period: "sr",
          }),
        },
      };
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
    "Poisoner": {
      data: {
        "system.uses": {
          spent: 0,
          max: "20",
        },
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
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
    "Psionic Power": () => {
      const spent = this.ddbParser.subKlass === "Soulknife"
        ? this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Soulknife")
        : this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Psi Warrior");

      const recovery = [
        { period: "lr", type: 'recoverAll', formula: undefined },
      ];
      if (!this.is2014) {
        recovery.push({ period: "sr", type: 'formula', formula: "1" });
      }
      const subclass = this.ddbParser.subKlass === "Soulknife"
        ? "soulknife"
        : "psi-warrior";

      return {
        data: {
          "system.uses": {
            spent,
            max: this.is2014 ? "@prof * 2" : `@scale.${subclass}.energy-die.number`,
            recovery,
          },
        },
      };

    },
    "Rage": () => {
      return {
        data: {
          name: "Rage",
          "system.uses": {
            max: "@scale.barbarian.rages",
            recovery: this.is2014
              ? [{ period: "lr", type: 'recoverAll', formula: "" }]
              : [
                { period: "lr", type: 'recoverAll', formula: "" },
                { period: "sr", type: 'formula', formula: "1" },
              ],
          },
        },
      };
    },
    "Persistent Rage": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Rage: Regain Expended Uses",
            max: "1",
            period: "lr",
          }),
          "flags.ddbimporter": {
            retainOriginalConsumption: true,
            consumptionValue: "-@scale.barbarian.rages",
            retainChildUses: true,
          },
        },
      };
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
    "Rend Mind": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "Psychic Blades: Rend Mind",
        max: "1",
        period: "lr",
      });

      return {
        data: {
          "system.uses": uses,
        },
      };
    },
    "Sear Undead": {
      data: {
        "system.type.subtype": "channelDivinity",
      },
    },
    "Second Wind": () => {
      const result = {
        data: {},
      };
      if (this.is2024) {
        const recovery = foundry.utils.deepClone(this.data.system.uses.recovery ?? []);
        if (recovery.length === 0) recovery.push({ period: "lr", type: 'recoverAll' });
        recovery.push({ period: "sr", type: 'formula', formula: "1" });
        result.data = {
          "system.uses.recovery": recovery,
        };
      }
      return result;
    },
    "Shifting": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Beasthide": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Longtooth": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Swiftstride": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
    },
    "Shifting: Wildhunt": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Shift",
            max: "@prof",
          }),
        },
      };
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
    "Stonecunning": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "race",
            name: "Stonecunning (Tremorsense)",
            max: "@prof",
            period: "lr",
          }),
        },
      };
    },
    "Summon Wildfire Spirit: Command": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
        },
      },
    },
    "Telekinetic Master": () => {
      return {
        data: {
          "flags.ddbimporter.retainChildUses": true,
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Telekinetic Master: Weapon Attack",
            max: "1",
            period: "lr",
          }),
        },
      };
    },
    "The Third Eye": {
      "system.uses": {
        spent: 0,
        max: "1",
        recovery: [{ period: "sr", type: 'recoverAll', formula: undefined }],
      },
    },
    "Unbreakable Majesty": () => {
      return {
        data: {
          "system.uses": this._getUsesWithSpent({
            type: "class",
            name: "Assume Unbreakable Majesty",
            max: "1",
            period: "sr",
          }),
        },
      };
    },
    "Uncanny Metabolism": {
      data: {
        "flags.ddbimporter": {
          retainChildUses: true,
        },
      },
    },
    "War Bond": {
      data: {
        "flags.ddbimporter": {
          retainUseSpent: true,
        },
        "system.uses": {
          spent: 0,
          max: 2,
        },
      },
    },
    "War Priest": () => {
      const uses = this._getUsesWithSpent({
        type: "class",
        name: "War Priest: Bonus Attack",
        max: "max(1, @abilities.wis.mod)",
        period: "sr",
      });

      return {
        data: {
          "system.uses": uses,
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
    "Aspect of the Wilds": {
      multiple: [
        {
          name: "Owl",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Owl",
          },
          changes: [
            {
              key: "system.attributes.senses.darkvision",
              value: "60",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
          atlChanges: [
            generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
            generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
          ],
        },
        {
          name: "Panther",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Panther",
          },
          changes: [
            generateUpgradeChange("@attributes.movement.climb", 20, "system.attributes.movement.walk"),
          ],
        },
        {
          name: "Salmon",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Salmon",
          },
          changes: [
            generateUpgradeChange("@attributes.movement.swim", 20, "system.attributes.movement.walk"),
          ],
        },
      ],
    },
    "Bardic Inspiration": {
      options: {
        durationSeconds: 600,
      },
    },
    "Battering Roots": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("push", 20, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("topple", 20, "system.traits.weaponProf.mastery.bonus"),
      ],
    },
    "Beguiling Magic": {
      multiple: [
        {
          name: "Frightened",
          options: {
          },
          statuses: ["Frightened"],
        },
        {
          name: "Charmed",
          options: {
          },
          statuses: ["Charmed"],
        },
      ],
    },
    "Blessing of the Trickster": {
      options: {
        description: "Advantage on Dexterity (Stealth) checks.",
      },
    },
    "Celestial Revelation": {
    },
    "Celestial Revelation (Heavenly Wings)": {
      options: {
        durationSeconds: 60,
      },
      changes: [
        generateUpgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
      ],
    },
    "Channel Divinity": {
      name: "Turned",
      options: {
        durationSeconds: 60,
        description: "The effect ends if the creature takes damage.",
      },
      data: {
        "flags.ddbimporter.activityMatch": "Turn Undead",
      },
      statuses: ["Frightened", "Incapacitated"],
    },
    "Circle Forms": {
      name: "Circle Form AC",
      options: {
        description: "You gain a minimum AC of 13 + your Wisdom modifier.",
      },
      changes: [
        generateUpgradeChange("13 + @abilities.wis.mod", 20, "system.attributes.ac.min"),
      ],
    },
    "Cunning Strike": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Poisoned",
          options: {
            durationSeconds: 60,
          },
          statuses: ["Poisoned"],
          data: {
            "flags.ddbimporter.activityMatch": "Poison",
          },
        },
        {
          name: "Prone",
          options: {
          },
          statuses: ["Prone"],
          data: {
            "flags.ddbimporter.activityMatch": "Trip",
          },
        },
      ],
    },
    "Corona of Light": {
      multiple: () => {
        let effects = [];
        if (effectModules().atlInstalled) {
          effects.push({
            options: {
            },
            data: {
              "flags.ddbimporter.activityMatch": "Use/Apply Light",
            },
            atlChanges: [
              generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '30'),
              generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '60'),
              generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
              generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
            ],
          });
        }
      },
    },
    "Dazzling Footwork": {
      clearAutoEffects: true,
      multiple: [
        {
          options: {
            transfer: true,
          },
          changes: [
            generateOverrideChange("unarmoredBard", 10, "system.attributes.ac.calc"),
          ],
          data: {
            "flags.ddbimporter.activityMatch": "No Activity",
          },
        },
        {
          type: "enchant",
          changes: [
            generateOverrideChange(`{} [Dazzling Footwork]`, 20, "name"),
            generateUnsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
            generateOverrideChange("dex", 20, "system.ability"),
            generateOverrideChange("true", 20, "system.damage.base.custom.enabled"),
            generateOverrideChange("@scale.dance.dazzling-footwork + @abilities.dex.mod", 20, "system.damage.base.custom.formula"),
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
          options: {
            durationSeconds: 60,
          },
          statuses: ["Unconscious"],
          data: {
            "flags.ddbimporter.activityMatch": "Knock Out",
          },
        },
        {
          name: "Blinded",
          options: {
          },
          statuses: ["Blinded"],
          data: {
            "flags.ddbimporter.activityMatch": "Obscure",
          },
        },
      ],
    },
    "Diamond Soul": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.diamondSoul"),
      ],
    },
    "Disciplined Survivor": {
      clearAutoEffects: true,
    },
    "Draconic Resilience": {
      noCreate: true,
      changesOverwrite: true,
      changes: [
        generateUnsignedAddChange("1 * @classes.sorcerer.levels", 20, "system.attributes.hp.bonuses.overall"),
        generateOverrideChange("draconic", 20, "system.attributes.ac.calc"),
      ],
    },
    "Dual Wielder": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.enhancedDualWielding"),
      ],
    },
    "Divine Order: Thaumaturge": {
      noCreate: true,
      changes: [
        generateUnsignedAddChange("1", 20, "system.scale.cleric.cantrips-known.value"),
      ],
    },
    "Eldritch Invocations: Pact of the Blade": {
      type: "enchant",
      changes: [
        generateOverrideChange(`{} [Pact Weapon]`, 20, "name"),
        generateUnsignedAddChange("necrotic", 20, "system.damage.base.types"),
        generateUnsignedAddChange("psychic", 20, "system.damage.base.types"),
        generateUnsignedAddChange("radiant", 20, "system.damage.base.types"),
        generateUnsignedAddChange("true", 20, "system.proficient"),
        generateOverrideChange("cha", 20, "system.ability"),
      ],
    },
    "Eldritch Strike": {
      name: "Struck",
      options: {
        description: "",
      },
    },
    "Elven Accuracy": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.elvenAccuracy"),
      ],
    },
    "Empowered Strikes": {
      clearAutoEffects: true,
    },
    "Empty Body": () => {
      return {
        options: {
          durationSeconds: 60,
        },
        statuses: ["invisible"],
        changes: [
          "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "poison", "psychic", "radiant",
          "thunder", "piercing", "slashing",
        ].map((element) =>
          generateUnsignedAddChange(element, 20, "system.traits.dr.value"),
        ),
      };
    },
    "Full of Stars": {
      changes: [
        generateUnsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("piercing", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("slashing", 20, "system.traits.dr.value"),
      ],
    },
    "Frost's Chill (Frost Giant)": {
      changes: [
        { key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "-10", priority: "20" },
      ],
    },
    "Giant's Might": {
      options: {
        durationSeconds: 60,
        description: "You also gain advantage on Strength checks and saving throws.",
      },
      atlChanges: [
        generateATLChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        generateATLChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
      ],
      changes: [
        generateOverrideChange("lg", 25, "system.traits.size"),
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
            generateOverrideChange(`{} [Chromatic Infusion ${utils.capitalize(element.type)}]`, 20, "name"),
            generateUnsignedAddChange(`[["1d4", "${element.type}"]]`, 20, "system.damage.parts"),
          ],
        };
      }),
    },
    "Halfling Lucky": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.halflingLucky"),
      ],
    },
    "Heightened Focus": {
      clearAutoEffects: true,
    },
    "Brutal Strike": {
      name: "Hamstrung",
      changes: [
        generateOverrideChange("-15", 90, "system.attributes.movement.walk"),
      ],
      data: {
        "flags.ddbimporter.activityMatch": "Hamstrung Blow",
      },
    },
    "Hold Breath": {
      data: {
        "duration.rounds": 600,
      },
    },
    "Hill's Tumble (Hill Giant)": {
      statuses: ["Prone"],
    },
    "Innate Sorcery": {
      changes: [
        generateUnsignedAddChange("1", 20, "system.bonuses.spell.dc"),
      ],
    },
    "Imbue Aura of Protection": {
      multiple: () => {
        let effects = [];
        if (effectModules().atlInstalled) {
          effects.push({
            options: {
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
    "Improved Brutal Strike": {
      multiple: [
        {
          name: "Staggered",
          changes: [],
          data: {
            "flags.ddbimporter.activityMatch": "Staggering Blow",
          },
        },
        {
          name: "Sundered",
          changes: [],
          data: {
            "flags.ddbimporter.activityMatch": "Sundering Blow",
          },
        },
      ],
    },
    "Improved Circle Forms": {
      noCreate: true,
      data: {
        transfer: false,
      },
    },
    "Improved Critical": {
      options: {
        transfer: true,
      },
      changes: [
        generateDowngradeChange("19", 20, "flags.dnd5e.weaponCriticalThreshold"),
      ],
    },
    "Jack of All Trades": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.jackOfAllTrades"),
      ],
    },
    "Large Form": {
      changes: [
        generateOverrideChange("lg", 25, "system.traits.size"),
      ],
      atlChanges: [
        generateOverrideChange("2", 30, "ATL.width"),
        generateOverrideChange("2", 30, "ATL.height"),
      ],
    },
    "Maneuver: Ambush": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.init.bonus"),
      ],
    },
    "Maneuver: Bait and Switch": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.ac.bonus"),
      ],
    },
    "Maneuver: Evasive Footwork": {
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.attributes.ac.bonus"),
      ],
    },
    // Future Enhancement: Add a macro that rolls dice and applies dr effect
    // "Maneuver: Parry": {
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
      changes: [
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.his.bonuses.check"),
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.inv.bonuses.check"),
        generateUnsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.ins.bonuses.check"),
      ],
    },
    "Mindless Rage": {
      // options: {
      //   transfer: true,
      //   disabled: true,
      // },
      changes: [
        generateUnsignedAddChange("frighened", 20, "system.traits.ci.value"),
        generateUnsignedAddChange("charmed", 20, "system.traits.ci.value"),
      ],
    },
    "Momentary Stasis": {
      options: {
        durationRounds: 1,
      },
      changes: [
        generateOverrideChange("*0", 90, "system.attributes.movement.all"),
        generateOverrideChange("0", 90, "system.attributes.movement.walk"),
        generateOverrideChange("0", 90, "system.attributes.movement.fly"),
        generateOverrideChange("0", 90, "system.attributes.movement.swim"),
        generateOverrideChange("0", 90, "system.attributes.movement.climb"),
      ],
      statuses: ["incapacitated"],
    },
    "Moonlight Step": {
      name: "Moonlight Step: Advantage on Next Attack",
      options: {
        description: "You have Advantage on the next attack roll you make before the end of this turn.",
      },
    },
    "Monk's Focus": {
      multiple: [
        {
          name: "Disengage",
          data: {
            "flags.ddbimporter.activityMatch": "Step of the Wind",
          },
        },
      ],
    },
    "Nature's Ward": () => {
      const multiple = [
        {
          name: "Poison Immunity",
          options: {
            transfer: true,
          },
          changes: [
            generateUnsignedAddChange("poisoned", 20, "system.traits.ci.value"),
          ],
        },
      ];
      const activeType = this.ddbParser?._chosen.find((a) =>
        utils.nameString(a.label).startsWith("Nature's Ward"),
      )?.label ?? "";
      [
        { type: "fire", origin: "Arid" },
        { type: "cold", origin: "Polar" },
        { type: "lightning", origin: "Temperate" },
        { type: "poison", origin: "Tropical" },
      ].forEach((effect) => {
        multiple.push({
          name: `${effect.origin}: Resistance to ${effect.type}`,
          options: {
            transfer: true,
            disabled: !activeType.includes(effect.origin),
          },
          changes: [
            generateUnsignedAddChange(effect.type, 20, "system.traits.dr.value"),
          ],
        });
      });
      return {
        clearAutoEffects: true,
        multiple,
      };
    },
    "Observant": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.observantFeat"),
      ],
    },
    "Partially Amphibious": {
      data: {
        "duration.rounds": 600,
      },
    },
    "Patient Defense": {
      multiple: [
        {
          name: "Patient Defense: Disengaged",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          data: {
            "flags.ddbimporter.activitiesMatch": ["Patient Defense: Disengage"],
          },
        },
        {
          name: "Patient Defense: Disengaged & Dodging",
          options: {
            durationRounds: 1,
            durationSeconds: 6,
          },
          statuses: ["dodging"],
          data: {
            "flags.ddbimporter.activitiesMatch": ["Patient Defense: Disengage & Dodge"],
          },
        },
      ],
    },
    "Physician's Touch": {
      name: "Poisoned",
      statuses: ["Poisoned"],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Hand of Harm"],
      },
    },
    "Poisoner": {
      name: "Poisoned",
      statuses: ["Poisoned"],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Poison Save", "Poison Save (Dexterity)", "Poison Save (Intelligence)"],
      },
    },
    "Powerful Build": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.powerfulBuild"),
      ],
    },
    "Power of the Wilds": {
      multiple: [
        {
          name: "Falcoln",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Falcoln",
          },
          changes: [
            generateUpgradeChange("@attributes.movement.fly", 20, "system.attributes.movement.walk"),
          ],
        },
        {
          name: "Lion",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Lion",
          },
        },
        {
          name: "Ram",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Ram",
          },
        },
        {
          name: "Prone",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Ram",
          },
          statuses: ["Prone"],
        },
      ],
    },
    "Psionic Power: Telekinetic Thrust": {
      name: "Telekinetic Thrust: Prone",
      statuses: ["Prone"],
    },
    "Rage": () => {
      return {
        name: "Rage",
        options: {
          // transfer: true,
          // disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
        },
        changes: [
          generateUnsignedAddChange("@scale.barbarian.rage-damage", 20, "system.bonuses.mwak.damage"),
          generateUnsignedAddChange("piercing", 20, "system.traits.dr.value"),
          generateUnsignedAddChange("slashing", 20, "system.traits.dr.value"),
          generateUnsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          generateCustomChange("1", 20, "flags.midi-qol.advantage.ability.save.str"),
          generateCustomChange("1", 20, "flags.midi-qol.advantage.ability.check.str"),
          generateCustomChange("outline", 20, "macro.tokenMagic"),
        ],
      };
    },
    "Raging Storm: Tundra": {
      changes: [
        generateCustomChange("*0", 20, "system.attributes.movement.all"),
        generateOverrideChange("0", 60, "system.attributes.movement.walk"),
        generateOverrideChange("0", 60, "system.attributes.movement.fly"),
      ],
    },
    "Radiant Strikes": {
      noActivity: true,
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("1d8[radiant]", 20, "system.bonuses.mwak.damage"),
      ],
    },
    "Reckless Attack": {
      name: "Attacking Recklessly",
    },
    "Reliable Talent": {
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
        generateOverrideChange("true", 20, "flags.dnd5e.reliableTalent"),
      ],
    },
    "Remarkable Athlete": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.remarkableAthlete"),
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
        generateOverrideChange("@abilities.cha.mod", 20, "attack.bonus"),
        generateUnsignedAddChange("radiant", 20, "damage.base.types"),
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
          options: {
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
            generateUnsignedAddChange("fire", 20, "system.traits.dr.value"),
          ],
        },
        {
          name: "Shielding Storm: Sea",
          options: {
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
            generateUnsignedAddChange("lightning", 20, "system.traits.dr.value"),
          ],
        },
        {
          name: "Shielding Storm: Tundra",
          options: {
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
            generateUnsignedAddChange("cold", 20, "system.traits.dr.value"),
          ],
        },
      ],
    },
    "Shifting: Beasthide": {
      changes: [
        generateUnsignedAddChange("1", 20, "system.attributes.ac.bonus"),
      ],
    },
    "Shifting: Swiftstride": {
      changes: [
        generateUnsignedAddChange("10", 20, "system.attributes.movement.walk"),
      ],
    },
    "Shifting: Wildhunt": {
    },
    "Slasher": {
      name: "Slashed",
    },
    "Starry Form": {
      multiple: [
        {
          options: {
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
          options: {
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
          options: {
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
            generateUpgradeChange("20", 20, "system.attributes.movement.fly"),
          ],
        },
      ],
    },
    "Steps of the Fey": {
      options: {
        description: "Disadvantage on attack rolls against creatures other than caster until the start of the casters next turn",
      },
      name: "Taunted",
    },
    "Stonecunning": {
      name: "Stonecunning: Tremorsense",
      options: {
        durationSeconds: 600,
      },
      changes: [
        generateUnsignedAddChange("60", 20, "system.attributes.senses.tremorsense"),
      ],
    },
    "Stormborn": {
      changes: [
        generateUpgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        generateUnsignedAddChange("cold", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("lightning", 20, "system.traits.dr.value"),
        generateUnsignedAddChange("thunder", 20, "system.traits.dr.value"),
      ],
    },
    "Superior Critical": {
      options: {
        transfer: true,
      },
      changes: [
        generateDowngradeChange("18", 30, "flags.dnd5e.weaponCriticalThreshold"),
      ],
    },
    "Superior Defense": {
      clearAutoEffects: true,
      options: {
        transfer: false,
        durationSeconds: 60,
      },
      changes: [
        "acid", "bludgeoning", "cold", "fire", "lightning", "necrotic", "poison", "psychic", "radiant",
        "thunder", "piercing", "slashing",
      ].map((element) =>
        generateUnsignedAddChange(element, 20, "system.traits.dr.value"),
      ),
    },
    "Tactial Master": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("push", 10, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
        generateUnsignedAddChange("slow", 10, "system.traits.weaponProf.mastery.bonus"),
      ],
    },
    "Tavern Brawler": {
      options: {
        transfer: true,
      },
      changes: [
        generateOverrideChange("true", 20, "flags.dnd5e.tavernBrawlerFeat"),
      ],
    },
    "The Third Eye": {
      multiple: [
        {
          name: "Darkvision",
          options: {
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
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "Greater Comprehension",
            description: "You can read any language",
          },
          changes: [
            generateUnsignedAddChange(";Read Any Language", 20, "system.traits.languages.special"),
          ],
        },
        {
          name: "See Invisibility",
          options: {
          },
          data: {
            "flags.ddbimporter.activityMatch": "See Invisibility",
          },
          changes: [
            generateUnsignedAddChange(";Invisible Creatures", 20, "system.attributes.senses.special"),
            generateUnsignedAddChange(";Ethereal Plane", 20, "system.attributes.senses.special"),
          ],
        },
      ],
    },
    "Tongue of the Sun and Moon": {
      options: {
        transfer: true,
      },
      changes: [
        generateUnsignedAddChange("standard:*", 20, "system.traits.languages.value"),
        generateUnsignedAddChange("exotic:*", 20, "system.traits.languages.value"),
        generateUnsignedAddChange("ddb:*", 10, "system.traits.languages.value"),
      ],
    },
    "Unarmored Movement": () => {
      const value = this.ddbParser.ddbData?.character?.modifiers && this.is2024
        ? this.ddbParser.ddbData.character.modifiers.class.filter((mod) => mod.isGranted
          && mod.friendlySubtypeName === "Unarmored Movement").reduce((acc, mod) => acc + mod.value, 0)
        : 10;
      return {
        noCreate: true,
        changesOverwrite: true,
        changes: [
          // can't use scale values here yet
          generateUnsignedAddChange(`${value}`, 20, "system.attributes.movement.walk"),
        ],
      };
    },
    "Unbreakable Majesty": {
      options: {
        durationSeconds: 60,
      },
      data: {
        "flags.ddbimporter.activityMatch": "Assume Unbreakable Majesty",
      },
    },
    "Unarmored Defense": {
      noCreate: true,
      changesOverwrite: true,
      changes: (data) => {
        const klass = foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.class");
        if (klass === "Barbarian") {
          return [
            generateOverrideChange("unarmoredBarb", 15, "system.attributes.ac.calc"),
          ];
        } else if (klass === "Monk") {
          return [
            generateOverrideChange("unarmoredMonk", 15, "system.attributes.ac.calc"),
          ];
        }
        return [];
      },
    },
    "War Bond": {
      name: "Weapon Bond",
      type: "enchant",
      changes: [
        generateOverrideChange(`{} [Bonded]`, 20, "name"),
      ],
    },
    "War Caster": {
      options: {
        transfer: true,
      },
      changes: [
        generateUpgradeChange("1", 10, "system.attributes.concentration.roll.mode"),
      ],
    },
  };

  DOCUMENT_STUB = {

  };
}
