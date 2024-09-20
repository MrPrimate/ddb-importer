import DICTIONARY from "../../dictionary.js";
import { generateATLChange, generateTokenMagicFXChange } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBSpellActivity;
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }


  _getEldritchInvocations() {
    let damage = "";
    let range = 0;

    const eldritchBlastMods = DDBHelper.filterBaseModifiers(this.ddbParser.ddbData, "eldritch-blast").filter((modifier) => modifier.isGranted);

    eldritchBlastMods.forEach((mod) => {
      switch (mod.subType) {
        case "bonus-damage": {
          // almost certainly CHA :D
          const abilityModifierLookup = DICTIONARY.character.abilities.find((ability) => ability.id === mod.statId);
          if (abilityModifierLookup) {
            if (damage !== "") damage += " + ";
            damage += `@abilities.${abilityModifierLookup.value}.mod`;
          } else if (mod.fixedValue) {
            if (damage !== "") damage += " + ";
            damage += `${mod.fixedValue}`;
          }
          break;
        }
        case "bonus-range":
          range = mod.value;
          break;
        default:
          logger.warn(`Not yet able to process ${mod.subType}, please raise an issue.`);
      }
    });

    return {
      damage: damage,
      range: range,
    };
  }

  eldritchBlastRangeAdjustments(initialRange) {
    const eldritchBlastMods = this.ddbParser?.ddbData
      ? this._getEldritchInvocations()
      : null;

    if (eldritchBlastMods?.range && Number.parseInt(eldritchBlastMods.range)) {
      const range = Number.parseInt(initialRange) + Number.parseInt(eldritchBlastMods.range);
      return `${range}`;
    }
    return initialRange;
  }

  eldritchBlastDamageBonus() {
    const eldritchBlastMods = this.ddbParser?.ddbData
      ? this._getEldritchInvocations()
      : null;
    const bonus = eldritchBlastMods?.damage
      ? `${eldritchBlastMods["damage"]}`
      : "";

    return bonus;
  }

  DND_2014 = {
    NAME_HINTS: {},
    ACTIVITY_HINTS: {
      "Counterspell": {
        type: "check",
        check: {
          associated: [],
          ability: "spellcasting",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
      "Color Spray": {
        type: "utility",
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "4d10 + (2*@item.level)d10",
            name: "HP Effected",
          },
        },
      },
      "Sleep": {
        type: "utility",
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "3d8 + (2*@item.level)d8",
            name: "HP Effected",
          },
        },
      },
    },
    ADDITIONAL_ACTIVITIES: {
      "Hunter's Mark": [
        {
          constructor: {
            name: "Bonus Damage",
            type: "damage",
          },
          build: {
            generateDamage: true,
            generateSave: false,
            generateConsumption: false,
            noSpellslot: true,
            onsave: false,
            noeffect: true,
            activationOverride: { type: "", condition: "When you hit creature with attack" },
            damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6 })],
          },
        },
      ],
    },
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {},
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {
    "Melf's Acid Arrow": "Acid Arrow",
  };

  ACTIVITY_HINTS = {
    "Absorb Elements": {
      type: "utility",
      data: {
        "description.chatFlavor": "Uses the damage type of the triggered attack: Acid, Cold, Fire, Lightning, or Poison.",
        name: "Absorb Elements Effect",
      },
    },
    "Acid Arrow": {
      data: {
        "damage.parts": [
          DDBBaseEnricher.basicDamagePart({ number: 4, denomination: 4, type: "acid" }),
        ],
      },
    },
    "Aura of Life": {
      type: "utility",
    },
    "Booming Blade": {
      type: "damage",
      targetType: "creature",
      overrideTemplate: true,
      overrideRange: true,
      noTemplate: true,
      data: {
        range: {
          override: true,
          value: 5,
          units: "ft",
        },
        damage: {
          parts: [{
            types: ["thunder"],
            scaling: {
              mode: "whole",
              formula: "1d8",
            },
          }],
        },
      },
    },
    "Call Lightning": {
      type: "utility",
      data: {
        name: "Place Storm Cloud Template",
      },
    },
    "Chaos Bolt": {
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "2d8 + 1d6", scalingMode: "whole", scalingFormula: "1d6" }),
            // DDBBaseEnricher.basicDamagePart({ customFormula: "2d8 + 1d6", types: ["acid", "cold", "fire", "force", "lightning", "poison", "psychic", "thunder"] }),
          ],
        },
      },
    },
    "Chromatic Orb": {
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 8, types: ["acid", "cold", "fire", "lightning", "poison", "thunder"], scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
    },
    "Control Weather": {
      type: "utility",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: 5,
          units: "mi",
        },
      },
    },
    "Counterspell": {
      type: "save",
    },
    "Divine Favor": {
      targetType: "self",
    },
    "Dragon's Breath": {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 6, types: ["acid", "cold", "fire", "lightning", "poison"], scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
    },
    "Eldritch Blast": {
      type: "attack",
      data: () => {
        return {
          damage: {
            parts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, type: "force", scalingMode: "none", bonus: this.eldritchBlastDamageBonus() })],
          },
        };
      },
    },
    "Elemental Weapon": {
      type: "enchant",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    },
    "Gust of Wind": {
      data: {
        target: {
          override: true,
          template: {
            count: "",
            contiguous: false,
            type: "line",
            size: "60",
            width: "10",
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
      },
    },
    "Green-Flame Blade": {
      type: "damage",
      data: {
        name: "Secondary Target Damage",
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "@mod", types: ["fire"], scalingMode: "whole", scalingFormula: "1d8" }),
          ],
        },
      },
    },
    "False Life": {
      data: {
        "damage.parts": [DDBBaseEnricher.basicDamagePart({ customFormula: "1d4 + 4", types: ["temphp"], scalingMode: "whole", scalingNumber: 5 })],
      },
    },
    "Heroism": {
      type: "utility",
      stopHealSpellActivity: true,
      data: {
        name: "Cast",
      },
    },
    "Heroe's Feast": {
      data: {
        duration: {
          value: 1,
          units: "day",
          override: true,
        },
      },
    },
    "Hex": {
      type: "utility",
      data: {
        name: "Mark Target",
      },
    },
    "Hunter's Mark": {
      type: "utility",
      data: {
        name: "Cast",
      },
    },
    "Magic Weapon": {
      type: "enchant",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    },
    "Prismatic Wall": {
      type: "utility",
      data: {
        name: "Place Wall",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "90",
            width: "1/12",
            height: "30",
            units: "ft",
          },
        },
      },
    },
    "Pyrotechnics": {
      type: "save",
      data: {
        name: "Fireworks",
        target: {
          override: true,
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
    "Ray of Enfeeblement": {
      type: "attack",
    },
    "Searing Smite": {
      type: "damage",
      data: {
        name: "Initial Damage",
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 6, types: ["fire"], scalingMode: "whole", scalingNumber: "1" }),
          ],
        },
      },
    },
    "Scorching Ray": {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    },
    "Spirit Guardians": {
      type: "utility",
      data: {
        name: "Place Template",
      },
    },
    "Spike Growth": {
      type: "utility",
      data: {
        name: "Place Template",
      },
    },
    "Spirit Shroud": {
      type: "damage",
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "1d8", types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: "1" }),
          ],
        },
      },
    },
    "Spiritual Weapon": {
      type: "utility",
      data: {
        name: "Summon",
        target: {
          override: true,
          template: {
            size: "2.5",
            type: "radius",
          },
        },
      },
    },
    "Tidal Wave": {
      type: "save",
    },
    "Thunder Step": {
      data: {
        range: {
          override: true,
          value: "",
          units: "self",
        },
        target: {
          override: true,
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
    "Vitriolic Sphere": {
      type: "save",
      data: {
        name: "Save",
        damage: {
          onSave: "half",
          parts: [DDBBaseEnricher.basicDamagePart({ number: 10, denomination: 4, type: "acid", scalingMode: "whole", scalingNumber: "2" })],
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "20",
            units: "ft",
          },
        },
      },
    },
    "Wall of Sand": {
      type: "save",
      data: {
        name: "Place Wall",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "30",
            width: "10",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Water": {
      type: "save",
      data: {
        name: "Place Wall",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "30",
            width: "1",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Fire": {
      type: "save",
      damageParts: [0],
      data: {
        img: "icons/magic/fire/flame-burning-fence.webp",
        name: "Place Wall",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "60",
            width: "1",
            height: "20",
            units: "ft",
          },
        },
      },
    },
    "Wall of Force": {
      type: "utility",
      data: {
        name: "Place Panels",
        img: "icons/magic/water/barrier-ice-wall-snow.webp",
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "0.02",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Light": {
      type: "save",
      damageParts: [0],
      data: {
        name: "Place Wall",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "60",
            width: "5",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Stone": {
      type: "save",
      data: {
        name: "Place Square Panels",
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "0.5",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Thorns": {
      type: "save",
      damageParts: [0],
      data: {
        name: "Place Wall",
        img: "icons/magic/nature/root-vine-entwined-thorns.webp",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "60",
            width: "5",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Ice": {
      type: "save",
      damageParts: [0],
      data: {
        name: "Place Panels",
        img: "icons/magic/water/barrier-ice-wall-snow.webp",
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "1",
            height: "10",
            units: "ft",
          },
        },
      },
    },
    "Wind Wall": {
      type: "save",
      damageParts: [0],
      data: {
        target: {
          override: true,
          template: {
            count: "5",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "1",
            height: "15",
            units: "ft",
          },
        },
      },
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Absorb Elements": [
      {
        constructor: {
          name: "Elemental Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, types: ["acid", "cold", "fire", "lightning", "thunder"] })],
          noeffect: true,
        },
      },
    ],
    "Acid Arrow": [
      {
        constructor: {
          name: "End of Targets Turn Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 4, type: "acid" })],
          noeffect: true,
        },
      },
    ],
    "Armor of Agathys": [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "5", type: "cold", scalingFormula: "5", scalingMode: "whole" })],
          noeffect: true,
        },
      },
    ],
    "Booming Blade": [
      {
        constructor: {
          name: "Movement Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, type: "thunder" })],
          noeffect: true,
          overrideRange: {
            value: "5",
            units: "ft",
          },
          overrideTarget: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "", condition: "Creature moves more than 5 ft" },
        },
      },
    ],
    "Call Lightning": [
      {
        constructor: {
          name: "Damage",
          type: "save",
        },
        build: {
          noSpellslot: true,
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: "1" })],
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
      {
        constructor: {
          name: "Damage (Outdoors in a Storm)",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateSave: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 4, denomination: 10, type: "lightning", scalingMode: "whole", scalingNumber: "1" })],
          rangeOverride: {
            value: "",
            units: "spec",
            special: "Beneath storm cloud",
          },
          targetOverride: {
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ],
    "Green-Flame Blade": [
      {
        constructor: {
          name: "Main Weapon Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ customFormula: "ceil((@details.level+1)/6)d8", types: ["fire"], scalingMode: "none" })],
        },
      },
    ],
    "Heat Metal": [
      {
        constructor: {
          name: "Save vs Drop",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateSave: true,
          saveOverride: { ability: "con", dc: { calculation: "spellcasting" } },
        },
      },
    ],
    "Heroism": [
      {
        constructor: {
          name: "Start of Turn Temp HP",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          healingPart: [DDBBaseEnricher.basicDamagePart({ customFormula: "@mod", type: "temphp" })],
          noeffect: true,
          activationOverride: { type: "spec", condition: "Start of each creatures turn" },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
      },
    ],
    "Hex": [
      {
        constructor: {
          name: "Hex Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "necrotic" })],
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
        },
      },
    ],
    "Hunter's Mark": [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "force" })],
        },
      },
    ],
    "Prismatic Wall": [
      {
        constructor: {
          name: "Create Globe",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateSave: false,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              contiguous: false,
              type: "radius",
              size: "15",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Blinding Save",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "enemy",
            },
            activationOverride: { type: "spec", condition: "Within 20ft" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
      {
        constructor: {
          name: "Damage Save",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "spec", condition: "Moving through" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, types: ["fire", "acid", "lightning", "poison", "cold"] })],
        },
      },
    ],
    "Pyrotechnics": [
      {
        constructor: {
          name: "Smoke",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          noeffect: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "20",
              units: "ft",
            },
          },
        },
      },
    ],
    "Searing Smite": [
      {
        constructor: {
          name: "Save vs Ongoing Damage",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 6, type: "fire" })],
          noeffect: true,
          activationOverride: { type: "", condition: "Start of the creatures turn" },
        },
      },
    ],
    "Spirit Guardians": [
      {
        constructor: {
          name: "Save vs Damage",
          type: "save",
        },
        build: {
          generateDamage: true,
          onSave: "half",
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 8, types: ["necrotic", "radiant"], scalingMode: "whole", scalingNumber: 1 })],
          noeffect: true,
          activationOverride: { type: "", condition: "Enters or ends turn in emanation (1 turn only)" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            template: {},
            affects: {
              type: "creature",
            },
          },
        },
      },
    ],
    "Spiritual Weapon": [
      {
        constructor: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateAttack: true,
          onsave: false,
          noSpellslot: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, type: "force", scalingMode: "half", scalingNumber: 1 })],
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ],
    "Spike Growth": [
      {
        constructor: {
          name: "Movement Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "", condition: "Moves 5ft" },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 4, type: "piercing" })],
        },
      },
    ],
    "Toll the Dead": [
      {
        constructor: {
          name: "Save (D12 Damage)",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 12, type: "necrotic" })],
        },
      },
    ],
    "Vitriolic Sphere": [
      {
        constructor: {
          name: "Secondary Acid Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "spec", condition: "End of next turn" },
          durationOverride: { units: "inst", concentration: false },
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 5, denomination: 4, type: "acid" })],
        },
      },
    ],
    "Wall of Fire": [
      {
        constructor: {
          name: "Place Ring",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "cylinder",
              size: "10",
              height: "20",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          img: "icons/magic/fire/flame-burning-skeleton-explosion.webp",
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          partialDamageParts: [0],
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "", condition: "" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
    ],
    "Wall of Force": [
      {
        constructor: {
          name: "Create Dome/Globe",
          type: "utility",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "sphere",
              size: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
    ],
    "Wall of Light": [
      {
        constructor: {
          name: "Turn End Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          partialDamageParts: [0],
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "spec", condition: "Ends turn in Light" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
      {
        constructor: {
          name: "Beam of Radiance Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          partialDamageParts: [0],
          noSpellslot: true,
          rangeOverride: { value: 60, units: "ft" },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "spec", condition: "" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
    ],
    "Wall of Ice": [
      {
        constructor: {
          name: "Create Dome/Globe",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/water/barrier-ice-shield.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "sphere",
              size: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Frigid Air Save",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          img: "icons/magic/water/snowflake-ice-blue-white.webp",
          generateTarget: true,
          partialDamageParts: [1],
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "spec", condition: "Moving through/starting in Frigid Air" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
    ],
    "Wall of Stone": [
      {
        constructor: {
          name: "Place Long Panels",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              count: "10",
              contiguous: true,
              type: "wall",
              size: "20",
              width: "0.25",
              height: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
    ],
    "Wall of Thorns": [
      {
        constructor: {
          name: "Create Circle",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/nature/trap-spikes-thorns-green.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "cylinder",
              size: "20",
              height: "20",
              width: "5",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Save to Travel Through Wall",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          img: "icons/magic/nature/root-vine-entangled-humanoid.webp",
          generateTarget: true,
          partialDamageParts: [1],
          noSpellslot: true,
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            activationOverride: { type: "spec", condition: "Moving through/starting in Frigid Air" },
            durationOverride: { units: "inst", concentration: false },
            template: {},
          },
        },
      },
    ],
    "Wall of Water": [
      {
        constructor: {
          name: "Create Ring",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "sphere",
              size: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
    ],
  };

  DOCUMENT_OVERRIDES = {
    // "Booming Blade": {
    //   noTemplate: true,
    // },
    "Bones of the Earth": {
      data: {
        "system.target.template": {
          count: "6",
          size: "2.5",
        },
      },
    },
    "Catapult": {
      data: {
        "flags.midiProperties.nodam": true,
      },
    },
    "Eldritch Blast": () => {
      return {
        data: {
          "system.range.value": this.eldritchBlastRangeAdjustments(this.data?.system?.range?.value ?? 0),
        },
      };
    },
    "Flaming Sphere": {
      data: {
        "system.target.template": {
          size: "2.5",
        },
      },
    },
    "Green-Flame Blade": {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
        "system.target.template": {
          size: "",
          type: "",
        },
      },
    },
    "Light": {
      data: {
        "flags.midiProperties.autoFailFriendly": true,
      },
    },
    "Primal Savagery": {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
      },
    },
    "Prismatic Wall": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Produce Flame": {
      data: {
        "system.range": {
          value: "30",
          units: "ft",
        },
      },
    },
    "Thunderclap": {
      data: {
        "system.range": {
          units: "spec",
        },
        "system.target": {
          template: {
            size: "15",
            type: "cube",
          },
        },
      },
    },
    "Tidal Wave": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "line",
            size: "30",
            width: "10",
            units: "ft",
          },
        },
      },
    },
    "Wall of Thorns": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Wall of Water": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Wall of Fire": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Wall of Force": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Wall of Light": {
      data: {
        "system.range": {
          units: "",
        },
      },
    },
    "Wall of Stone": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
    "Wall of Ice": {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    },
  };

  EFFECT_HINTS = {
    "Absorb Elements": {
      multiple: ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
        return {
          name: `Absorb ${element}`,
          type: "spell",
          changes: [
            { key: "system.traits.dr.value", value: element.toLowerCase(), mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
          ],
          data: {
            "flags.ddbimporter.activityMatch": "Absorb Elements Effect",
          },
        };
      }),
    },
    "Acid Arrow": {
      name: "Covered in Acid",
      type: "spell",
      options: {
        durationSeconds: 6,
      },
    },
    "Aid": {
      multiple: [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
        return {
          name: `Aid: Level ${level} Temp Max HP Bonus`,
          type: "spell",
          changes: [
            {
              key: "system.attributes.hp.bonuses.overall",
              value: `${5 * (level - 1)}`,
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              priority: 20,
            },
          ],
        };
      }),
    },
    "Animal Friendship": {
      type: "spell",
      statuses: "Charmed",
    },
    "Aura of Life": {
      type: "spell",
      changes: [
        {
          key: "system.traits.dr.value",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "necrotic",
          priority: "20",
        },
      ],
    },
    "Barkskin": {
      type: "spell",
      changes: [
        {
          key: "system.attributes.ac.min",
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          value: "16",
          priority: "100",
        },
      ],
    },
    "Bless": {
      type: "spell",
      options: {
        durationSeconds: 60,
      },
      changes: [
        { key: "system.bonuses.abilities.save", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
        { key: "system.bonuses.mwak.attack", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
        { key: "system.bonuses.rwak.attack", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
        { key: "system.bonuses.msak.attack", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
        { key: "system.bonuses.rsak.attack", value: "+1d4", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
      ],
      tokenMagicChanges: [
        generateTokenMagicFXChange("bloom"),
      ],
    },
    "Booming Blade": {
      type: "spell",
    },
    "Elemental Weapon": {
      multiple: [
        { type: "acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
        { type: "cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
        { type: "fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
        { type: "lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
        { type: "thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
      ].map((element) => {
        return [
          { bonus: "1", min: null, max: 3 },
          { bonus: "2", min: 5, max: 6 },
          { bonus: "3", min: 7, max: null },
        ].map((data) => {
          return {
            type: "enchant",
            name: `Elemental Weapon: ${utils.capitalize(element.type)} +${data.bonus}`,
            magicalBonus: {
              makeMagical: true,
              bonus: data.bonus,
              nameAddition: `+${data.bonus}`,
            },
            options: {
              description: `This weapon has become a +${data.bonus} magic weapon, granting a bonus to attack and damage rolls. It also gains additional elemental damage.`,
            },
            data: {
              img: element.img,
              "flags.ddbimporter.effectIdLevel": {
                min: data.min,
                max: data.max,
              },
            },
            changes: [
              {
                key: "system.damage.parts",
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: `[["${data.bonus}d4[${element.type}]", "${element.type}"]]`,
                priority: 20,
              },
            ],
          };
        });
      }).flat(),
    },
    "Heroism": {
      type: "spell",
      options: {
        description: "Gain temp hp at the start of your turn",
      },
      changes: [
        { key: "system.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
      ],
    },
    "Heroe's Feast": {
      type: "spell",
      changes: [
        { key: "system.traits.ci.value", value: "frightened", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
        { key: "system.traits.ci.value", value: "poisoned", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
        { key: "system.traits.di.value", value: "poison", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
      ],
    },
    "Hex": {
      type: "spell",
      name: "Hexed",
    },
    "Hold Person": {
      type: "spell",
      statuses: ["Paralyzed"],
    },
    "Hold Monster": {
      type: "spell",
      statuses: ["Paralyzed"],
    },
    "Hunter's Mark": {
      name: "Hunter's Mark",
      type: "spell",
    },
    "Light": {
      type: "spell",
      atlChanges: [
        generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'),
        generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'),
        generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": "pulse", "speed": 3,"intensity": 1}'),
      ],
    },
    "Mage Armor": {
      type: "spell",
      changes: [
        {
          key: "system.attributes.ac.calc",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "mage",
          priority: "5",
        },
      ],
    },
    "Magic Weapon": {
      multiple: [
        { bonus: "1", min: null, max: 3 },
        { bonus: "2", min: 4, max: 5 },
        { bonus: "3", min: 6, max: null },
      ].map((data) => {
        return {
          type: "enchant",
          name: `Magic Weapon +${data.bonus}`,
          magicalBonus: {
            makeMagical: true,
            bonus: data.bonus,
            nameAddition: `+${data.bonus}`,
          },
          options: {
            description: `This weapon has become a +${data.bonus} magic weapon, granting a bonus to attack and damage rolls.`,
          },
          data: {
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      }),
    },
    "Prismatic Wall": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Blinded",
          type: "spell",
          statuses: ["Blinded"],
          options: {
            durationSeconds: 60,
          },
          data: {
            "flags.ddbimporter.activityMatch": "Blinding Save",
          },
        },
        {
          name: "Restrained",
          type: "spell",
          statuses: ["Restrained"],
          options: {
            durationSeconds: 6,
            description: "Save at the end of each turn, 3 failures results in &Reference[Petrified]",
          },
          data: {
            "flags.ddbimporter.activityMatch": "Damage Save",
          },
        },
        {
          name: "Petrified",
          type: "spell",
          statuses: ["Petrified"],
          data: {
            "flags.ddbimporter.activityMatch": "Damage Save",
          },
        },
        {
          name: "Blinded",
          type: "spell",
          statuses: ["Blinded"],
          options: {
            durationSeconds: 60,
          },
          data: {
            "flags.ddbimporter.activityMatch": "Damage Save",
          },
        },
      ],
    },
    "Pyrotechnics": {
      type: "spell",
      statuses: ["Blinded"],
      data: {
        "flags.ddbimporter.activityMatch": "Fireworks",
      },
    },
    "Protection from Energy": {
      multiple: ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
        return {
          name: `Protection from ${element}`,
          type: "spell",
          changes: [
            { key: "system.traits.dr.value", value: element.toLowerCase(), mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 0 },
          ],
        };
      }),
    },
    "Ray of Enfeeblement": () => {
      return {
        type: "spell",
        name: "Enfeebled",
        options: {
          description: this.ddbParser?.spellDefinition?.description ?? "",
        },
      };
    },
    "Searing Smite": {
      type: "spell",
      name: "On fire from Searing Smite",
    },
    "Wall of Light": {
      type: "spell",
      name: "Blinded",
      statuses: ["Blinded"],
      options: {
        durationSeconds: 600,
      },
      data: {
        "flags.ddbimporter.activityMatch": "Place Wall",
      },
    },
  };

  DOCUMENT_STUB = {

  };
}
