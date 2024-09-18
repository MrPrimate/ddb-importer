import DICTIONARY from "../../dictionary.js";
import { generateTokenMagicFXChange } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import logger from "../../logger.js";
import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBSpellActivity;
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

  eldritchBlastAdjustments() {
    const eldritchBlastMods = this.ddbParser?.ddbData
      ? this._getEldritchInvocations()
      : null;

    const bonus = eldritchBlastMods.damage
      ? `${eldritchBlastMods["damage"]}`
      : "";

    const damage = [DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 10, type: "force", bonus })];

    if (eldritchBlastMods.range && Number.parseInt(eldritchBlastMods.range)) {
      this.document.data.system.range = `${Number.parseInt(this.document.system.range.value) + Number.parseInt(eldritchBlastMods["range"])}`;
    }

    return damage;
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
      data: {
        damage: {
          parts: this.eldritchBlastAdjustments(),
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
    "Primal Savagery": {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
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
            ddbimporter: {
              activityMatch: "Absorb Elements Effect",
            },
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
    "Pyrotechnics": {
      type: "spell",
      statuses: ["Blinded"],
      data: {
        flags: {
          ddbimporter: {
            activityMatch: "Fireworks",
          },
        },
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
    "Ray of Enfeeblement": {
      type: "spell",
      name: "Enfeebled",
      options: {
        description: this.ddbParser?.spellDefinition?.description ?? "",
      },
    },
    "Searing Smite": {
      type: "spell",
      name: "On fire from Searing Smite",
    },
  };

  DOCUMENT_STUB = {

  };
}
