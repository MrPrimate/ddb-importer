import { logger } from "../../lib/_module";
import AdvancementHelper from "../advancements/AdvancementHelper";
import { registerSpecialAdvancements } from "../lib/SpecialAdvancements";
import SpellListExtractor from "../enrichers/data/SpellListExtractor";
import { DDBDataUtils, SystemHelpers } from "../lib/_module";
import DDBBaseClass from "./DDBBaseClass";

export default class DDBSubClass extends DDBBaseClass {
  // these are advancement helpers
  static override SPECIAL_ADVANCEMENTS: TDDBClassSpecialAdvancements = {
    "Combat Superiority": {
      fix: true,
      fixFunction: AdvancementHelper.renameTotal,
      additionalAdvancements: true,
      additionalFunctions: [AdvancementHelper.addAdditionalUses, AdvancementHelper.addSingularDie],
    },
    "Rune Carver": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Known Runes", identifier: "rune" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    // Gunslinger (TGC) Secret Agent: bracketed name would slug to
    // parting-shot-maneuver; the scale is the maneuver's own risk-sized die
    "Parting Shot [Maneuver]": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Parting Shot Die", identifier: "parting-shot" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    "Psionic Power": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Energy Die", identifier: "energy-die" },
      // fixFunctions: [
      // {
      //   fn: AdvancementHelper.addDiceRange,
      //   args: { number: [4, 6, 8, 8, 10, 12] },
      // },
      // ],
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    // Misfortune Bringer: DDB's levelScale on Misfortunist is the number of Misfortunes known;
    // Jinx Points have no DDB scale (4, then 6 at rogue 13) so they are added by hand
    "Misfortunist": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Misfortunes Known", identifier: "misfortunes-known" },
      additionalAdvancements: true,
      additionalFunctions: [
        // deferred so this static table only reads the helper while modules load (tests stub it empty)
        (advancement) => AdvancementHelper.fixedNumberScale({
          name: "Jinx Points",
          identifier: "jinx-points",
          scale: { 3: 4, 13: 6 },
        })(advancement),
      ],
    },
    // DDB only records the level 17 value; a scale with no entry at or below the current level
    // resolves to nothing, so the level 9 single use is added
    "Steal Luck": {
      fix: true,
      fixFunctions: [{ fn: AdvancementHelper.addScaleEntries, args: { scale: { 9: { value: 1 } } } }],
    },
    // "Arcane Shot Options": {
    //   fix: true,
    //   fixFunction: AdvancementHelper.rename,
    //   functionArgs: { newName: "Damage", identifier: "damage" },
    //   additionalAdvancements: false,
    //   additionalFunctions: [],
    // },
  };

  static override NOT_ADVANCEMENT_FOR_FEATURE = [
    "Soul Blades",
    // Kindred (VtM): text-only levelScales (a sentence, no dice/number) that
    // would generate junk string scale advancements
    "Depth of Feelings",
    "Hidden in Plain Sight",
  ];

  static NOT_SPELL_LIST_ADVANCEMENTS = [
    "Circle of the Land Spells",
  ];

  static FORCE_SPELL_LIST_ADVANCEMENTS: string[] = [];

  static override NO_ADVANCEMENT_2014: string[] = [];

  static override NO_ADVANCEMENT_2024: string[] = [];

  declare data: I5eSubclassItem;

  override _fleshOutCommonDataStub() {
    super._fleshOutCommonDataStub();
    // add parent class identifier
    this.data.system.classIdentifier = DDBDataUtils.classIdentifierName(this.ddbClass.definition.name);
  }

  _generateDataStub() {
    const subclassDefinition = this.ddbClass.subclassDefinition;
    if (!subclassDefinition) {
      throw new Error(`DDBSubClass: no subclass definition found for class ${this.ddbClass.definition.name}`);
    }
    this.data = {
      _id: foundry.utils.randomID(),
      name: subclassDefinition.name.replace("(2014)", "").trim(),
      type: "subclass",
      system: SystemHelpers.getTemplate("subclass"),
      flags: {
        ddbimporter: {
          class: this.ddbClass.definition.name,
          subclass: subclassDefinition.name,
          id: this.ddbClass.id,
          classDefinitionId: this.ddbClass.definition.id,
          definitionId: subclassDefinition.id,
          subclassDefinitionId: subclassDefinition.id,
          type: "class",
          ddbImg: subclassDefinition.portraitAvatarUrl ?? this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
      },
      img: null,
      // img and flags.ddbimporter.ddbImg are legitimately null at this stage, but the shared
      // document/flag types only allow string, so the direct cast fails overlap checks
    } as unknown as I5eSubclassItem;
  }

  subClassName;

  override isSubClass = true;

  constructor(ddb: IDDBData, classId: number, options = {}) {
    super(ddb, classId, options);

    // adjustments for subclass
    const subclassDefinition = this.ddbClass.subclassDefinition;
    if (!subclassDefinition) {
      // unreachable in practice: _generateDataStub in the super constructor has already thrown
      throw new Error(`DDBSubClass: no subclass definition found for class ${this.ddbClass.definition.name}`);
    }
    this.ddbClassDefinition = subclassDefinition;
    this.isSubClass = true;
    this.name = subclassDefinition.name;
    this.subClassName = subclassDefinition.name;
    this._processSources();
    this.advancementHelper.isSubclass = true;

    this.SPECIAL_ADVANCEMENTS = DDBSubClass.SPECIAL_ADVANCEMENTS;
    this.NOT_ADVANCEMENT_FOR_FEATURE = DDBSubClass.NOT_ADVANCEMENT_FOR_FEATURE;
    this.NO_ADVANCEMENT_2014 = DDBSubClass.NO_ADVANCEMENT_2014;
    this.NO_ADVANCEMENT_2024 = DDBSubClass.NO_ADVANCEMENT_2024;
    this.FORCE_SPELL_LIST_ADVANCEMENTS = DDBSubClass.FORCE_SPELL_LIST_ADVANCEMENTS;
    this.NOT_SPELL_LIST_ADVANCEMENTS = DDBSubClass.NOT_SPELL_LIST_ADVANCEMENTS;

  }

  _bloodHunterFixes() {
    if (this.data.name.startsWith("Order of the Profane Soul")) {
      this.data.name = "Order of the Profane Soul";
      const slotsScaleValue = AdvancementHelper.buildNumberScale({
        name: "Pact Slots",
        identifier: "pact-slots",
        scale: {
          3: 1,
          6: 2,
        },
      });

      const levelScaleValue = AdvancementHelper.buildNumberScale({
        name: "Pact Level",
        identifier: "pact-level",
        scale: {
          3: 1,
          7: 2,
          13: 3,
        },
      });

      this._addAdvancements([slotsScaleValue, levelScaleValue]);
    }
  }

  _barbarianFixes() {
    if (this.data.name.startsWith("Path of the Storm Herald")) {
      const desert = AdvancementHelper.buildNumberScale({
        name: "Storm Aura Desert",
        identifier: "storm-aura-desert",
        scale: {
          3: 2,
          5: 3,
          10: 4,
          15: 5,
          20: 6,
        },
      });

      const sea = AdvancementHelper.buildDiceScale({
        name: "Storm Aura Sea",
        identifier: "storm-aura-sea",
        scale: {
          3: { number: 1, faces: 6 },
          10: { number: 2, faces: 6 },
          15: { number: 3, faces: 6 },
          20: { number: 4, faces: 6 },
        },
      });

      const tundra = AdvancementHelper.buildNumberScale({
        name: "Storm Aura Tundra",
        identifier: "storm-aura-tundra",
        scale: {
          3: 2,
          5: 3,
          10: 4,
          15: 5,
          20: 6,
        },
      });

      this._addAdvancements([desert, sea, tundra]);
    }
  }

  _druidFixes() {
    if (this.data.name.startsWith("Circle of the Moon")) {
      const crScale: Record<string, I5eAdvScaleValueEntry> = {
        6: { value: 2 },
        9: { value: 3 },
        12: { value: 4 },
        15: { value: 5 },
        18: { value: 6 },
      };
      const cr: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: `wild-shape-cr`,
          type: "cr",
          scale: crScale,
        },
        value: {},
        name: `Wild Shape CR`,
        icon: null,
      };
      if (this.is2014) {
        crScale[2] = {
          value: 1,
        };
      } else {
        crScale[3] = {
          value: 1,
        };
      }
      this._addAdvancement(cr);
    } else if (this.data.name.startsWith("Circle of the Land") && !this.is2014) {
      const aid = AdvancementHelper.buildDiceScale({
        name: "Lands Aid Dice",
        identifier: "lands-aid",
        scale: {
          3: { number: 2, faces: 6 },
          10: { number: 3, faces: 6 },
          14: { number: 4, faces: 6 },
        },
      });
      this._addAdvancement(aid);
    } else if (this.data.name.startsWith("Circle of the Stars") && !this.is2014) {
      const form = AdvancementHelper.buildDiceScale({
        name: "Starry Form Dice",
        identifier: "starry-form",
        scale: {
          3: { number: 1, faces: 8 },
          10: { number: 2, faces: 8 },
        },
      });
      this._addAdvancement(form);
    } else if ((this.data.name.startsWith("Circle of the Sea"))) {
      const form = AdvancementHelper.buildNumberScale({
        name: "Wrath Range",
        identifier: "wrath-range",
        scale: {
          3: 5,
          6: 10,
        },
      });
      this._addAdvancement(form);
    }
  }

  _fighterFixes() {
    if ((this.data.name.startsWith("Psi Warrior") || this.data.name.startsWith("Soulknife")) && !this.is2014) {
      const advancementData = this._advancementData;
      for (const [id, advancement] of Object.entries(advancementData)) {
        if (advancement.name !== "Energy Die") continue;
        if (!AdvancementHelper.hasScaleConfiguration(advancement)) continue;
        advancement.configuration.scale = foundry.utils.mergeObject(advancement.configuration.scale, {
          3: { number: 4, faces: 6 },
          5: { number: 6, faces: 8 },
          9: { number: 8, faces: 8 },
          11: { number: 8, faces: 10 },
          13: { number: 10, faces: 10 },
          17: { number: 12, faces: 12 },
        });
        advancementData[id] = advancement;
      }
    } else if (this.data.name.startsWith("Rune Knight")) {
      const number = AdvancementHelper.buildNumberScale({
        name: "Rune Uses",
        identifier: "rune-uses",
        scale: {
          3: 1,
          15: 2,
        },
      });

      this._addAdvancement(number);
    } else if (this.data.name.startsWith("Steel Hawk")) {
      const advancementData = this._advancementData;
      for (const [id, advancement] of Object.entries(advancementData)) {
        if (advancement.name !== "Launch") continue;
        if (!AdvancementHelper.hasScaleConfiguration(advancement)) continue;
        advancement.configuration.scale = {
          3: { number: 3, faces: 8 },
          7: { number: 4, faces: 8 },
          10: { number: 4, faces: 10 },
          15: { number: 5, faces: 10 },
          18: { number: 5, faces: 12 },
        };
        advancementData[id] = advancement;
      }
    } else if (this.data.name.startsWith("Arcane Archer") && this.is2014) {
      const secondary = AdvancementHelper.buildDiceScale({
        name: "Secondary Damage Dice",
        identifier: "secondary-damage",
        scale: {
          18: { number: 2, faces: 6 },
        },
      });
      this._addAdvancement(secondary);
      const minor = AdvancementHelper.buildDiceScale({
        name: "Minor Damage Dice",
        identifier: "minor-damage",
        scale: {
          3: { number: 1, faces: 6 },
          18: { number: 2, faces: 6 },
        },
      });
      this._addAdvancement(minor);
    }
  }

  _rangerFixes() {
    if (this.data.name.startsWith("Drakewarden")) {
      const advancementData = this._advancementData;
      for (const [id, advancement] of Object.entries(advancementData)) {
        if (advancement.name !== "Drake Companion") continue;
        const configuration = ((advancement as I5eAdvancementScaleValue).configuration ??= {});
        configuration.type = "dice";
        configuration.scale = {
          7: { number: 1, faces: 6 },
          15: { number: 2, faces: 6 },
        };
        advancementData[id] = advancement;
      }
    } else if (this.data.name.startsWith("Grim Harbinger")) {
      const minor = AdvancementHelper.buildDiceScale({
        name: "Grim Damage Dice",
        identifier: "grim-damage",
        scale: {
          7: { number: 1, faces: 6 },
          15: { number: 2, faces: 6 },
        },
      });
      this._addAdvancement(minor);
    }
  }

  async _bardFixes() {
    if (this.data.name.startsWith("College of the Moon")) {
      const cantripChoiceAdvancement = await AdvancementHelper.getCantripChoiceAdvancement({
        choices: [],
        abilities: ["cha"],
        hint: "Pick a druid cantrip",
        name: "Druidic Lore",
        spellListChoice: "Druid",
        spellLinks: this.spellLinks,
        is2024: true,
        choiceLevel: 3,
      });
      if (cantripChoiceAdvancement) {
        const update: I5eAdvancementItemChoice = {
          configuration: {
            restriction: {
              list: [
                "class:druid",
              ],
            },
          },
        };
        cantripChoiceAdvancement.updateSource(update as any);
        this._addAdvancement(cantripChoiceAdvancement.toObject() as I5eAdvancement);
      }
    }
  }

  _sorcererFixes() {
    if (this.data.name.startsWith("Spellfire Sorcery")) {
      const dice = AdvancementHelper.buildDiceScale({
        name: "Spellfire Burst Damage Dice",
        identifier: "spellfire-burst-damage-dice",
        scale: {
          3: { number: 1, faces: 4 },
          14: { number: 1, faces: 8 },
        },
      });
      this._addAdvancement(dice);
    }
  }

  _artificerFixes() {
    if (this.data.name.startsWith("Alchemist")) {
      if (this.is2024) {
        const elixir: I5eAdvancementScaleValue = {
          type: "ScaleValue",
          configuration: {
            identifier: "experimental-elixir",
            type: "number",
            scale: {
              "3": {
                "value": 2,
              },
              "5": {
                "value": 3,
              },
              "9": {
                "value": 4,
              },
              "15": {
                "value": 5,
              },
            },
          },
          name: "Experimental Elixir",
        };
        this._addAdvancement(elixir);
      }
    } else if (this.data.name.startsWith("Armorer") && this.is2024) {
      const advancementData = this._advancementData;
      for (const [id, advancement] of Object.entries(advancementData)) {
        if (advancement.name !== "Improved Armorer") continue;
        const configuration = ((advancement as I5eAdvancementScaleValue).configuration ??= {});
        (configuration.scale ??= {})[3] = { value: 0 };
        advancementData[id] = advancement;
      }
      const forceDemolisher: I5eAdvancement = {
        type: "ScaleValue",
        configuration: {
          identifier: "force-demolisher",
          type: "dice",
          scale: {
            3: { number: 1, faces: 10 },
            14: { number: 2, faces: 6 },
          },
        },
        name: "Force Demolisher",
      };
      this._addAdvancement(forceDemolisher);
      const lightningLauncher: I5eAdvancement = {
        type: "ScaleValue",
        configuration: {
          identifier: "lightning-launcher",
          type: "dice",
          scale: {
            3: { number: 1, faces: 8 },
            14: { number: 1, faces: 10 },
          },
        },
        name: "Lightning Launcher",
      };
      this._addAdvancement(lightningLauncher);
      const thunderPulse: I5eAdvancement = {
        type: "ScaleValue",
        configuration: {
          identifier: "thunder-pulse",
          type: "dice",
          scale: {
            3: { number: 1, faces: 6 },
            14: { number: 2, faces: 6 },
          },
        },
        name: "Thunder Pulse",
      };
      this._addAdvancement(thunderPulse);
    } else if (this.data.name.startsWith("Artillerist") && this.is2024) {
      const damage: I5eAdvancement = {
        type: "ScaleValue",
        configuration: {
          identifier: "eldritch-cannon",
          type: "dice",
          scale: {
            3: { number: 2, faces: 8 },
            9: { number: 3, faces: 8 },
          },
        },
        name: "Eldritch Cannon Damage Dice",
      };
      this._addAdvancement(damage);
      const healing: I5eAdvancement = {
        type: "ScaleValue",
        configuration: {
          identifier: "healing-dice",
          type: "dice",
          scale: {
            3: { number: 1, faces: 8 },
            9: { number: 2, faces: 8 },
          },
        },
        name: "Protector Healing Dice",
      };
      this._addAdvancement(healing);
    } else if (this.data.name.startsWith("Maverick")) {
      const maxPrototypes: I5eAdvancementScaleValue = {
        type: "ScaleValue",
        configuration: {
          identifier: "arcane-prototypes-max",
          type: "number",
          scale: {
            "3": { "value": 1 },
            "5": { "value": 2 },
            "9": { "value": 3 },
            "15": { "value": 4 },
            "20": { "value": 5 },
          },
        },
        name: "Max Number of Prototypes",
      };
      this._addAdvancement(maxPrototypes);
      const maxSpellLevel: I5eAdvancementScaleValue = {
        type: "ScaleValue",
        configuration: {
          identifier: "arcane-prototype-max-spell-level",
          type: "number",
          scale: {
            "3": { "value": 1 },
            "5": { "value": 2 },
            "9": { "value": 3 },
            "13": { "value": 4 },
            "15": { "value": 5 },
            "17": { "value": 6 },
          },
        },
        name: "Max Spell Level",
      };
      this._addAdvancement(maxSpellLevel);
      const arcaneCharges: I5eAdvancementScaleValue = {
        type: "ScaleValue",
        configuration: {
          identifier: "arcane-charges",
          type: "number",
          scale: {
            "3": { "value": 1 },
            "5": { "value": 3 },
            "9": { "value": 5 },
            "13": { "value": 7 },
            "15": { "value": 9 },
            "17": { "value": 11 },
            "20": { "value": 13 },
          },
        },
        name: "Arcane Charges",
      };
      this._addAdvancement(arcaneCharges);
    } else if (this.data.name.startsWith("Forge Adept")) {
      const advancementData = this._advancementData;
      for (const [id, advancement] of Object.entries(advancementData)) {
        if (advancement.name !== "Ghaal'Shaarat") continue;
        ((advancement as I5eAdvancementScaleValue).configuration ??= {}).scale = {
          "3": { "value": 1 },
          "9": { "value": 2 },
          "15": { "value": 3 },
        };
        advancementData[id] = advancement;
      }
    }
  }

  _monkFixes() {
    if (this.data.name.startsWith("Way of the Ascendant Dragon")) {
      // for (let advancement of this.data.system.advancement) {
      //   if (advancement.name !== "Breath of the Dragon") continue;
      //   advancement.configuration.scale['17'] = { number: 4, faces: 10 };
      // }
      // const breathConeSize = {
      //   type: "ScaleValue",
      //   configuration: {
      //     identifier: "breath-cone-size",
      //     type: "number",
      //     scale: {
      //       "3": {
      //         "value": 20,
      //       },
      //       "17": {
      //         "value": 60,
      //       },
      //     },
      //   },
      //   title: "Breath Weapon Cone Size",
      // };
      // this._addAdvancement(breathConeSize);
      // const breathLineSize = {
      //   type: "ScaleValue",
      //   configuration: {
      //     identifier: "breath-line-size",
      //     type: "number",
      //     scale: {
      //       "3": {
      //         "value": 30,
      //       },
      //       "17": {
      //         "value": 90,
      //       },
      //     },
      //   },
      //   title: "Breath Weapon Line Size",
      // };
      // this._addAdvancement(breathLineSize);
    }
  }

  async _pugilistFixes() {
    if (this.data.name.startsWith("")) {
      // add spell advancement 2 cantrips from warlock list
      // add spell advancement 1 spell from warlock list
      // Two Cantrips. You learn two cantrips of your choice from the Warlock spell list. Constitution is your spellcasting ability for your Black Magic spells.
      // Level 1 Spell. Choose a level 1 spell from the Warlock spell list. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.
      // Spell Change. Whenever you gain a new level, you can replace one of the spells you chose with this feature with a different spell of the same level from the Warlock spell list.

    }
  }

  _warlockFixes() {
    if (this.data.name.startsWith("Vestige Patron")) {
      // Semblance of Life: the spirit form uses the Summon Celestial/Fiend/Undead stat block at a
      // spell level of half the warlock level (round down, maximum 9)
      const spiritLevel: I5eAdvancementScaleValue = {
        type: "ScaleValue",
        configuration: {
          identifier: "semblance-spirit-level",
          type: "number",
          scale: {
            14: { value: 7 },
            16: { value: 8 },
            18: { value: 9 },
          },
        },
        name: "Semblance of Life Spirit Level",
      };
      this._addAdvancement(spiritLevel);
    }
  }

  /**
   * Necromancer (Arcana Unleashed): Necromancy Spellbook puts Find Familiar in the spellbook at
   * level 3, but DDB does not add the spell to the character, so the subclass grants it. It is a
   * spellbook entry rather than an always-prepared spell, hence the unprepared state.
   */
  async _wizardFixes() {
    if (this.data.name.startsWith("Necromancer") && !this.is2014) {
      const findFamiliar = await AdvancementHelper.getSpellGrantAdvancement({
        name: "Necromancy Spellbook",
        spellGrants: [{ name: "Find Familiar", level: 3 }],
        spellLinks: this.spellLinks,
        method: "spell",
        requireSlot: true,
        prepared: CONFIG.DND5E.spellPreparationStates.unprepared.value,
        level: 3,
        is2024: this.is2024,
      });
      if (findFamiliar) this._addAdvancement(findFamiliar.toObject() as I5eAdvancement);
    }
  }

  async _clericFixes() {
    if (this.data.name.startsWith("Grave Domain")) {
      const pullOfDeath: I5eAdvancementScaleValue = {
        type: "ScaleValue",
        configuration: {
          identifier: "pull-of-death",
          type: "dice",
          scale: {
            3: { number: 1, faces: 4 },
            11: { number: 1, faces: 6 },
          },
        },
        name: "Pull of Death",
      };
      this._addAdvancement(pullOfDeath);
    }
  }

  async _fixes() {
    this._fightingStyleAdvancement();
    this._bloodHunterFixes();
    this._barbarianFixes();
    this._druidFixes();
    this._fighterFixes();
    this._rangerFixes();
    this._sorcererFixes();
    this._artificerFixes();
    this._monkFixes();
    this._clericFixes();
    this._warlockFixes();
    await this._wizardFixes();
    await this._bardFixes();
  }

  async _generateSpellListAdvancement(feature: IDDBClassDefinitionFeature) {
    const advancements: I5eAdvancement[] = [];

    const extractor = new SpellListExtractor({
      name: feature.name,
      description: feature.description,
      is2014: this.is2014,
      is2024: this.is2024,
      sourceId: foundry.utils.getProperty(feature, "sourceId") as number,
    });

    const extractedSpells = extractor.extractSpells(true);

    const name = feature.name.toLowerCase().includes("spell")
      ? feature.name
      : `${feature.name} (Spells)`;

    logger.debug("Spell List Advancement Data", {
      extractedSpells,
      this: this,
      trait: feature,
      name,
    });

    for (const [key, spells] of Object.entries(extractedSpells)) {
      logger.debug(`Extracted Spells for ${key}`, { spells });
      const options: IAdvancementGetterSpellGrantAdvancement = {
        name,
        spellLinks: this.spellLinks,
        spellGrants: spells.map((name) => {
          return {
            name,
            level: parseInt(key),
          };
        }),
        level: key,
        requireSlot: true,
        method: "spell",
        is2024: this.is2024,
        prepared: feature.description.includes("always have the listed spells prepared")
          ? CONFIG.DND5E.spellPreparationStates.always.value
          : CONFIG.DND5E.spellPreparationStates.unprepared.value,
      };
      const grantAdvancement = await AdvancementHelper.getSpellGrantAdvancement(options);

      if (grantAdvancement) {
        if (foundry.utils.hasProperty(grantAdvancement.configuration, "identifier")
        && ((this.is2014 && !this.NO_ADVANCEMENT_2014.includes(grantAdvancement.configuration.identifier as string))
        || (!this.is2014 && !this.NO_ADVANCEMENT_2024.includes(grantAdvancement.configuration.identifier as string))))
          continue;
        advancements.push(grantAdvancement.toObject() as I5eAdvancement);
      }
    }

    logger.debug("Spell Advancements", {
      advancements,
    });

    this._addAdvancements(advancements);
  }

  async _generateSpellListAdvancements() {
    const advancementFeatures = this.classFeatures
      .filter((feature) => !this.NOT_SPELL_LIST_ADVANCEMENTS.includes(feature.name))
      .filter((feature) => feature.name.toLowerCase().endsWith("spells")
        || this.FORCE_SPELL_LIST_ADVANCEMENTS.includes(feature.name))
      .filter((feature) => feature.description.includes("<table"));

    for (const feature of advancementFeatures) {
      // console.warn("Generating spell list advancement for feature:", feature);
      await this._generateSpellListAdvancement(feature);
    }
  }

  async generateFromCharacter(character: I5ePCData) {
    await this._buildCompendiumIndex("features");
    await this._buildCompendiumIndex("feats");
    this._fleshOutCommonDataStub();
    await this._generateCommonAdvancements();
    await this._generateDescriptionStub(character);
    await this._generateSpellListAdvancements();
    await this._fixes();
    await this._addToCompendium();
  }
}

// make the table reachable without importing this module tree (see SpecialAdvancements)
registerSpecialAdvancements("subclass", DDBSubClass.SPECIAL_ADVANCEMENTS);
