import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import AdvancementHelper from '../advancements/AdvancementHelper.js';


export default class DDBClass {

  static SPECIAL_ADVANCEMENTS = {};

  static PROFICIENCY_FEATURES = [
    "Proficiencies",
    "Primal Knowledge",
  ];

  static EXPERTISE_FEATURES = [
    "Expertise",
    // "Tool Expertise", // revisit,this doesn't work the same way
  ];

  _generateSource() {
    const classSource = DDBHelper.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
  }

  _fleshOutCommonDataStub() {
    this.data.system.identifier = utils.referenceNameString(this.ddbClassDefinition.name.toLowerCase());
    this._determineClassFeatures();

    this._proficiencyFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.PROFICIENCY_FEATURES.includes(feature.name))
      .map((feature) => feature.id);
    this._proficiencyFeatures = this.classFeatures
      .filter((feature) => this._proficiencyFeatureIds.includes(feature.id));

    this._expertiseFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.EXPERTISE_FEATURES.includes(feature.name))
      .map((feature) => feature.id);
    this._expertiseFeatures = this.classFeatures
      .filter((feature) => this._expertiseFeatureIds.includes(feature.id));

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

  _generateSpellCastingProgression() {
    if (this.ddbClassDefinition.canCastSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === this.ddbClass.definition.name);
      const spellCastingAbility = getSpellCastingAbility(this.ddbClass, this._isSubClass, this._isSubClass);
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

  async _generateDescriptionStub(character) {
    this.data.system.description.value = "<h1>Description</h1>";
    this.data.system.description.value += this.ddbClass.definition.description;
    // this excludes the subclass features
    this.data.system.description.value += await this._buildClassFeaturesDescription();
    // not all classes have equipment descriptions
    if (this.ddbClass.definition.equipmentDescription) {
      // eslint-disable-next-line require-atomic-updates
      this.data.system.description.value += `<h1>Starting Equipment</h1>\n${this.ddbClass.definition.equipmentDescription}\n\n`;
    }

    if (character) {
      this.data.system.description.value = parseTemplateString(
        this.ddbData,
        character,
        this.data.system.description.value,
        this.data
      ).text;
    }
  }

  constructor(ddbData, classId, { noMods = false } = {}) {
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
    this.ddbData = ddbData;
    this.ddbClass = ddbData.character.classes.find((c) => c.definition.id === classId);
    this.ddbClassDefinition = this.ddbClass.definition;

    // quick helpers
    this.classFeatureIds = this.ddbClass.definition.classFeatures.map((f) => f.id);
    this.subClassFeatureIds = this.ddbClass.subclassDefinition && this.ddbClass.subclassDefinition.name
      ? this.ddbClass.classFeatures
        .filter((f) => f.definition.classId === this.ddbClass.subclassDefinition.id)
        .map((f) => f.definition.id)
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

  // this excludes any class/sub class features
  _determineClassFeatures() {
    this._excludedFeatureIds = this._isSubClass
      ? this.classFeatureIds
      : this.subClassFeatureIds;

    this.classFeatures = this.getClassFeatures(this._excludedFeatureIds);
  }

  isMartialArtist() {
    return this.classFeatures.some((feature) => feature.name === "Martial Arts");
  }

  /**
   * Retrieves the class features, excluding the ones specified by their IDs.
   *
   * @param {Array} excludedIds - An array of IDs of class features to exclude (default: [])
   * @return {Array} An array of class features
   */
  getClassFeatures(excludedIds = []) {
    const excludedFeatures = this.ddbData.character.optionalClassFeatures
      .filter((f) => f.affectedClassFeatureId)
      .map((f) => f.affectedClassFeatureId);

    const optionFeatures = this.ddbData.classOptions
      ? this.ddbData.classOptions
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

  async _buildClassFeaturesDescription() {
    logger.debug(`Parsing ${this.ddbClassDefinition.name} features`);
    let description = "<h1>Class Features</h1>\n\n";
    let classFeatures = [];

    this.classFeatures.forEach((feature) => {
      const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

      if (!classFeaturesAdded && !this._excludedFeatureIds.includes(feature.id)) {
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
      const mods = DDBHelper.getChosenClassModifiers(this.ddbData);
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

  // don't generate feature advancements for these features
  static EXCLUDED_FEATURE_ADVANCEMENTS = [
    "Ability Score Improvement",
    "Expertise",
    "Bonus Proficiencies",
    "Bonus Proficiency",
    "Tool Proficiency",

    "Speed",
    "Size",
    "Feat",
    "Languages",
    "Hit Points",
    "Proficiencies",

    // tashas
    "Primal Knowledge",
    "Martial Versatility",
  ];

  async _generateFeatureAdvancements() {
    logger.debug(`Parsing ${this.ddbClass.definition.name} features for advancement`);

    const advancements = [];
    this.classFeatures
      .filter((feature) => this.legacyMode || (!this.legacyMode && !DDBClass.EXCLUDED_FEATURE_ADVANCEMENTS.includes(feature.name)))
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
            this._advancementMatches.features[advancements[levelAdvancement]._id][featureMatch.name] = featureMatch.uuid;
          }
        }
      });

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateScaleValueAdvancementsFromFeatures() {
    let specialFeatures = [];
    const advancements = this.classFeatures
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
        const proficiencyFeature = this._proficiencyFeatures.find((f) => f.requiredLevel === i);
        if (!availableToMulticlass && i > 1) return;
        if (!proficiencyFeature) return;

        const modFilters = {
          includeExcludedEffects: true,
          classId: this.ddbClassDefinition.id,
          exactLevel: i,
          availableToMulticlass,
          useUnfilteredModifiers: true,
        };
        const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
        const updates = DICTIONARY.character.abilities
          .filter((ability) => {
            return DDBHelper.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
          })
          .map((ability) => `saves:${ability.value}`);
        // create a leveled advancement
        if (updates.length > 0) {
          const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
          const update = {
            classRestriction: i > 1 ? "" : availableToMulticlass ? "secondary" : "primary",
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

  _parseSkillChoicesFromOptions(level) {
    const skillsChosen = new Set();
    const skillChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices.class.filter((choice) =>
      this._proficiencyFeatures.some((f) => f.id === choice.componentId && f.requiredLevel === level)
      && choice.subType === 1
      && choice.type === 2
    ).forEach((choice) => {
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

  _parseLanguageChoicesFromOptions(level) {
    const languagesChosen = new Set();
    const languageChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices.class.filter((choice) =>
      this._proficiencyFeatures.some((f) => f.id === choice.componentId && f.requiredLevel === level)
      && choice.subType === 3
      && choice.type === 2
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.character.languages.find((lang) => lang.name === option.label);
      if (smallChosen) languagesChosen.add(smallChosen.value);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.languages.find((lang) => lang.name === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.languages.find((lang) => lang.name === option.label).value
      );
      optionNames.forEach((skill) => {
        languageChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(languagesChosen),
      choices: Array.from(languageChoices),
    };
  }

  _parseExpertiseChoicesFromOptions(level) {
    const skillsChosen = new Set();
    const skillChoices = new Set();
    const toolsChosen = new Set();
    const toolChoices = new Set();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices.class.filter((choice) =>
      this._expertiseFeatures.some((f) => f.id === choice.componentId && f.requiredLevel === level)
      && choice.subType === 2
      && choice.type === 2
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosenSkill = DICTIONARY.character.skills.find((skill) => skill.label === option.label);
      if (smallChosenSkill) skillsChosen.add(smallChosenSkill.name);
      const smallChosenTool = DICTIONARY.character.proficiencies.find((p) => p.type === "Tool" && p.name === option.label);
      if (smallChosenTool) toolsChosen.add(smallChosenTool.baseTool);

      const skillOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.skills.find((skill) => skill.label === option.label).name
      );
      skillOptionNames.forEach((skill) => {
        skillChoices.add(skill);
      });

      const toolOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.character.proficiencies.find((p) => p.type === "Tool" && p.name === option.label)
        && choice.optionIds.includes(option.id)
      ).map((option) =>
        DICTIONARY.character.proficiencies.find((p) => p.type === "Tool" && p.name === option.label).baseTool
      );
      toolOptionNames.forEach((tool) => {
        toolChoices.add(tool);
      });
    });

    return {
      skills: {
        chosen: Array.from(skillsChosen),
        choices: Array.from(skillChoices),
      },
      tools: {
        chosen: Array.from(toolsChosen),
        choices: Array.from(toolChoices),
      },
    };
  }

  static _advancementUpdate(advancement, pool, chosen, count) {
    if ((pool.length === chosen.length || (pool.length === 1 && chosen.length > 1))
        && chosen.length > 0
    ) {
      advancement.updateSource({
        configuration: {
          grants: pool,
        }
      });
    } else {
      advancement.updateSource({
        configuration: {
          choices: [{
            count,
            pool,
          }],
        }
      });
    }

    if (chosen.length > 0) {
      advancement.updateSource({
        value: {
          chosen,
        },
      });
    }
  }
  _generateSkillAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if (availableToMulticlass && this.dictionary.multiclassSkill === 0) return;
        if (!availableToMulticlass && i > 1) return;
        const proficiencyFeature = this._proficiencyFeatures.find((f) => f.requiredLevel === i);
        if (!proficiencyFeature) return;

        const modFilters = {
          includeExcludedEffects: true,
          classId: this.ddbClassDefinition.id,
          exactLevel: i,
          availableToMulticlass: availableToMulticlass === false ? null : true,
          useUnfilteredModifiers: true,
        };
        const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
        const skillExplicitMods = mods.filter((mod) =>
          mod.type === "proficiency"
          && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType)
        );
        const skillChooseMods = DDBHelper.filterModifiers(mods, "proficiency", { subType: `choose-a-${this.ddbClassDefinition.name.toLowerCase()}-skill` });
        const skillMods = skillChooseMods.concat(skillExplicitMods);

        const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

        const parsedSkills = AdvancementHelper.parseHTMLSkills(proficiencyFeature.description);
        const chosenSkills = this._parseSkillChoicesFromOptions(i);

        const skillCount = this.options.noMods
          ? parsedSkills.number
          : availableToMulticlass
            ? this.dictionary.multiclassSkill
            : skillMods.length;

        if (skillCount === 0) return;

        const initialUpdate = {
          title: proficiencyFeature.name !== "Proficiencies" ? proficiencyFeature.name : "Skills",
          classRestriction: i > 1 ? "" : availableToMulticlass ? "secondary" : "primary",
          configuration: {
            allowReplacements: false,
            choices: [{
              count: skillCount,
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

  _generateLanguageAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if (availableToMulticlass && this.dictionary.multiclassSkill === 0) return;
        if (!availableToMulticlass && i > 1) return;
        const proficiencyFeature = this._proficiencyFeatures.find((f) => f.requiredLevel === i);
        if (!proficiencyFeature) return;

        const modFilters = {
          includeExcludedEffects: true,
          classId: this.ddbClassDefinition.id,
          exactLevel: i,
          availableToMulticlass: availableToMulticlass === false ? null : true,
          useUnfilteredModifiers: true,
        };
        const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
        const languagesMods = DDBHelper.filterModifiers(mods, "language");

        const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

        const parsedLanguages = AdvancementHelper.parseHTMLLanguages(proficiencyFeature.description);
        const chosenLanguages = this._parseLanguageChoicesFromOptions(i);

        const languageCount = this.options.noMods
          ? parsedLanguages.number
          : availableToMulticlass
            ? this.dictionary.multiclassSkill
            : languagesMods.length;

        if (languageCount === 0) return;

        const initialUpdate = {
          title: proficiencyFeature.name !== "Proficiencies" ? proficiencyFeature.name : "Languages",
          classRestriction: i > 1 ? "" : availableToMulticlass ? "secondary" : "primary",
          configuration: {
            allowReplacements: false,
            choices: [{
              count: languageCount,
              pool: parsedLanguages.choices.map((choice) => `languages:${choice}`),
            }],
          },
          level: i,
        };

        advancement.updateSource(initialUpdate);

        if (chosenLanguages.chosen.length > 0) {
          advancement.updateSource({
            value: {
              chosen: chosenLanguages.chosen.map((choice) => `languages:${choice}`),
            },
          });
        }

        advancements.push(advancement.toObject());
      });
    }


    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateExpertiseAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const expertiseFeature = this._expertiseFeatures.find((f) => f.requiredLevel === i);

      // eslint-disable-next-line no-continue
      if (!expertiseFeature) continue;

      const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
      const expertiseOptions = this._parseExpertiseChoicesFromOptions(i);

      console.warn("EXPERTISE PARSING", {
        expertiseOptions,
        i,
        expertiseFeature,
        this: this,
      });
      // if (expertiseCount === 0) return;

      const pool = this.ddbClass.definition.name === "Rogue"
        ? ["skills:*", "tool:thief"]
        : ["skills:*"];

      const initialUpdate = {
        title: "Expertise",
        classRestriction: "",
        configuration: {
          allowReplacements: false,
          mode: "expertise",
          choices: [{
            count: 2,
            // pool: parsedExpertise.choices,
            pool,
          }],
        },
        level: i,
      };

      advancement.updateSource(initialUpdate);

      const chosenSkills = expertiseOptions.skills.chosen.map((skill) => `skills:${skill}`);
      const chosenTools = expertiseOptions.tools.chosen.map((tool) => `tool:${tool}`);
      const finalChoices = [].concat(chosenSkills, chosenTools);
      if (finalChoices.length > 0) {
        advancement.updateSource({
          value: {
            chosen: finalChoices
          },
        });
      }

      advancements.push(advancement.toObject());
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

  _generateAbilityScoreAdvancement() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const isAbilityAdvancement = this.classFeatures.find((f) => f.name === "Ability Score Improvement" && f.requiredLevel === i);

      // eslint-disable-next-line no-continue
      if (!isAbilityAdvancement) continue;
      const advancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();
      advancement.updateSource({ configuration: { points: 2 }, level: i, value: { type: "asi" } });

      // if advancement has taken ability improvements
      const modFilters = {
        includeExcludedEffects: true,
        classId: this.ddbClassDefinition.id,
        exactLevel: i,
        useUnfilteredModifiers: true,
      };
      const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

      const assignments = {};
      DICTIONARY.character.abilities.forEach((ability) => {
        const count = DDBHelper.filterModifiers(mods, "bonus", { subType: `${ability.long}-score` }).length;
        if (count > 0) assignments[ability.value] = count;
      });

      // create a leveled advancement
      if (Object.keys(assignments).length > 0) {
        const update = {
          value: {
            assignments,
          },
        };
        advancement.updateSource(update);
      } else {
        const update = {
          value: {
            type: "feat",
            feat: {
            },
          },
        };
        // feat id selection happens later once features have been generated
        // "type": "feat",
        // "feat": {
        //   "vu8kJ2iTCEiGQ1mv": "Compendium.world.ddb-test2-ddb-feats.Item.3mfeQMT6Fh1VRubU"
        // }
        advancement.updateSource(update);
        const featureMatch = this.getFeatureCompendiumMatch(isAbilityAdvancement);
        this._advancementMatches.features[advancement._id] = {};
        this._advancementMatches.features[advancement._id][featureMatch.name] = featureMatch.uuid;
      }

      advancements.push(advancement.toObject());
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }


  async _generateCommonAdvancements() {
    this._generateScaleValueAdvancementsFromFeatures();
    await this._generateFeatureAdvancements();
    this._generateSaveAdvancements();
    this._generateSkillAdvancements();
    this._generateExpertiseAdvancements();
    // TODO: Language advancements
    // TODO: Armor and weapons
    // TODO: Tools
    // Equipment? (for backgrounds)
    this._generateSpellCastingProgression();
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
    this._setClassLevel();
    this._fleshOutCommonDataStub();

    // these are class specific
    this._generateHPAdvancement(character);
    await this._generateCommonAdvancements();
    this._generateHitDice();
    this._generateAbilityScoreAdvancement();

    // if pre 2.4 generate skills and saves as data not advancements
    this._setLegacySkills();
    this._setLegacySaves();

    // finally a description
    await this._generateDescriptionStub(character);

    this._fixes();
  }

}
