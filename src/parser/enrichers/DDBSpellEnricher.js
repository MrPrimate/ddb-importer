import { effectModules, generateATLChange, generateCustomChange, generateOverrideChange, generateSignedAddChange, generateTokenMagicFXChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";
import AbsorbElements from "./spell/AbsorbElements.js";
import Aid from "./spell/Aid.js";
import AlterSelf from "./spell/AlterSelf.js";
// Enrichers
import ArcaneHand from "./spell/ArcaneHand.js";
import ArcaneVigor from "./spell/ArcaneVigor.js";
import EldritchBlast from "./spell/EldritchBlast.js";
import ElementalWeapon from "./spell/ElementalWeapon.js";
import FaerieFire from "./spell/FaerieFire.js";
import FireShield from "./spell/FireShield.js";
import FountOfMoonlight from "./spell/FountOfMoonlight.js";
import GlyphOfWarding from "./spell/GlyphOfWarding.js";
import HuntersMark from "./spell/HuntersMark.js";
import MagicWeapon from "./spell/MagicWeapon.js";
import PowerWordFortify from "./spell/PowerWordFortify.js";
import PrismaticWall from "./spell/PrismaticWall.js";
import ProtectionFromEnergy from "./spell/ProtectionFromEnergy.js";
import Shillelagh from "./spell/Shillelagh.js";
import Sleep from "./spell/Sleep.js";
import SpiderClimb from "./spell/SpiderClimb.js";
import TashasBubblingCauldron from "./spell/TashasBubblingCauldron.js";
import TrueStrike from "./spell/TrueStrike.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBSpellActivity;
    this.effectType = "spell";
    this.enricherType = "spell";
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  ENRICHERS = {
    "Absorb Elements": () => AbsorbElements,
    "Aid": () => Aid,
    "Alter Self": () => AlterSelf,
    "Arcane Hand": () => ArcaneHand,
    "Arcane Vigor": () => ArcaneVigor,
    "Eldritch Blast": () => EldritchBlast,
    "Elemental Weapon": () => ElementalWeapon,
    "Faerie Fire": () => FaerieFire,
    "Fire Shield": () => FireShield,
    "Fount of Moonlight": () => FountOfMoonlight,
    "Glyph of Warding": () => GlyphOfWarding,
    "Hunter's Mark": () => HuntersMark,
    "Magic Weapon": () => MagicWeapon,
    "Power Word Fortify": () => PowerWordFortify,
    "Prismatic Wall": () => PrismaticWall,
    "Protection from Energy": () => ProtectionFromEnergy,
    "Shillelagh": () => Shillelagh,
    "Sleep": () => Sleep,
    "Spider Climb": () => SpiderClimb,
    "Tasha's Bubbling Cauldron": () => TashasBubblingCauldron,
    "True Strike": () => TrueStrike,
  };

  NAME_HINTS_2014 = {};

  DND_2014 = {
    ACTIVITY_HINTS: {
      "Animate Objects": {},
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
      "Ray of Sickness": {
        noeffect: true,
      },
    },
    ADDITIONAL_ACTIVITIES: {
      "Animate Objects": [],
      "Ray of Sickness": [
        {
          constructor: {
            name: "Save vs Poisoned",
            type: "save",
          },
          build: {
            generateDamage: false,
            generateConsumption: false,
            generateSave: true,
            generateTarget: true,
            noSpellslot: true,
            saveOverride: { ability: "con", dc: { calculation: "spellcasting" } },
          },
        },
      ],
    },
    DOCUMENT_OVERRIDES: {},
    EFFECT_HINTS: {
      "Barkskin": {
        changes: [
          generateUpgradeChange("17", 100, "system.attributes.ac.min"),
        ],
      },
      "Blade Ward": {
        changes: [
          generateUnsignedAddChange("bludgeoning", 10, "system.traits.dr.value"),
          generateUnsignedAddChange("slashing", 10, "system.traits.dr.value"),
          generateUnsignedAddChange("piercing", 10, "system.traits.dr.value"),
        ],
        data: {
          "flags.dae.specialDuration": ["turnEnd"],
        },
      },
      "Mass Suggestion": {},
      "Suggestion": {
      },
    },
    DOCUMENT_STUB: {},
  };

  NAME_HINTS = {
    "Bigby's Hand": "Arcane Hand",
    "Melf's Acid Arrow": "Acid Arrow",
    "Mordenkainen's Sword": "Arcane Sword",
    "Evard's Black Tentacles": "Black Tentacles",
  };

  ACTIVITY_HINTS = {
    "Acid Arrow": {
      data: {
        "damage.parts": [
          DDBBaseEnricher.basicDamagePart({ number: 4, denomination: 4, type: "acid" }),
        ],
      },
    },
    "Animate Objects": {
    },
    "Aura of Life": {
      type: "utility",
    },
    "Arcane Eye": {
      type: "summon",
      noTemplate: true,
      profileKeys: ["ArcaneEye"],
    },
    "Arcane Sword": {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        "ArcaneSwordSpectralGreen",
        "ArcaneSwordAstralBlue",
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
      },
    },
    "Armor of Agathys": {
      type: "heal",
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
    "Command": {
      lookupName: {
        "Activate Mantle of Majesty": {
          data: {
            name: "Activate Mantle of Majesty",
          },
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
    "Dancing Lights": {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        "DancingLightsYellow",
        "DancingLightsBlueTeal",
        "DancingLightsGreen",
        "DancingLightsBlueYellow",
        "DancingLightsPink",
        "DancingLightsPurpleGreen",
        "DancingLightsRed",
      ],
      summons: {

      },
    },
    "Darkness": {
      type: "ddbmacro",
      data: {
        img: "icons/magic/unholy/orb-glowing-purple.webp",
        macro: {
          name: "Toggle Darkness",
          function: "ddb.spell.darkness",
          visible: false,
          parameters: "",
        },
      },
    },
    "Divine Favor": {
      type: "utility",
      targetType: "self",
    },
    "Divine Smite": {
      type: "damage",
      data: {
        name: "Damage",
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, type: "radiant", scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
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
        healing: DDBBaseEnricher.basicDamagePart({ customFormula: "1d4 + 4", types: ["temphp"], scalingMode: "whole", scalingNumber: 5 }),
      },
    },
    "Heroism": {
      type: "utility",
      stopHealSpellActivity: true,
      data: {
        name: "Cast",
      },
    },
    "Heroes' Feast": {
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
    "Mage Hand": {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        "MageHandRed",
        "MageHandPurple",
        "MageHandGreen",
        "MageHandBlue",
        "MageHandRock",
        "MageHandRainbow",
      ],
      summons: {
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
    "Sorcerous Burst": {
      type: "attack",
      data: {
        damage: {
          parts: [
            DDBBaseEnricher.basicDamagePart({ customFormula: "1d8x@mod=8", types: ["acid", "cold", "fire", "lightning", "poison", "psychic", "thunder"], scalingMode: "whole", scalingNumber: "1" }),
          ],
        },
      },
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
            DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 8, types: ["radiant", "necrotic", "cold"], scalingMode: "half", scalingNumber: "1" }),
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
    "Witch Bolt": {
      splitDamage: true,
    },
  };

  ADDITIONAL_ACTIVITIES = {
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
          damageParts: [DDBBaseEnricher.basicDamagePart({ bonus: "5", type: "cold", scalingFormula: "5", scalingMode: "whole" })],
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
    "Command": () => {
      if (this.useLookupName && this.ddbParser.lookupName === "Activate Mantle of Majesty") {
        return [
          {
            constructor: {
              name: "Free Cast",
              type: "save",
            },
            build: {
              noSpellslot: true,
              generateConsumption: true,
              generateSave: true,
            },
          },
        ];
      }
      return [];
    },
    "Divine Smite": [
      {
        constructor: {
          name: "Damage vs Fiends or Undead",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBBaseEnricher.basicDamagePart({ number: 3, denomination: 8, type: "radiant", scalingMode: "whole", scalingNumber: 1 })],
          noeffect: true,
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
          healingPart: DDBBaseEnricher.basicDamagePart({ customFormula: "@mod", type: "temphp" }),
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
    "Light": () => {
      const template = {
        constructor: {
          name: "Place or Remove Light",
          type: "ddbmacro",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDDBMacro: true,
          ddbMacroOverride: {
            name: "Place or Remove Light",
            function: "ddb.generic.light",
            visible: false,
            parameters: '{"distance":20,"isTemplate":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
          },
          targetOverride: {
            override: true,
            affects: { type: "" },
            template: {},
          },
        },
      };
      if (effectModules().atlInstalled) {
        return [
          template,
          {
            constructor: {
              name: "Apply Light Effect",
              type: "utility",
            },
            build: {
              generateConsumption: true,
              generateTarget: true,
              generateRange: false,
              generateActivation: true,
              targetOverride: {
                override: true,
                affects: { type: "" },
                template: {},
              },
            },
          },
        ];
      } else {
        return [
          template,
          {
            constructor: {
              name: "Place on Targetted Token or Remove",
              type: "ddbmacro",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              generateRange: false,
              generateActivation: true,
              generateDDBMacro: true,
              ddbMacroOverride: {
                name: "Place on Targetted Token",
                function: "ddb.generic.light",
                visible: false,
                parameters: '{"distance":20,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
              },
              targetOverride: {
                override: true,
                affects: { type: "" },
                template: {},
              },
            },
          },
        ];
      }
    },
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
          generateSave: true,
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
          saveOverride: {
            ability: "wis",
            dc: {
              formula: "",
              calculation: "spellcasting",
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
          generateSave: true,
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
          activationOverride: { type: "", condition: "" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
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
          activationOverride: { type: "spec", condition: "Ends turn in Light" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
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
          activationOverride: { type: "spec", condition: "" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },

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
          activationOverride: { type: "spec", condition: "Moving through/starting in Frigid Air" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
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
          activationOverride: { type: "spec", condition: "Moving through/starting in Frigid Air" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
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
    "Witch Bolt": () => {
      return [
        {
          constructor: {
            name: "Ongoing Damage",
            type: "damage",
          },
          build: {
            generateDamage: true,
            generateConsumption: false,
            generateTarget: true,
            generateActivation: true,
            activationOverride: {
              value: "1",
              type: this.is2014 ? "action" : "bonus",
            },
            targetOverride: {
              override: true,
              template: {
                count: "1",
                contiguous: false,
                type: "",
                size: this.is2014 ? "30" : "60",
                units: "ft",
              },
              affects: {},
            },
            damageParts: [
              DDBBaseEnricher.basicDamagePart({ number: 1, denomination: 12, type: "lightning", scalingMode: "none", scalingNumber: null }),
            ],
          },
        },
      ];
    },
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
    "Command": {
      lookupName: {
        "Activate Mantle of Majesty": {
          data: {
            "flags.ddbimporter": {
              ignoredConsumptionActivities: ["Free Cast"],
              // spellSlot: true,
            },
          },
        },
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
    "Acid Arrow": {
      name: "Covered in Acid",
      options: {
        durationSeconds: 6,
      },
    },
    "Animal Friendship": {
      statuses: "Charmed",
    },
    "Aura of Life": {
      changes: [
        generateUnsignedAddChange("necrotic", 20, "system.traits.dr.value"),
      ],
    },
    "Bane": {
      changes: [
        generateSignedAddChange("-1d4", 0, "system.bonuses.mwak.attack"),
        generateSignedAddChange("-1d4", 0, "system.bonuses.rwak.attack"),
        generateSignedAddChange("-1d4", 0, "system.bonuses.msak.attack"),
        generateSignedAddChange("-1d4", 0, "system.bonuses.rsak.attack"),
        generateSignedAddChange("-1d4", 20, "system.bonuses.abilities.save"),
      ],
    },
    "Barkskin": {
      changes: [
        generateUpgradeChange("17", 100, "system.attributes.ac.min"),
      ],
    },
    "Bless": {
      options: {
        durationSeconds: 60,
      },
      changes: [
        generateSignedAddChange("+1d4", 0, "system.bonuses.mwak.attack"),
        generateSignedAddChange("+1d4", 0, "system.bonuses.rwak.attack"),
        generateSignedAddChange("+1d4", 0, "system.bonuses.msak.attack"),
        generateSignedAddChange("+1d4", 0, "system.bonuses.rsak.attack"),
        generateSignedAddChange("+1d4", 20, "system.bonuses.abilities.save"),
      ],
      tokenMagicChanges: [
        generateTokenMagicFXChange("bloom"),
      ],
    },
    "Booming Blade": {
    },
    "Chill Touch": {
      changes: [
        generateUnsignedAddChange("healing", 30, "system.traits.di.value"),
      ],
    },
    "Darkvision": {
      changes: [
        generateUpgradeChange("60", 20, "system.attributes.senses.darkvision"),
      ],
      atlChanges: [
        generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 60, 5),
        generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
      ],
    },
    "Divine Favor": {
      changes: [
        generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.mwak.damage"),
        generateUnsignedAddChange("1d4[radiant]", 0, "system.bonuses.rwak.damage"),
      ],
    },
    "Feeblemind": {
      changes: [
        generateOverrideChange("1", 20, "system.abilities.cha.value"),
        generateOverrideChange("1", 20, "system.abilities.int.value"),
      ],
      midiChanges: [
        generateOverrideChange("1", 20, "flags.midi-qol.fail.spell.all"),
      ],
    },
    "Fly": {
      changes: [
        generateUpgradeChange("60", 20, "system.attributes.movement.fly"),
      ],
    },
    "Haste": {
      changes: [
        generateSignedAddChange("2", 20, "system.attributes.ac.bonus"),
      ],
      midiChanges: [
        generateOverrideChange("1", 20, "flags.midi-qol.advantage.ability.save.dex"),
        generateCustomChange("*2", 30, "system.attributes.movement.all"),
      ],
    },
    "Heroism": {
      options: {
        description: "Gain temp hp at the start of your turn",
      },
      changes: [
        generateUnsignedAddChange("frightened", 20, "system.traits.ci.value"),
      ],
    },
    "Heroes' Feast": {
      changes: [
        generateUnsignedAddChange("frightened", 20, "system.traits.ci.value"),
        generateUnsignedAddChange("poisoned", 20, "system.traits.ci.value"),
        generateUnsignedAddChange("poison", 20, "system.traits.di.value"),
      ],
    },
    "Hex": {
      name: "Hexed",
    },
    "Invisibility": {
      noCreate: true,
      data: {
        "flags.dae.specialDuration": ["1Attack", "1Spell"],
      },
    },
    "Jallarzi's Storm of Radiance": {
      clearAutoEffects: true,
      name: "Within Storm of Radiance",
      statuses: ["Blinded", "Deafened"],
      options: {
        description: "You are unable to cast spells with the verbal component",
      },
    },
    "Light": {
      atlChanges: [
        generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'),
        generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'),
        generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": "pulse", "speed": 3,"intensity": 1}'),
      ],
    },
    "Mage Armor": {
      changes: [
        generateOverrideChange("mage", 5, "system.attributes.ac.calc"),
      ],
    },
    "Mass Suggestion": {
      statuses: ["Charmed"],
    },
    "Mirror Image": {
      tokenMagicChanges: [
        generateTokenMagicFXChange("images"),
      ],
    },
    "Mind Blank": {
      changes: [
        generateUnsignedAddChange("psychic", 20, "system.traits.di.value"),
      ],
    },
    "Pass Without Trace": {
      changes: [
        generateSignedAddChange("10", 20, "system.skills.ste.bonuses.check"),
      ],
    },
    "Protection from Poison": {
      changes: [
        generateUnsignedAddChange("poison", 20, "system.traits.dr.value"),
      ],
    },
    "Pyrotechnics": {
      statuses: ["Blinded"],
      data: {
        "flags.ddbimporter.activityMatch": "Fireworks",
      },
    },
    "Ray of Enfeeblement": () => {
      return {
        name: "Enfeebled",
        options: {
          description: this.ddbParser?.ddbDefinition?.description ?? "",
        },
      };
    },
    "Searing Smite": {
      name: "On fire from Searing Smite",
    },
    "Shield": {
      changes: [
        generateSignedAddChange("5", 20, "system.attributes.ac.bonus"),
      ],
      tokenMagicChanges: [
        generateTokenMagicFXChange("water-field"),
      ],
      data: {
        "flags.dae.specialDuration": ["turnStart"],
      },
    },
    "Shield of Faith": {
      changes: [
        generateSignedAddChange("5", 20, "system.attributes.ac.bonus"),
      ],
      tokenMagicChanges: [
        generateTokenMagicFXChange("bloom"),
      ],
    },
    "Shining Smite": {
      name: "Shedding Light",
      atlChanges: [
        generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '5'),
        generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
        generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
        generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": "pulse", "speed": 3,"intensity": 1}'),
      ],
    },
    "Slow": {
      changes: [
        generateSignedAddChange("-2", 20, "system.attributes.ac.bonus"),
        generateSignedAddChange("-2", 20, "system.abilities.dex.bonuses.save"),
      ],
      midiChanges: [
        generateCustomChange("/2", 20, "system.attributes.movement.all"),
      ],
    },
    "Suggestion": {
      statuses: ["Charmed"],
    },
    "Stoneskin": {
      changes: [
        generateUnsignedAddChange("bludgeoning", 0, "system.traits.dr.value"),
        generateUnsignedAddChange("piercing", 0, "system.traits.dr.value"),
        generateUnsignedAddChange("slashing", 0, "system.traits.dr.value"),
        // {
        //   key: "system.traits.dr.bypass",
        //   value: "mgc",
        //   mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        //   priority: 0,
        // },
      ],
    },
    "Tasha's Caustic Brew": {
      name: "Covered in Acid",
      options: {
        description: "You are covered in acid. Take 2d4 &Reference[acid] damage at start of each of your turns until you use an action to scrape it off.",
      },
    },
    "Wall of Light": {
      name: "Blinded",
      statuses: ["Blinded"],
      options: {
        durationSeconds: 600,
      },
      data: {
        "flags.ddbimporter.activityMatch": "Place Wall",
      },
    },
    "Warding Bond": () => {
      const damageChanges = DDBBaseEnricher.allDamageTypes().map((type) => {
        return generateUnsignedAddChange(type, 0, "system.traits.dr.value");
      });
      return {
        changes: [
          ...damageChanges,
          generateSignedAddChange("1", 20, "system.attributes.ac.bonus"),
          generateSignedAddChange("1", 20, "system.bonuses.abilities.save"),
        ],
      };
    },
    "Witch Bolt": {
    },
  };

  DOCUMENT_STUB = {

  };
}
