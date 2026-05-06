import {
  logger,
  utils,
  CompendiumHelper,
  DDBCompendiumFolders,
  DDBItemImporter,
} from "../../lib/_module";
import AdvancementHelper from "../advancements/AdvancementHelper";
import { SETTINGS, DICTIONARY } from "../../config/_module";
import { DDBModifiers, SystemHelpers } from "../lib/_module";
import DDBBaseClass from "./DDBBaseClass";


export default class DDBClass extends DDBBaseClass {

  static SPECIAL_ADVANCEMENTS: TDDBClassSpecialAdvancements = {
    "Wild Shape": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Wild Shape CR" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    "Bardic Inspiration": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Bardic Inspiration", identifier: "inspiration" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    "Rage": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Rages", identifier: "rages" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
    "Martial Arts": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Martial Arts Die", identifier: "die" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
  };

  declare data: I5eClassItem;

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: this.className,
      type: "class",
      system: SystemHelpers.getTemplate("class"),
      flags: {
        ddbimporter: {
          class: this.className,
          id: this.ddbClass.id,
          classDefinitionId: this.ddbClass.definition.id,
          definitionId: this.ddbClass.definition.id,
          entityTypeId: this.ddbClass.entityTypeId,
          type: "class",
          isStartingClass: this.ddbClass.isStartingClass,
          ddbImg: this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
          legacy: this.legacy,
        },
      },
      img: null,
    } as I5eClassItem;
  }

  _generateHitDice() {
    this.data.system.hd = {
      denomination: `d${this.ddbClass.definition.hitDice}`,
      spent: this.ddbClass.hitDiceUsed,
    };
  }

  _setClassLevel() {
    this.data.system.levels = this.ddbClass.level;
  }

  _generateHPAdvancement(character: I5ePCData) {
    // const value = "value": {
    //   "1": "max",
    //   "2": "avg"
    // },
    const value = {};

    const rolledHP = foundry.utils.getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
    const startingClass = foundry.utils.getProperty(this.data, "flags.ddbimporter.isStartingClass") === true;
    const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
    if (rolledHP && !useMaxHP) {
      const baseHP = foundry.utils.getProperty(character, "flags.ddbimporter.baseHitPoints") as number;
      const totalLevels = foundry.utils.getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels") as number;
      const hpPerLevel = Math.floor(baseHP / totalLevels);
      const leftOvers = Math.floor(baseHP % totalLevels);

      for (let i = 1; i <= this.data.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? (hpPerLevel + leftOvers) : hpPerLevel;
      }
    } else {
      for (let i = 1; i <= this.data.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? "max" : "avg";
      }
    };

    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.HitPointsAdvancement);
    advancement.updateSource({ value });
    this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  _generateAbilityScoreAdvancement() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      const abilityAdvancementFeature = this.classFeatures.find((f) =>
        (f.name.includes("Ability Score Improvement") || f.name === "Epic Boon")
        && f.requiredLevel === i,
      );


      if (!abilityAdvancementFeature) continue;
      const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);
      const update: I5eAdvancementAbilityScoreImprovement = {
        title: abilityAdvancementFeature.name,
        hint: abilityAdvancementFeature.snippet ?? abilityAdvancementFeature.description ?? "",
        configuration: { points: 2 },
        level: i,
        value: { type: "asi" },
      };
      advancement.updateSource(update as any);

      // if (abilityAdvancementFeature.name === "Epic Boon") {
      //   const update: I5eAdvancementAbilityScoreImprovement = {
      //     title: "Epic Boon",
      //     hint: abilityAdvancementFeature.snippet ?? abilityAdvancementFeature.description ?? "",
      //   };
      //   console.warn(`Updating epic boon advancement for feature ${abilityAdvancementFeature.name} at level ${i}`, {
      //     abilityAdvancementFeature,
      //     update,
      //     advancement,
      //   });
      //   advancement.updateSource(update as any);
      // }

      // if advancement has taken ability improvements
      const modFilters = {
        includeExcludedEffects: true,
        classId: this.ddbClassDefinition.id,
        exactLevel: i,
        useUnfilteredModifiers: true,
      };
      const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);

      const assignments: Record<string, number> = {};
      DICTIONARY.actor.abilities.forEach((ability) => {
        const count = DDBModifiers.filterModifiers(mods, "bonus", { subType: `${ability.long}-score` }).length;
        if (count > 0) assignments[ability.value] = count;
      });

      // create a leveled advancement
      if (Object.keys(assignments).length > 0) {
        advancement.updateSource({
          value: {
            assignments,
          },
        });
      } else if (abilityAdvancementFeature.requiredLevel <= this.ddbClass.level) {
        // feat id selection happens later once features have been generated
        // "type": "feat",
        // "feat": {
        //   "vu8kJ2iTCEiGQ1mv": "Compendium.world.ddb-test2-ddb-feats.Item.3mfeQMT6Fh1VRubU"
        // }
        advancement.updateSource({
          value: {
            type: "feat",
            feat: {
            },
          },
        });
        // abilityAdvancementFeature.id: 313
        // abilityAdvancementFeature.entityTypeId: 12168134
        const featChoice = this.ddbData.character.feats.find((f) =>
          f.componentId == abilityAdvancementFeature.id
          && f.componentTypeId == abilityAdvancementFeature.entityTypeId,
        );
        const featureMatch = featChoice ? this.getFeatCompendiumMatch(featChoice.definition.name) : null;
        if (featureMatch) {
          this._advancementMatches.features[advancement._id] = {};
          this._advancementMatches.features[advancement._id][featureMatch.name] = featureMatch.uuid;
        } else {
          logger.info("Missing asi feat linking match for", { abilityAdvancementFeature, featChoice, this: this });
        }

      }

      advancements.push(advancement.toObject() as I5eAdvancement);
    }

    this._addAdvancements(advancements);
  }

  _generateWealth() {
    if (!this.ddbClassDefinition.wealthDice) return;
    const diceString = this.ddbClassDefinition.wealthDice.diceString;
    const diceMultiplier = this.ddbClassDefinition.wealthDice.diceMultiplier;
    this.data.system.wealth = diceMultiplier && diceString
      ? `${diceString}*${diceMultiplier}`
      : "";
  }

  async _copyFoundryEquipment() {
    const packIds = this.is2014
      ? SETTINGS.FOUNDRY_COMPENDIUM_MAP["classes"]
      : SETTINGS.FOUNDRY_COMPENDIUM_MAP["classes2024"];
    for (const packId of packIds) {
      const pack = CompendiumHelper.getCompendium(packId, false);
      if (!pack) continue;
      await pack.getIndex();
      const klassMatch = pack.index.find((k) =>
        k.name === this.name
        // @ts-expect-error - we know this exists
        && k.type === "class",
      );
      if (!klassMatch) continue;
      const foundryKlass = await pack.getDocument(klassMatch._id);
      const startingEquipment = foundry.utils.duplicate(foundryKlass.system.startingEquipment);
      this.data.system.startingEquipment = startingEquipment;
      return;
    }
  }

  _generateSubclassAdvancement() {
    const subClassChoices = this.ddbData.character.choices.class.filter((c) => c.type === 7);
    if (!subClassChoices) {
      logger.warn(`No subclass choices found for ${this.name}`, {
        this: this,
      });
      return;
    }
    const subClassFeature = this.classFeatures.find((f) =>
      subClassChoices.some((c) => c.componentId === f.id));

    if (!subClassFeature) {
      logger.warn(`No subclass feature found for ${this.name}`, {
        subClassChoices,
        this: this,
      });
      return;
    }
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.SubclassAdvancement);
    advancement.updateSource({
      title: subClassFeature.name,
      // @ts-expect-error - we know
      hint: subClassFeature.snippet ?? subClassFeature.description ?? "",
      level: subClassFeature.requiredLevel,
    } as any);
    this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  // fixes
  _druidFixes() {
    if (this.data.name !== "Druid") return;
    for (const [id, advancement] of Object.entries(this.data.system.advancement)) {
      if (advancement.title !== "Wild Shape CR") continue;
      // @ts-expect-error - we know this is the right kind
      advancement.configuration.type = "cr";
      // @ts-expect-error - we know this is the right kind
      advancement.configuration.scale = {
        2: { value: 0.25 },
        4: { value: 0.5 },
        8: { value: 1 },
      };
      this.data.system.advancement[id] = advancement;
    };
    if (this.is2014) {
      const wildshape: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "wild-shape-uses",
          type: "number",
          scale: {
            2: { value: 2 },
            20: { value: 99 },
          },
        },
        value: {},
        title: "Wild Shape Uses",
        icon: null,
      };
      this._addAdvancement(wildshape);
    } else {
      const wildshape: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "wild-shape-uses",
          type: "number",
          scale: {
            2: { value: 2 },
            6: { value: 3 },
            17: { value: 4 },
          },
        },
        value: {},
        title: "Wild Shape Uses",
        icon: null,
      };
      this._addAdvancement(wildshape);
      const elementalFury: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "elemental-fury",
          type: "dice",
          scale: {
            7: { number: 1, faces: 8 },
            18: { number: 2, faces: 8 },
          },
        },
        value: {},
        title: "Elemental Fury Damage",
        icon: null,
      };
      this._addAdvancement(elementalFury);
      const knownForms: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "known-forms",
          type: "number",
          scale: {
            2: { value: 4 },
            4: { value: 6 },
            8: { value: 8 },
          },
        },
        value: {},
        title: "Known Forms",
        icon: null,
      };
      this._addAdvancement(knownForms);
    }
  }

  _monkFixes() {
    if (this.data.name !== "Monk") return;
    const ki: I5eAdvancement = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: this.is2014 ? "ki-points" : "focus-points",
        type: "number",
        scale: {},
      },
      value: {},
      title: this.is2014 ? "Ki Points" : "Focus Points",
      icon: null,
    };
    utils.arrayRange(19, 1, 2).forEach((i) => {
      ki.configuration.scale[i] = {
        value: i,
      };
    });
    this._addAdvancement(ki);
  }

  _rogueFixes() {
    if (this.data.name !== "Rogue") return;
    if (this.is2014) return;
    const cunningStrike: I5eAdvancement = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: "cunning-strike-uses",
        type: "number",
        scale: {
          5: { value: 1 },
          11: { value: 2 },
        },
      },
      value: {},
      title: "Cunning Strike Uses",
      icon: null,
    };
    this._addAdvancement(cunningStrike);
    const sneakAttack: I5eAdvancement = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: "sneak-attack",
        type: "dice",
        scale: {
          1: { number: 1, faces: 6 },
          3: { number: 2, faces: 6 },
          5: { number: 3, faces: 6 },
          7: { number: 4, faces: 6 },
          9: { number: 5, faces: 6 },
          11: { number: 6, faces: 6 },
          13: { number: 7, faces: 6 },
          15: { number: 8, faces: 6 },
          17: { number: 9, faces: 6 },
          19: { number: 10, faces: 6 },
        },
      },
      value: {},
      title: "Sneak Attack",
      icon: null,
    };
    this._addAdvancement(sneakAttack);
  }

  _barbarianFixes() {
    if (this.data.name !== "Barbarian") return;

    if (!Object.values(this.data.system.advancement).some((a) =>
      foundry.utils.getProperty(a, "configuration.identifier") === "rage-damage")
    ) {
      const damage: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "rage-damage",
          type: "number",
          scale: {
            1: { value: 2 },
            9: { value: 3 },
            16: { value: 4 },
          },
        },
        value: {},
        title: "Rage Damage",
        icon: null,
      };
      this._addAdvancement(damage);
    }

    if (this.is2014) return;
    for (const [id, advancement] of Object.entries(this.data.system.advancement)) {
      if (advancement.title !== "Brutal Strike") continue;
      // @ts-expect-error - we know this is the right kind
      advancement.configuration.type = "dice";
      // @ts-expect-error - we know this is the right kind
      advancement.configuration.scale = {
        9: { number: 1, faces: 10 },
        17: { number: 2, faces: 10 },
      };
      this.data.system.advancement[id] = advancement;
    };

  }

  _bardFixes() {
    if (this.data.name !== "Bard") return;
    if (!Object.values(this.data.system.advancement).some((a) =>
      foundry.utils.getProperty(a, "configuration.identifier") === "inspiration")
    ) {
      const bardicInspiration: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "inspiration",
          type: "dice",
          scale: {
            1: { number: 1, faces: 6 },
            5: { number: 1, faces: 8 },
            10: { number: 1, faces: 10 },
            15: { number: 1, faces: 12 },
          },
        },
        value: {},
        title: "Bardic Inspiration",
        icon: null,
      };
      this._addAdvancement(bardicInspiration);
    }
  }

  _sorcererFixes() {
    if (this.data.name !== "Sorcerer") return;
    const points: I5eAdvancement = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: "points",
        type: "number",
        scale: {},
      },
      value: {},
      title: "Sorcery Points",
      icon: null,
    };
    utils.arrayRange(20, 1, 2).forEach((i) => {
      points.configuration.scale[i] = {
        value: i,
      };
    });

    this._addAdvancement(points);
  }

  _spellFixes() {
    // only run on non-spellcasting classes
    if (!["Fighter", "Rogue", "Barbarian", "Monk", "Gunslinger", "Monster Hunter", "Pugilist", "Illrigger", "Blood Hunter"].includes(this.data.name)) return;
    const foundCantrips = Object.values(this.data.system.advancement).find((a) => a.title === "Cantrips Known");
    if (foundCantrips) {
      delete this.data.system.advancement[foundCantrips._id];
    }
    const foundSpells = Object.values(this.data.system.advancement).find((a) => a.title === "Spells Known");
    if (foundSpells) {
      delete this.data.system.advancement[foundSpells._id];
    }
  }

  _artificerFixes() {
    if (this.data.name !== "Artificer") return;
    for (const [id, advancement] of Object.entries(this.data.system.advancement)) {
      if (advancement.title === "Magic Item Plans") {
        // @ts-expect-error - we know this is the right kind
        advancement.configuration.scale = {
          2: { value: 4 },
          6: { value: 5 },
          10: { value: 6 },
          14: { value: 7 },
          18: { value: 8 },
        };
        this.data.system.advancement[id] = advancement;
      } else if (advancement.title === "Tool Proficiencies") {
        advancement.configuration = {
          "allowReplacements": true,
          "choices": [{
            "count": 1,
            "pool": [
              "tool:art:*",
            ],
          }],
          "grants": [
            "tool:art:tinker",
            "tool:thief",
          ],
          "mode": "default",
        };
        this.data.system.advancement[id] = advancement;
      }
      // const chosen = new Set(advancement.value?.chosen || []);
      // if (chosen.size !== 3) {
      //   chosen.add("tool:art:tinker");
      //   chosen.add("tool:thief");
      // }

      // advancement.value = {
      //   chosen: Array.from(chosen),
      // };
    }
  }

  async _fixes() {
    await this._fightingStyleAdvancement();
    this._druidFixes();
    this._monkFixes();
    this._rogueFixes();
    this._barbarianFixes();
    this._bardFixes();
    this._sorcererFixes();
    this._spellFixes();
    this._artificerFixes();
  }

  _generatePrimaryAbility() {
    const primaryAbilities = [];
    for (const prerequisite of this.ddbClassDefinition.prerequisites) {
      for (const mapping of prerequisite.prerequisiteMappings) {
        if (mapping.type !== "ability-score") continue;
        const ability = DICTIONARY.actor.abilities.find((a) => a.id === mapping.entityId);
        if (ability) {
          primaryAbilities.push(ability.value);
        } else {
          logger.warn("DDBClass - Missing primary ability mapping", { mapping, prerequisite, this: this });
        }
      }
    }

    this.data.system.primaryAbility = {
      value: primaryAbilities,
      all: false,
    };
  };

  static CLASS_HANDLER_OPTIONS = {
    chrisPremades: false,
    filterDuplicates: false,
    deleteBeforeUpdate: false,
    useCompendiumFolders: true,
    notifier: null,
    matchFlags: ["definitionId", "is2014"],
    recursive: false,
  };

  _buildPendingClassDocument() {
    const data: I5eClassItem = foundry.utils.deepClone(this.data) as I5eClassItem;
    for (const [id, advancement] of Object.entries(data.system.advancement)) {
      delete (advancement as any).value;
      data.system.advancement[id] = advancement;
    }
    if (data.system.levels) data.system.levels = 1;
    if (data.system.hd) data.system.hd.spent = 0;
    const versionStub = this.data.system.source.rules;
    return {
      data,
      isSubClass: this.isSubClass,
      className: this.className,
      name: this.name,
      versionStub,
    };
  }

  async _addToCompendium() {
    if (!this.addToCompendium) return;
    if (!this.compendiumImportTypes.some((t) => ["classes", "subclasses"].includes(t))) return;

    // only add full level 20 classes
    if (this.ddbClass.level !== 20) return;

    const prepared = this._buildPendingClassDocument();

    if (this.collectOnly) {
      this.pendingClassDocument = prepared;
      return;
    }

    const updateFeatures = this.updateCompendiumItems
      ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");

    const type = this.isSubClass ? "subclass" : "class";
    const featureCompendiumFolders = new DDBCompendiumFolders(type);
    await featureCompendiumFolders.loadCompendium(type);

    if (this.isSubClass) {
      await featureCompendiumFolders.createSubClassFeatureFolder(prepared.name, prepared.className, prepared.versionStub);
    } else {
      await featureCompendiumFolders.createClassFeatureFolder(prepared.name, prepared.versionStub);
    }

    const handler = await DDBItemImporter.buildHandler(type, [prepared.data], updateFeatures, DDBClass.CLASS_HANDLER_OPTIONS);
    await handler.buildIndex();
  }

  static async writePendingClassDocuments(
    pending: { classes: IDBClassPendingClassDocument[]; subclasses: IDBClassPendingClassDocument[] },
    updateFeatures: boolean,
  ) {
    if (pending.classes.length > 0) {
      const folders = new DDBCompendiumFolders("class");
      await folders.loadCompendium("class");
      const seen = new Set<string>();
      for (const entry of pending.classes) {
        const key = `${entry.name}|${entry.versionStub}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await folders.createClassFeatureFolder(entry.name, entry.versionStub);
      }
      const docs = pending.classes.map((e) => e.data);
      logger.info(`Importing ${docs.length} class documents!`);
      const handler = await DDBItemImporter.buildHandler("class", docs, updateFeatures, DDBClass.CLASS_HANDLER_OPTIONS);
      await handler.buildIndex();
    }

    if (pending.subclasses.length > 0) {
      const folders = new DDBCompendiumFolders("subclass");
      await folders.loadCompendium("subclass");
      const seen = new Set<string>();
      for (const entry of pending.subclasses) {
        const key = `${entry.name}|${entry.className}|${entry.versionStub}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await folders.createSubClassFeatureFolder(entry.name, entry.className, entry.versionStub);
      }
      const docs = pending.subclasses.map((e) => e.data);
      logger.info(`Importing ${docs.length} subclass documents!`);
      const handler = await DDBItemImporter.buildHandler("subclass", docs, updateFeatures, DDBClass.CLASS_HANDLER_OPTIONS);
      await handler.buildIndex();
    }
  }

  // GENERATE CLASS

  async generateFromCharacter(character: I5ePCData) {
    await this._buildCompendiumIndex("features");
    await this._buildCompendiumIndex("feats");
    this._setClassLevel();
    this._generatePrimaryAbility();
    this._fleshOutCommonDataStub();

    // these are class specific
    this._generateSubclassAdvancement();
    this._generateHPAdvancement(character);
    await this._generateCommonAdvancements();
    this._generateHitDice();
    this._generateAbilityScoreAdvancement();
    this._generateWealth();
    this._copyFoundryEquipment();

    await this._generateDescriptionStub(character);
    await this._fixes();
    await this._addFoundryAdvancements();
    await this._addToCompendium();

  }

}
