import { generateUpgradeChange } from "../../effects/effects.js";
import utils from "../../lib/utils.js";
import DDBFeatureActivity from "../features/DDBFeatureActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDFeatureEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBFeatureActivity;
  }

  DND_2014 = {
    NAME_HINTS: {
      "Channel Divinity: Sacred Weapon": "Sacred Weapon",
    },
    ACTIVITY_HINTS: {
      "Breath Weapon (Acid)": {},
      "Breath Weapon (Cold)": {},
      "Breath Weapon (Fire)": {},
      "Breath Weapon (Lightning)": {},
      "Breath Weapon (Poison)": {},
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
          "system.uses": {
            value: this.ddbParser?.ddbData.character.actions.class.find((a) => a.name === "Ghostly Gaze").limitedUse.numberUsed,
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
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {
    "Invoke Duplicity": "Channel Divinity: Invoke Duplicity",
    "Preserve Life": "Channel Divinity: Preserve Life",
    "Radiance of the Dawn": "Channel Divinity: Radiance of the Dawn",
    "War God's Blessing": "Channel Divinity: War God's Blessing",
  };

  ACTIVITY_HINTS = {
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
      type: "damage",
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
            DDBBaseEnricher.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
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
    "Empty Body": {
      targetType: "self",
    },
    "Harness Divine Power": {
      type: "utility",
      activationType: "bonus",
      addItemConsume: true,
    },
    "Hold Breath": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
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
    "Partially Amphibious": {
      type: "utility",
      func: undefined,
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
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
    "Sacred Weapon": {
      type: "enchant",
      activationType: "special",
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
  };

  ADDITIONAL_ACTIVITIES = {
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
  };

  DOCUMENT_OVERRIDES = {
    "Action Surge": {
      removeDamage: true,
    },
    "Arcane Propulsion Armor Gauntlet": {
      data: {
        "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
      },
    },
    "Arms of the Astral Self (DEX/STR)": {
      data: {
        name: "Arms of the Astral Self",
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
    "Epic Boon: Choose an Epic Boon feat": {
      data: {
        "name": "Epic Boon",
      },
    },
    "Harness Divine Power": {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
      },
    },
    "Ki Points": {
      data: {
        "system.uses.max": "@scale.monk.ki-points",
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
    "Summon Wildfire Spirit: Command": {
      data: {
        "system.uses": {
          spent: null,
          max: "",
        },
      },
    },
  };

  EFFECT_HINTS = {
    "Bardic Inspiration": {
      type: "feat",
      options: {
        durationSeconds: 600,
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
    "Hold Breath": {
      type: "feat",
      data: {
        "duration.rounds": 600,
      },
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
  };

  DOCUMENT_STUB = {

  };
}
