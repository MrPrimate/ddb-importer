import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import AdvancementHelper from '../advancements/AdvancementHelper.js';


export default class DDBClass {

  static SPECIAL_ADVANCEMENTS = {
    "Combat Superiority": {
      fix: true,
      fixFunction: AdvancementHelper.renameTotal,
      additionalAdvancements: true,
      additionalFunctions: [AdvancementHelper.addAdditionalUses, AdvancementHelper.addSingularDie],
    },
    "Rune Carver": {
      fix: true,
      fixFunction: AdvancementHelper.renameTotal,
      additionalAdvancements: false,
      additionalFunctions: [],
    },
  };

  _generateSource() {
    const classSource = DDBHelper.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
  }

  _fleshOutCommonDataStub() {
    this.data.system.identifier = utils.referenceNameString(this.ddbClassDefinition.name.toLowerCase());
    this._proficiencyFeatureIds = this.ddbClassDefinition.classFeatures
      .filter((feature) => feature.name === "Proficiencies")
      .map((feature) => feature.id);
    this._proficiencyFeatures = this.ddbClass.classFeatures
      .filter((feature) => this._proficiencyFeatureIds.includes(feature.definition.id))
      .map((f) => f.definition);
    this._generateSource();
  }

  _generateDataStub() {
    this.data = {
      name: this.ddbClass.definition.name,
      type: "class",
      system: utils.getTemplate("class"),
      flags: {
        ddbimporter: {
          id: this.ddbClass.id,
          definitionId: this.ddbClass.definition.id,
          entityTypeId: this.ddbClass.entityTypeId,
          type: "class",
          isStartingClass: this.ddbClass.isStartingClass,
        },
        obsidian: {
          source: {
            type: "class",
            text: this.ddbClass.definition.name,
          }
        },
      },
      img: null,
    };

  }

  _generateSpellCastingProgression(isSubClass = false) {
    if (this.ddbClassDefinition.canCastSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === this.ddbClass.definition.name);
      const spellCastingAbility = getSpellCastingAbility(this.ddbClass, isSubClass, isSubClass);
      if (spellProgression) {
        this.data.system.spellcasting = {
          progression: spellProgression.value,
          ability: spellCastingAbility,
        };
      }
      const spellSlotDivisor = this.ddbClassDefinition.spellRules?.multiClassSpellSlotDivisor
        ? this.ddbClassDefinition.spellRules.multiClassSpellSlotDivisor
        : undefined;
      this.data.flags.ddbimporter.spellSlotDivisor = spellSlotDivisor;
      this.data.flags.ddbimporter.spellCastingAbility = spellCastingAbility;
    }
  }

  async _buildCompendiumIndex(type, indexFilter = {}) {
    if (Object.keys(indexFilter).length > 0) this._indexFilter[type] = indexFilter;
    await this._compendiums[type].getIndex(this._indexFilter[type]);
  }

  // async init() {
  //   await this._buildCompendiumIndex("features");
  //   // await this._buildCompendiumIndex("class");
  //   // await this._buildCompendiumIndex("subclasses");
  // }

  async _generateDescriptionStub(character, exclusionIds = []) {
    this.data.system.description.value = "<h1>Description</h1>";
    this.data.system.description.value += this.ddbClass.definition.description;
    // this excludes the subclass features
    this.data.system.description.value += await this._buildClassFeaturesDescription(exclusionIds);
    // not all classes have equipment descriptions
    if (this.ddbClass.definition.equipmentDescription) {
      // eslint-disable-next-line require-atomic-updates
      this.data.system.description.value += `<h1>Starting Equipment</h1>\n${this.ddbClass.definition.equipmentDescription}\n\n`;
    }

    if (character) {
      this.data.system.description.value = parseTemplateString(
        this.ddb,
        character,
        this.data.system.description.value,
        this.data
      ).text;
    }
  }

  constructor(ddb, classId, { noMods = false } = {}) {
    this.legacyMode = foundry.utils.isNewerVersion("2.4.0", game.system.version);
    this._indexFilter = {
      features: {
        fields: [
          "name",
          "flags.ddbimporter.classId",
          "flags.ddbimporter.class",
          "flags.ddbimporter.subClass",
          "flags.ddbimporter.parentClassId",
        ]
      },
      class: {},
      subclasses: {},
    };

    // setup ddb source
    this.ddb = ddb;
    this.ddbClass = ddb.character.classes.find((c) => c.definition.id === classId);
    this.ddbClassDefinition = this.ddbClass.definition;

    // quick helpers
    this.classFeatureIds = this.ddbClass.definition.classFeatures.map((f) => f.id);
    this.subClassFeatureIds = this.ddbClass.subclassDefinition && this.ddbClass.subclassDefinition.name
      ? this.ddbClass.subclassDefinition.classFeatures.filter((f) =>
        f.id === this.ddbClass.subclassDefinition.id).map((f) => f.id
      )
      : [];

    // compendium
    this._compendiums = {
      features: CompendiumHelper.getCompendiumType("classfeatures"),
      // class: CompendiumHelper.getCompendiumType("class"),
      // subclasses: CompendiumHelper.getCompendiumType("subclasses"),
    };
    // this._compendiumFeaturesLabel = CompendiumHelper.getCompendiumLabel("features");

    this._advancementMatches = {
      features: {},
    };

    this._isSubClass = false;
    this._generateDataStub();

    this.options = {
      noMods,
    };

    this.dictionary = DICTIONARY.character.class.find((c) => c.name === this.ddbClassDefinition.name);

  }

  /**
   * Retrieves the class features, excluding the ones specified by their IDs.
   *
   * @param {Array} excludedIds - An array of IDs of class features to exclude (default: [])
   * @return {Array} An array of class features
   */
  getClassFeatures(excludedIds = []) {
    const excludedFeatures = this.ddb.character.optionalClassFeatures
      .filter((f) => f.affectedClassFeatureId)
      .map((f) => f.affectedClassFeatureId);

    const optionFeatures = this.ddb.classOptions
      ? this.ddb.classOptions
        .filter((feature) => feature.classId === this.ddbClassDefinition.id && !excludedIds.includes(feature.id))
      : [];

    const classFeatures = this.ddbClass.classFeatures
      .filter((feature) =>
        !excludedFeatures.includes(feature.definition.id)
        && !excludedIds.includes(feature.definition.id)
        && feature.definition.classId === this.ddbClassDefinition.id
      )
      .map((feature) => feature.definition);

    return classFeatures.concat(optionFeatures)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .sort((a, b) => a.requiredLevel - b.requiredLevel);
  }

  /**
   * Finds a match in the compendium features for the given feature.
   *
   * @param {Object} feature - The feature to find a match for.
   * @return {Object|undefined} - The matched feature, or undefined if no match is found.
   */
  getFeatureCompendiumMatch(feature) {
    return this._compendiums.features.index.find((match) =>
      ((hasProperty(match, "flags.ddbimporter.featureName") && feature.name.trim().toLowerCase() == match.flags.ddbimporter.featureName.trim().toLowerCase())
        || (!hasProperty(match, "flags.ddbimporter.featureName")
          && (feature.name.trim().toLowerCase() == match.name.trim().toLowerCase()
          || `${feature.name} (${this.ddbClassDefinition.name})`.trim().toLowerCase() == match.name.trim().toLowerCase()))
      )
      && hasProperty(match, "flags.ddbimporter")
      && (match.flags.ddbimporter.class == this.ddbClassDefinition.name
        || match.flags.ddbimporter.parentClassId == this.ddbClassDefinition.id
        || match.flags.ddbimporter.classId == this.ddbClassDefinition.id)
    );
  }

  async _buildClassFeaturesDescription(ignoreIds = []) {
    logger.debug(`Parsing ${this.ddbClassDefinition.name} features`);
    let description = "<h1>Class Features</h1>\n\n";
    let classFeatures = [];

    this.getClassFeatures(ignoreIds).forEach((feature) => {
      const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

      if (!classFeaturesAdded && !ignoreIds.includes(feature.id)) {
        const featureMatch = this.getFeatureCompendiumMatch(feature);
        const title = (featureMatch)
          ? `<p><b>@UUID[${featureMatch.uuid}]{${feature.name}}</b></p>`
          : `<p><b>${feature.name}</b></p>`;

        description += `${title}\n${feature.description}\n\n`;
        classFeatures.push(feature.name);
      }

    });

    return description;
  }

  _generateHitDice() {
    this.data.system.hitDice = `d${this.ddbClass.definition.hitDice}`;
    this.data.system.hitDiceUsed = this.ddbClass.hitDiceUsed;
  }

  _setClassLevel() {
    this.data.system.levels = this.ddbClass.level;
  }

  // LEGACY SETS

  /**
   * Sets saves if legacy mode is enabled.
   *
   * @return {undefined} - This function does not return a value.
   */
  _setLegacySaves() {
    if (!this.legacyMode) return;
    DICTIONARY.character.abilities.forEach((ability) => {
      const mods = DDBHelper.getChosenClassModifiers(this.ddb);
      const save = DDBHelper.filterModifiersOld(mods, "proficiency", `${ability.long}-saving-throws`, [null, ""], true).length > 0;
      if (save) this.data.system.saves.push(ability.value);
    });
  }


  /**
   * Sets the skills for the class if in legacy mode.
   *
   * @return {undefined} No return value.
   */
  _setLegacySkills() {
    if (!this.legacyMode) return;

    const skills = this._parseSkillChoicesFromOptions(1);

    this.data.system.skills = {
      value: skills.chosen,
      number: skills.chosen.length,
      choices: skills.choices,
    };

  }


  // ADVANCEMENT FUNCTIONS

  async _generateFeatureAdvancements(ignoreIds = []) {
    logger.debug(`Parsing ${this.ddbClass.name} features for advancement`);

    const advancements = [];
    this.getClassFeatures(ignoreIds)
      .filter((feature) => !ignoreIds.includes(feature.id))
      .forEach((feature) => {
        const featureMatch = this.getFeatureCompendiumMatch(feature);

        if (featureMatch) {
          const levelAdvancement = advancements.findIndex((advancement) => advancement.level === feature.requiredLevel);

          if (levelAdvancement == -1) {
            const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
            this._advancementMatches.features[advancement._id] = {};
            this._advancementMatches.features[advancement._id][featureMatch.name] = featureMatch.uuid;

            const update = {
              configuration: {
                items: [featureMatch.uuid]
              },
              value: {},
              level: feature.requiredLevel,
              title: "Features",
              icon: "",
              classRestriction: ""
            };
            advancement.updateSource(update);
            advancements.push(advancement.toObject());
          } else {
            advancements[levelAdvancement].configuration.items.push(featureMatch.uuid);
            this._advancementMatches.features[levelAdvancement._id][featureMatch.name] = featureMatch.uuid;
          }
        }
      });

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateScaleValueAdvancementsFromFeatures(ignoreIds = []) {
    let specialFeatures = [];
    const advancements = this.getClassFeatures(ignoreIds)
      .filter((feature) => feature.levelScales?.length > 0)
      .map((feature) => {
        let advancement = AdvancementHelper.generateScaleValueAdvancement(feature);
        const specialLookup = DDBClass.SPECIAL_ADVANCEMENTS[advancement.title];
        if (specialLookup) {
          if (specialLookup.additionalAdvancements) {
            specialLookup.additionalFunctions.forEach((fn) => {
              specialFeatures.push(fn(advancement));
            });
          }
          if (specialLookup.fixFunction) advancement = specialLookup.fixFunction(advancement);
        }
        return advancement;
      });

    this.data.system.advancement = this.data.system.advancement.concat(advancements, specialFeatures);
  }

  static parseHTMLSaves(description) {
    const results = [];

    let dom = new DocumentFragment();
    $.parseHTML(description).forEach((element) => {
      dom.appendChild(element);
    });

    // get class saves
    const savingText = dom.textContent.toLowerCase().split("saving throws:").pop().split("\n")[0].split("The")[0].split(".")[0].split("skills:")[0].trim();
    const saveRegex = /(.*)(?:$|The|\.$|\w+:)/im;
    const saveMatch = savingText.match(saveRegex);

    if (saveMatch) {
      const saveNames = saveMatch[1].replace('and', ',').split(',').map((ab) => ab.trim());
      const saves = saveNames
        .filter((name) => DICTIONARY.character.abilities.some((ab) => ab.long.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictAbility = DICTIONARY.character.abilities.find((ab) => ab.long.toLowerCase() === name.toLowerCase());
          return dictAbility.value;
        });
      results.push(...saves);
    }
    return results;
  }

  _generateHTMLSaveAdvancement() {
    const advancements = [];
    // TODO: Add what to do if no mods supplied
    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSaveAdvancements() {
    if (this.legacyMode) return;
    if (this.options.noMods) {
      this._generateHTMLSaveAdvancement();
      return;
    }
    const advancements = [];
    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        const modFilters = {
          includeExcludedEffects: true,
          classId: this.ddbClassDefinition.id,
          exactLevel: i,
          availableToMulticlass,
          useUnfilteredModifiers: true,
        };
        const mods = DDBHelper.getChosenClassModifiers(this.ddb, modFilters);
        const updates = DICTIONARY.character.abilities
          .filter((ability) => {
            return DDBHelper.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
          })
          .map((ability) => `saves:${ability.value}`);
        // create a leveled advancement
        if (updates.length > 0) {
          const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
          const update = {
            classRestriction: availableToMulticlass ? "" : "primary",
            configuration: {
              grants: updates,
              allowReplacements: false,
            },
            level: i,
            value: {
              chosen: updates,
            },
          };
          advancement.updateSource(update);
          advancements.push(advancement.toObject());
        }
      });
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  static parseHTMLSkills(description) {
    const parsedSkills = {
      choices: [],
      number: 0,
    };

    let dom = new DocumentFragment();
    $.parseHTML(description).forEach((element) => {
      dom.appendChild(element);
    });

    // Choose any three
    // Skills: Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival
    const skillText = dom.textContent.toLowerCase().split("skills:").pop().split("\n")[0].split("The")[0].split(".")[0].trim();
    const allSkillRegex = /Skills: Choose any (\w+)(.*)($|\.$|\w+:)/im;
    const allMatch = dom.textContent.match(allSkillRegex);
    const skillRegex = /choose (\w+)(?:\sskills)* from (.*)($|The|\.$|\w+:)/im;
    const skillMatch = skillText.match(skillRegex);

    if (allMatch) {
      const skills = DICTIONARY.character.skills.map((skill) => skill.name);
      const numberSkills = DICTIONARY.numbers.find((num) => allMatch[1].toLowerCase() === num.natural);
      // eslint-disable-next-line require-atomic-updates
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = skills;
    } else if (skillMatch) {
      const skillNames = skillMatch[2].replace('and', ',').split(',').map((skill) => skill.trim());
      const skills = skillNames.filter((name) => DICTIONARY.character.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictSkill = DICTIONARY.character.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
          return dictSkill.name;
        });
      const numberSkills = DICTIONARY.numbers.find((num) => skillMatch[1].toLowerCase() === num.natural);
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = skills;
    }

    return parsedSkills;
  }

  _parseSkillChoicesFromOptions(level) {
    const skillsChosen = new Set();
    const skillChoices = new Set();

    const choiceDefinitions = this.ddb.character.choices.choiceDefinitions;

    console.warn("classProficiencyFeatureIds", {
      classProficiencyFeatureIds: this._proficiencyFeatureIds,
      classProficiencyFeatures: this._proficiencyFeatures,
      choiceDefinitions,
    });

    this.ddb.character.choices.class.filter((choice) =>
      this._proficiencyFeatures.some((f) => f.id === choice.componentId && f.requiredLevel === level)
      && choice.subType === 1
      && choice.type === 2
    ).forEach((choice) => {
      console.warn("choice", choice);
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.character.skills.find((skill) => skill.label === option.label);
      if (smallChosen) skillsChosen.add(smallChosen.name);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );
      optionNames.forEach((skill) => {
        skillChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(skillsChosen),
      choices: Array.from(skillChoices),
    };
  }

  _generateSkillAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if (availableToMulticlass && this.dictionary.mulitclassSkill === 0) return;
        const modFilters = {
          includeExcludedEffects: true,
          classId: this.ddbClassDefinition.id,
          exactLevel: i,
          availableToMulticlass: availableToMulticlass === false ? null : true,
          useUnfilteredModifiers: true,
        };
        const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddb, modFilters);
        const skillExplicitMods = mods.filter((mod) =>
          mod.type === "proficiency"
          && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType)
        );
        const skillChooseMods = DDBHelper.filterModifiers(mods, "proficiency", { subType: `choose-a-${this.ddbClassDefinition.name.toLowerCase()}-skill` });

        const skillMods = skillChooseMods.concat(skillExplicitMods);
        const proficiencyFeature = this._proficiencyFeatures.find((f) => f.requiredLevel === i);

        if (!proficiencyFeature) return;

        const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

        const parsedSkills = DDBClass.parseHTMLSkills(proficiencyFeature.description);
        const chosenSkills = this._parseSkillChoicesFromOptions(i);

        const skillCount = this.options.noMods
          ? parsedSkills.number
          : availableToMulticlass
            ? this.dictionary.mulitclassSkill
            : skillMods.length;

        console.warn("SKILL PARSING", {
          parsedSkills,
          chosenSkills,
          skillMods,
          skillExplicitMods,
          skillChooseMods,
          i,
          availableToMulticlass,
          modFilters,
          mods,

          proficiencyFeature,
          this: this,
        });
        if (skillCount === 0) return;

        const initialUpdate = {
          classRestriction: availableToMulticlass ? "secondary" : "primary",
          configuration: {
            allowReplacements: false,
            choices: [{
              count: this.options.noMods
                ? parsedSkills.number
                : availableToMulticlass
                  ? this.dictionary.mulitclassSkill
                  : skillMods.length,
              pool: parsedSkills.choices.map((skill) => `skills:${skill}`),
            }],
          },
          level: i,
        };

        advancement.updateSource(initialUpdate);

        if (chosenSkills.chosen.length > 0) {
          advancement.updateSource({
            value: {
              chosen: chosenSkills.chosen.map((skill) => `skills:${skill}`),
            },
          });
        }

        advancements.push(advancement.toObject());
      });
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateHPAdvancement(character) {
    // const value = "value": {
    //   "1": "max",
    //   "2": "avg"
    // },
    const value = {};

    const rolledHP = getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
    const startingClass = getProperty(this.data, "flags.ddbimporter.isStartingClass") === true;
    const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
    if (rolledHP && !useMaxHP) {
      const baseHP = getProperty(character, "flags.ddbimporter.baseHitPoints");
      const totalLevels = getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels");
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

    const advancement = new game.dnd5e.documents.advancement.HitPointsAdvancement();
    advancement.updateSource({ value });
    this.data.system.advancement.push(advancement.toObject());
  }


  async _addSRDAdvancements() {
    const srdCompendium = CompendiumHelper.getCompendium("dnd5e.classes");
    await srdCompendium.getIndex();
    const klassMatch = srdCompendium.index.find((k) => k.name === this.ddbClassDefinition.name);
    if (klassMatch) {
      const srdKlass = await srdCompendium.getDocument(klassMatch._id);
      const scaleAdvancements = srdKlass.system.advancement.filter((srdA) =>
        srdA.type === "ScaleValue"
        && !this.data.system.advancement.some((ddbA) => ddbA.configuration.identifier === srdA.configuration.identifier)
      ).map((advancement) => {
        return foundry.utils.isNewerVersion(game.system.version, "2.0.3") ? advancement.toObject() : advancement;
      });
      this.data.system.advancement.push(...scaleAdvancements);
    }
  }


  async _generateCommonAdvancements() {
    this._generateScaleValueAdvancementsFromFeatures(this.subClassFeatureIds);
    await this._generateFeatureAdvancements(this.subClassFeatureIds);
    this._generateSaveAdvancements();
    this._generateSkillAdvancements();
    await this._addSRDAdvancements();
  }

  // fixes
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  _fixes() {
    // Currently empty but stubbed for DDBSubClass
  }


  // GENERATE CLASS

  async generateFromCharacter(character) {
    await this._buildCompendiumIndex("features");

    this._fleshOutCommonDataStub();
    this._setClassLevel();
    this._generateHitDice();
    this._generateSpellCastingProgression();

    // if pre 2.4 generate skills and saves as data not advancements
    this._setLegacySkills();
    this._setLegacySaves();

    await this._generateDescriptionStub(character, this.subClassFeatureIds);
    this._generateHPAdvancement(character);
    await this._generateCommonAdvancements();

    this._fixes();

  }


}
