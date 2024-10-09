import DICTIONARY from "../../dictionary.js";
import { effectModules, generateATLChange, generateCustomChange, generateOverrideChange, generateSignedAddChange, generateTokenMagicFXChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBSummonsManager from "../companions/DDBSummonsManager.js";
import DDBSpellActivity from "../spells/DDBSpellActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDSpellEnricher extends DDBBaseEnricher {
  constructor() {
    super();
    this.additionalActivityClass = DDBSpellActivity;
    this.effectType = "spell";
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
    NAME_HINTS: {
    },
    ACTIVITY_HINTS: {
      "Animate Objects": {
      },
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
      "True Strike": {},
    },
    ADDITIONAL_ACTIVITIES: {
      "Animate Objects": [],
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
      "True Strike": [],
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
      "Shillelagh": {
        multiple: () => {
          return ["Physical", "Spellcasting"].map((type) => {
            const changes = [
              generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
              generateUnsignedAddChange("mgc", 20, "system.properties"),
              generateOverrideChange("1", 20, "system.damage.base.number"),
              generateOverrideChange("8", 20, "system.damage.base.denomination"),
            ];
            const spellCastingChanges = type !== "Physical"
              ? [generateOverrideChange("spellcasting", 20, "system.ability")]
              : [];

            return {
              name: `Shillelagh (${type})`,
              type: "enchant",
              changes: [...changes, ...spellCastingChanges],
            };
          });
        },
      },
      "Suggestion": {
      },
      "True Strike": {},
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
    "Alter Self": {
      type: "utility",
      data: {
        name: "Aquatic Adaptation",
        img: "icons/creatures/fish/fish-bluefin-yellow-blue.webp",
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
    "Arcane Hand": () => {
      return {
        type: "summon",
        noTemplate: true,
        generateSummons: !this.is2014,
        summonsFunction: DDBSummonsManager.get2024ArcaneHands,
        profileKeys: this.is2014
          ? [
            "ArcaneHandRed",
            "ArcaneHandPurple",
            "ArcaneHandGreen",
            "ArcaneHandBlue",
            "ArcaneHandRock",
            "ArcaneHandRainbow",
          ]
          : [
            "BigbysHandRed2024",
            "BigbysHandPurple2024",
            "BigbysHandGreen2024",
            "BigbysHandBlue2024",
            "BigbysHandRock2024",
            "BigbysHandRainbow2024",
          ],
        summons: {
          "match": {
            "proficiency": false,
            "attacks": true,
            "saves": false,
          },
          "bonuses": {
            "ac": "",
            "hp": "@attributes.hp.max",
            "attackDamage": "",
            "saveDamage": "",
            "healing": "",
          },
        },
      };
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
    "Arcane Vigor": {
      type: "utility",
      data: {
        name: "Cast Spell",
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
    "Fire Shield": {
      type: "utility",
    },
    "Fount of Moonlight": () => {
      if (effectModules().atlInstalled) {
        return {
          type: "utility",
          data: {
            name: "Cast Spell",
          },
        };
      } else {
        return {
          type: "ddbmacro",
          data: {
            name: "Cast Spell",
            macro: {
              name: "Place Light on Token",
              function: "ddb.generic.light",
              visible: false,
              parameters: '{"distance":20,"targetsSelf":true,"targetsToken":true,"lightConfig":{"dim":40,"bright":20},"flag":"light"}',
            },
          },
        };
      }
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
    "Hunter's Mark": {
      type: "utility",
      data: {
        name: "Cast",
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
    "Shillelagh": {
      type: "enchant",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
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
    "Tasha's Bubbling Cauldron": {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        "TashasBubblingCauldron",
      ],
      addItemConsume: true,
      itemConsumeValue: "-@attributes.spelldc",
      data: {
        name: "Create Cauldron",
        img: "systems/dnd5e/icons/svg/activity/summon.svg",
        target: {
          override: true,
          template: {
            count: "1",
            contiguous: false,
            type: "",
            size: "",
            height: "",
            units: "",
          },
          affects: {},
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
    "True Strike": {
      type: "enchant",
      data: {
        name: "Enchant Weapon",
        restrictions: {
          type: "weapon",
          allowMagical: true,
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
    "Alter Self": [
      {
        constructor: {
          name: "Change Appearance",
          type: "utility",
        },
        build: {
          img: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          generateConsumption: true,
        },
      },
      {
        constructor: {
          name: "Natural Weapons",
          type: "enchant",
        },
        build: {
          img: "icons/creatures/abilities/fang-tooth-blood-red.webp",
          generateDamage: false,
          generateHealing: false,
          generateRange: false,
          generateConsumption: true,
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ],
    "Arcane Vigor": () => {
      return [4, 6, 8, 10, 12]
        .map((die) => {
          return {
            constructor: {
              name: `Spend spells level HD (d${die})`,
              type: "heal",
            },
            build: {
              generateDamage: false,
              generateHealing: true,
              generateRange: true,
              generateConsumption: true,
              healingPart: DDBBaseEnricher.basicDamagePart({ number: 2, denomination: die, bonus: "@mod", type: "healing", scalingMode: "whole", scalingNumber: 1 }),
              consumptionOverride: {
                spellSlot: false,
                scaling: {
                  allowed: true,
                  max: "@item.level",
                },
                targets: [
                  {
                    type: "hitDice",
                    target: `d${die}`,
                    value: 2,
                    scaling: {
                      mode: "amount",
                      formula: "1",
                    },
                  },
                ],
              },
            },
          };
        });
    },
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
    "Fount of Moonlight": [
      {
        constructor: {
          name: "Force Blinding Save",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateSave: true,
          noSpellslot: true,
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
          },
          targetOverride: {
            affects: {
              type: "creature",
              count: "1",

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
          activationOverride: { type: "spec", condition: "Within 20ft" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
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
          activationOverride: { type: "spec", condition: "Moving through" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
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
    "Tasha's Bubbling Cauldron": [
      {
        constructor: {
          name: "Withdraw Potion",
          type: "utility",
        },
        build: {
          img: "systems/dnd5e/icons/svg/ink-pot.svg",
          generateDamage: true,
          generateConsumption: true,
          consumeItem: true,
          noSpellslot: true,
          generateAttack: false,
          noeffect: true,
          activationOverride: { type: "bonus", condition: "" },
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
    "Eldritch Blast": () => {
      return {
        data: {
          "system.range.value": this.eldritchBlastRangeAdjustments(this.ddbParser.spellDefinition?.range?.rangeValue ?? 0),
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
    "Power Word Fortify": {
      descriptionSuffix: `
<details>
    <summary><strong>Temp HP Helpers</strong></summary>
    <p>[[/healing 20 type=temphp]]</p>
    <p>[[/healing 30 type=temphp]]</p>
    <p>[[/healing 40 type=temphp]]</p>
    <p>[[/healing 60 type=temphp]]</p>
    <p>[[/healing 120 type=temphp]]</p>
</details>`,
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
    "Tasha's Bubbling Cauldron": () => {
      let descriptionSuffix = "";
      if (this.ddbParser.itemCompendium) {
        const possibleItems = this.ddbParser.itemCompendium.index
          .filter((i) => ["common", "uncommon"].includes(i.system.rarity)
            && i.type == "consumable"
            && i.system.type.value === "potion"
            && i.name.toLowerCase().includes("potion"),
          );
        if (possibleItems.length > 0) {
          descriptionSuffix += `<details>
<summary><strong>Suggested Potions</strong></summary>`;
          for (const item of possibleItems) {
            descriptionSuffix += `<p>@UUID[${item.uuid}]</p>`;
          }
          descriptionSuffix += "</details>";
        }
      }
      descriptionSuffix += `
<section class="secret" id="secret-ddbTasBubCauldro">
<p><strong>Implementation Details</strong></p>
<p>The Uses of this spell represent the number of potions remaining in the cauldron, which is reset by the <strong>Create Cauldron</strong> activity.</p>
<p>The <strong>Withdraw Potion</strong> activity will consume a use of the cauldron.</p>
</section>`;
      return {
        descriptionSuffix,
        data: {
          "system.uses": {
            max: "@attributes.spellmod",
            spent: "0",
          },
        },
      };
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
          changes: [
            generateUnsignedAddChange(element.toLowerCase(), 1, "system.traits.dr.value"),
          ],
          data: {
            "flags.ddbimporter.activityMatch": "Absorb Elements Effect",
          },
        };
      }),
    },
    "Acid Arrow": {
      name: "Covered in Acid",
      options: {
        durationSeconds: 6,
      },
    },
    "Aid": {
      multiple: [2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
        return {
          name: `Aid: Level ${level} Temp Max HP Bonus`,
          changes: [
            generateUnsignedAddChange(`${5 * (level - 1)}`, 20, "system.attributes.hp.bonuses.overall"),
          ],
        };
      }),
    },
    "Alter Self": {
      multiple: () => {
        const effects = [];
        const naturalWeaponEffect = {
          name: "Natural Weapons",
          type: "enchant",
          changes: [
            generateOverrideChange(`{} [Natural Weapons]`, 20, "name"),
            generateUnsignedAddChange("mgc", 20, "system.properties"),
            generateOverrideChange("1", 20, "system.damage.base.number"),
            generateOverrideChange("6", 20, "system.damage.base.denomination"),
            generateUnsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
            generateUnsignedAddChange("piercing", 20, "system.damage.base.types"),
            generateUnsignedAddChange("slashing", 20, "system.damage.base.types"),
          ],
          data: {
            "flags.ddbimporter.activityMatch": "Natural Weapons",
          },
        };
        if (this.is2014) {
          naturalWeaponEffect.magicalBonus = {
            makeMagical: false,
            bonus: "1",
          };
        } else {
          naturalWeaponEffect.changes.push(
            generateOverrideChange("spellcasting", 20, "system.ability"));
        }

        effects.push(naturalWeaponEffect);
        effects.push(
          {
            name: "Change Appearance",
            data: {
              "flags.ddbimporter.activityMatch": "Change Appearance",
            },
          },
          {
            name: "Aquatic Adaptation",
            data: {
              "flags.ddbimporter.activityMatch": "Aquatic Adaptation",
            },
            changes: [
              generateUpgradeChange("@attributes.movement.walk", 5, "system.attributes.movement.swim"),
            ],
          },
        );

        return effects;
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
              bonus: `+${data.bonus}`,
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
              generateUnsignedAddChange(`[["${data.bonus}d4[${element.type}]", "${element.type}"]]`, 20, "system.damage.parts"),
            ],
          };
        });
      }).flat(),
    },
    "Faerie Fire": {
      multiple: () => {
        return [
          { colour: "Blue", hex: "#5ab9e2" },
          { colour: "Green", hex: "#55d553" },
          { colour: "Violet", hex: "#844ec6" },
        ].map((data) => {
          return {
            name: `${data.colour} Light`,
            midiChanges: [
              generateCustomChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
            ],
            atlChanges: [
              generateOverrideChange(data.hex, 30, "ATL.light.color"),
              generateOverrideChange("0.65", 30, "ATL.light.alpha"),
              generateOverrideChange("10", 30, "ATL.light.dim"),
              generateOverrideChange('{"type": "pulse","speed": 1,"intensity": 3}', 30, "ATL.light.animation"),
            ],
            tokenMagicChanges: [
              generateTokenMagicFXChange("glow"),
            ],
          };
        });
      },
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
    "Fire Shield": {
      multiple: [
        {
          name: "Cold Shield",
          changes: [
            generateUnsignedAddChange("fire", 0, "system.traits.dr.value"),
          ],
        },
        {
          name: "Warm Shield",
          changes: [
            generateUnsignedAddChange("cold", 0, "system.traits.dr.value"),
          ],
        },
      ],
    },
    "Fly": {
      changes: [
        generateUpgradeChange("60", 20, "system.attributes.movement.fly"),
      ],
    },
    "Fount of Moonlight": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Wreathed in Moonlight",
          data: {
            "flags.ddbimporter.activityMatch": "Cast Spell",
          },
          options: {
            durationSeconds: 600,
            durationRounds: 60,
          },
          changes: [
            generateUnsignedAddChange("radiant", 20, "system.traits.dr.value"),
            generateUnsignedAddChange("2d6[radiant]", 20, "system.bonuses.mwak.damage"),
            generateUnsignedAddChange("2d6[radiant]", 20, "system.bonuses.msak.damage"),
          ],
          atlChanges: [
            generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'),
            generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'),
            generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'),
            generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'),
          ],
        },
        {
          name: "Blinded by Moonlight",
          data: {
            "flags.ddbimporter.activityMatch": "Force Blinding Save",
          },
          options: {
            durationSeconds: 6,
          },
          statuses: ["Blinded"],
        },
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
    "Hunter's Mark": {
      name: "Hunter's Mark",
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
    "Prismatic Wall": {
      clearAutoEffects: true,
      multiple: [
        {
          name: "Blinded",
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
          statuses: ["Petrified"],
          data: {
            "flags.ddbimporter.activityMatch": "Damage Save",
          },
        },
        {
          name: "Blinded",
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
      statuses: ["Blinded"],
      data: {
        "flags.ddbimporter.activityMatch": "Fireworks",
      },
    },
    "Protection from Energy": {
      multiple: ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
        return {
          name: `Protection from ${element}`,
          changes: [
            generateUnsignedAddChange(element.toLowerCase(), 0, "system.traits.dr.value"),
          ],
        };
      }),
    },
    "Ray of Enfeeblement": () => {
      return {
        name: "Enfeebled",
        options: {
          description: this.ddbParser?.spellDefinition?.description ?? "",
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
    "Shillelagh": {
      multiple: () => {
        return ["Physical", "Spellcasting"].map((type) => {
          return [
            { level: 1, denomination: 8 },
            { level: 5, denomination: 10 },
            { level: 11, denomination: 12 },
            { level: 17, number: 2, denomination: 6 },
          ].map((data) => {
            const changes = [
              generateOverrideChange(`{} [${this.data.name.split("(")[0]}]`, 20, "name"),
              generateUnsignedAddChange("mgc", 20, "system.properties"),
              generateOverrideChange(`${data.number ?? 1}`, 20, "system.damage.base.number"),
              generateOverrideChange(`${data.denomination}`, 20, "system.damage.base.denomination"),
              generateUnsignedAddChange("force", 20, "system.damage.base.types"),
            ];
            const spellcastingChanges = type !== "Physical"
              ? [generateOverrideChange("spellcasting", 20, "system.ability")]
              : [];

            return {
              name: `Shillelagh (${type}) - Level ${data.level}`,
              type: "enchant",
              changes: [...changes, ...spellcastingChanges],
            };
          });
        }).flat();
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
    "Spider Climb": {
      changes: [
        generateUpgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
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
    "True Strike": {
      multiple: [
        { type: "Melee", img: "icons/skills/melee/strike-sword-slashing-red.webp" },
        { type: "Ranged", img: "icons/skills/ranged/arrow-strike-glowing-teal.webp" },
      ].map((data) => {
        return {
          type: "enchant",
          name: `${data.type} Weapon`,
          options: {
            description: `This weapon is infused with True Strike`,
          },
          changes: [
            generateUnsignedAddChange("{} (True Strike)", 20, "name"),
            generateUnsignedAddChange("radiant", 20, "system.damage.base.types"),
            generateUnsignedAddChange("(floor((@details.level + 1) / 6))d6[radiant]", 20, "system.damage.base.bonus"),
            generateOverrideChange("spellcasting", 20, "system.ability"),
          ],
          data: {
            img: data.img,
          },
        };
      }),
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
      const damageChanges = DDBBaseEnricher.allDamageTypes.map((type) => {
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
