import {
  logger,
  utils,
  CompendiumHelper,
  DDBCompendiumFolders,
  DDBItemImporter,
  DDBSources,
} from '../../lib/_module.mjs';
import { getSpellCastingAbility } from "../spells/ability.js";
import AdvancementHelper from '../advancements/AdvancementHelper.js';
import { SETTINGS, DICTIONARY } from '../../config/_module.mjs';
import { DDBDataUtils, DDBModifiers, DDBTemplateStrings, SystemHelpers } from '../lib/_module.mjs';
import DDBFeatureMixin from '../features/DDBFeatureMixin.js';

export default class DDBClass {

  addToCompendium = null;

  compendiumImportTypes = ["classes", "subclasses"];

  updateCompendiumItems = null;

  rules = "2014";

  name;

  className;

  isMuncher = false;

  isSubClass = false;

  choiceMap = new Map();

  spellLinks = [];

  configChoices = {};

  _indexFilter = {
    features: {
      fields: [
        "name",
        "flags.ddbimporter.classId",
        "flags.ddbimporter.class",
        "flags.ddbimporter.subClass",
        "flags.ddbimporter.parentClassId",
        "flags.ddbimporter.originalName",
        "flags.ddbimporter.featureMeta",
        "flags.ddbimporter.dndbeyond.choice.optionId",
        "flags.ddbimporter.isChoice",
        "flags.ddbimporter.is2014",
        "flags.ddbimporter.is2024",
      ],
    },
    feats: {
      fields: [
        "name",
        // "flags.ddbimporter",
        "flags.ddbimporter.is2014",
        "flags.ddbimporter.is2024",
        "flags.ddbimporter.featureMeta",
        "flags.ddbimporter.subType",
        "system.type.subtype",
      ],
    },
    class: {},
    subclasses: {},
  };

  static SPECIAL_ADVANCEMENTS = {
    "Wild Shape": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Wild Shape CR" },
      additionalAdvancements: false,
      additionalFunctions: [],
    },
  };

  static NO_ADVANCEMENT_2014 = [
    "rage",
  ];

  static NO_ADVANCEMENT_2024 = [];

  static NOT_ADVANCEMENT_FOR_FEATURE = [
    "Bardic Inspiration",
  ];

  static PROFICIENCY_FEATURES = [
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Proficiencies",
    "Primal Knowledge",
    "Master of Intrigue",
    "Implements of Mercy",
    "Bonus Proficiencies",
    "Otherworldly Glamour",
    "Survivalist",
    "Training in War and Song",
    "Blessings of Knowledge",
    "Elegant Courtier", // this is a you get a thing or otherwise choose from two others
    "Blessings of Knowledge",
  ];

  static EXPERTISE_FEATURES = [
    "Expertise",
    "Canny",
    "Deft Explorer",
    "Survivalist",
    "Blessings of Knowledge",
    "Scholar",
    // "Tool Expertise", // revisit,this doesn't work the same way
  ];

  static PROFICIENCY_OR_EXPERTISE_FEATURES = [
    "Mystical Erudition",
    "Mystical Erudition (Additional)",
  ];

  static LANGUAGE_FEATURES = [
    "Proficiencies",
    "Primal Knowledge",
    "Master of Intrigue",
    "Thieves' Cant",
    "Druidic",
    "Giant's Power",
    "Blessings of Knowledge",
    "Mystical Erudition",
    "Draconic Disciple",
    "Tongue of Dragons",
    "Wind Speaker",
    "Master of Intrigue",
    "Favored Enemy",
    "Deft Explorer",
    "Canny",
    "Draconic Gift",
    "Speech of the Woods",
  ];

  // you gain proficiency in one of the following skills of your choice: Animal Handling, History, Insight, Performance, or Persuasion. Alternatively, you learn one language of your choice.
  static LANGUAGE_OR_SKILL_FEATURE = [
    "Bonus Proficiency",
  ];

  static TOOL_FEATURES = [
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Proficiencies",
    "Tool Proficiency",
    "Tools of the Trade",
    "Student of War",
    "Gunsmith",
    "Implements of Mercy",
    "Master of Intrigue",
    "Blessings of Knowledge",
  ];

  static ARMOR_FEATURES = [
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Proficiencies",
    "Tools of the Trade",
    "Training in War and Song",
    "Bonus Proficiency",
    "Bonus Proficiencies",
  ];

  static WEAPON_FEATURES = [
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Proficiencies",
    "Firearm Proficiency",
    "Training in War and Song",
    "Bonus Proficiency",
    "Bonus Proficiencies",
  ];

  static WEAPON_MASTERY_FEATURES = [
    "Barbarian Weapon Masteries",
    "Bard Weapon Masteries",
    "Cleric Weapon Masteries",
    "Druid Weapon Masteries",
    "Fighter Weapon Masteries",
    "Monk Weapon Masteries",
    "Paladin Weapon Masteries",
    "Ranger Weapon Masteries",
    "Rogue Weapon Masteries",
    "Sorcerer Weapon Masteries",
    "Warlock Weapon Masteries",
    "Wizard Weapon Masteries",
    "Weapon Mastery",
    "Weapon Masteries",
  ];

  static CONDITION_FEATURES = [
    "Inured to Undeath",
    "Elemental Gift",
    "Thought Shield",
    "Necrotic Husk",
    "Radiant Soul",
    "Oceanic Soul",
    "Fathomless Soul",
    "Psychic Defenses",
    "Heart of the Storm",
    "Wind Soul",
    "Beguiling Defenses",
    "Emissary of Redemption",
    "Aura of Warding",
    "Supernatural Resistance",
    "Guarded Mind",
    "Soul of the Forge",
    "Avatar of Battle",
    "Saint of Forge and Fire",
    "Divine Health",
    "Purity of Body",
    "Storm Soul",
    // "Desert",
    // "Sea",
    // "Tundra"
    "Chemical Mastery",
    "Poison Resilience",
    "Poison Immunity",
    "Constructed Resilience",
    "Natural Resilience",
    "Mechanical Nature",
    "Acid Resistance",
    "Necrotic Resistance",
    "Mountain Born",
    "Fire Resistance",
    "Psychic Resilience",
    "Gnomish Magic Resistance",
    "Dwarven Resilience",
    "Lightning Resistance",
    "Celestial Resistance",
    "Draconic Resistance",
    "Hellish Resistance",
    "Magic Resistance",
  ];

  _generateSource() {
    const classSource = DDBSources.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
    this.data.system.source.rules = this.is2014 ? "2014" : "2024";
  }

  _fleshOutCommonDataStub() {
    // this.data.system.identifier = utils.referenceNameString(`${this.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
    this.data.system.identifier = DDBDataUtils.classIdentifierName(this.name);
    this._determineClassFeatures();

    this._proficiencyFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.PROFICIENCY_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._proficiencyFeatures = this.classFeatures
      .filter((feature) => this._proficiencyFeatureIds.includes(feature.id));

    this._expertiseFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.EXPERTISE_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._expertiseFeatures = this.classFeatures
      .filter((feature) => this._expertiseFeatureIds.includes(feature.id));

    this._languageFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.LANGUAGE_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._languageFeatures = this.classFeatures
      .filter((feature) => this._languageFeatureIds.includes(feature.id));

    this._toolFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.TOOL_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._toolFeatures = this.classFeatures
      .filter((feature) => this._toolFeatureIds.includes(feature.id));

    this._armorFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.ARMOR_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._armorFeatures = this.classFeatures
      .filter((feature) => DDBClass.ARMOR_FEATURES.includes(utils.nameString(feature.name)));

    this._weaponFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.WEAPON_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._weaponFeatures = this.classFeatures
      .filter((feature) => DDBClass.WEAPON_FEATURES.includes(utils.nameString(feature.name)));

    this._weaponMasteryFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.WEAPON_MASTERY_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._weaponMasteryFeatures = this.classFeatures
      .filter((feature) => DDBClass.WEAPON_MASTERY_FEATURES.includes(utils.nameString(feature.name)));

    this._languageOrSkillFeatureIds = this.classFeatures.concat(this._languageFeatures)
      .filter((feature) => DDBClass.LANGUAGE_OR_SKILL_FEATURE.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._languageOrSkillFeatures = this.classFeatures
      .filter((feature) => DDBClass.LANGUAGE_OR_SKILL_FEATURE.includes(utils.nameString(feature.name)));

    this._conditionFeatureIds = this.classFeatures
      .filter((feature) => DDBClass.CONDITION_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._conditionFeatures = this.classFeatures
      .filter((feature) => DDBClass.CONDITION_FEATURES.includes(utils.nameString(feature.name)));

    this._generateSource();
  }

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
    };
  }

  _generateSpellCastingProgression() {
    if (this.ddbClassDefinition.canCastSpells) {
      const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === this.className);
      const spellCastingAbility = getSpellCastingAbility(this.ddbClass, this.isSubClass, this.isSubClass);
      if (spellProgression) {
        this.data.system.spellcasting = {
          progression: spellProgression.value,
          ability: spellCastingAbility,
        };
        let formula = "";
        if ((this.ddbClassDefinition.spellRules?.levelPreparedSpellMaxes ?? []).filter((a) => a).length > 1) {
          formula = `@scale.${this.data.system.identifier}.max-prepared`;
        } else if (this.ddbClassDefinition.spellPrepareType === 1) {
          formula = `max(@abilities.${spellCastingAbility}.mod + @classes.${this.data.system.identifier}.levels, 1)`;
        }
        this.data.system.spellcasting.preparation = {
          formula,
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
    if (!this._compendiums[type]) return;
    await this._compendiums[type].getIndex(this._indexFilter[type]);
  }

  async _generateDescriptionStub(character) {
    this.data.system.description.value = "<h1>Description</h1>";
    this.data.system.description.value += this.ddbClass.definition.description;
    // this excludes the subclass features
    this.data.system.description.value += await this._buildClassFeaturesDescription();
    // not all classes have equipment descriptions
    if (this.ddbClass.definition.equipmentDescription && !this.isSubClass && this.is2014) {
      // eslint-disable-next-line require-atomic-updates
      this.data.system.description.value += `<h1>Starting Equipment</h1>\n${this.ddbClass.definition.equipmentDescription}\n\n`;
    }

    if (character) {
      this.data.system.description.value = DDBTemplateStrings.parse(
        this.ddbData,
        character,
        this.data.system.description.value,
        this.data,
      ).text;
    }
  }

  _processSources() {
    const sourceIds = this.ddbClassDefinition.sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = this.ddbClassDefinition.sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;
  }

  constructor(ddbData, classId,
    { addToCompendium = null, compendiumImportTypes = null,
      updateCompendiumItems, isMuncher } = {},
  ) {
    this.addToCompendium = addToCompendium ?? false;
    if (compendiumImportTypes) this.compendiumImportTypes = compendiumImportTypes;
    this.updateCompendiumItems = updateCompendiumItems ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    // setup ddb source
    this.isMuncher = isMuncher ?? this.isMuncher;
    this.ddbData = ddbData;
    this.ddbClass = ddbData.character.classes.find((c) => c.definition.id === classId);
    this.ddbParentClassDefinition = this.ddbClass.definition;
    this.ddbClassDefinition = this.ddbClass.definition;
    this.name = this.ddbClassDefinition.name;
    this.className = this.ddbClass.definition.name;
    this._processSources();

    // quick helpers
    this.classFeatureIds = this.ddbClass.definition.classFeatures.map((f) => f.id);
    this.subClassFeatureIds = this.ddbClass.subclassDefinition && this.ddbClass.subclassDefinition.name
      ? this.ddbClass.classFeatures
        .filter((f) => f.definition.classId === this.ddbClass.subclassDefinition.id)
        .map((f) => f.definition.id)
      : [];

    // compendium
    this._compendiums = {
      features: CompendiumHelper.getCompendiumType("classfeatures", false),
      feats: CompendiumHelper.getCompendiumType("feats", false),
      class: CompendiumHelper.getCompendiumType("class", false),
      subclasses: CompendiumHelper.getCompendiumType("subclasses", false),
    };
    // this._compendiumFeaturesLabel = CompendiumHelper.getCompendiumLabel("features");

    this._advancementMatches = {
      features: {},
    };

    this._generateDataStub();

    this.dictionary = DICTIONARY.actor.class.find((c) => c.name === this.ddbClassDefinition.name) ?? { multiclassSkill: 0 };

    this.advancementHelper = new AdvancementHelper({
      ddbData,
      type: "class",
      isMuncher: this.isMuncher,
    });

    this.SPECIAL_ADVANCEMENTS = DDBClass.SPECIAL_ADVANCEMENTS;
    this.NOT_ADVANCEMENT_FOR_FEATURE = DDBClass.NOT_ADVANCEMENT_FOR_FEATURE;
    this.NO_ADVANCEMENT_2014 = DDBClass.NO_ADVANCEMENT_2014;
    this.NO_ADVANCEMENT_2024 = DDBClass.NO_ADVANCEMENT_2024;

    this.isStartingClass = this.ddbClass.isStartingClass;

  }

  // this excludes any class/sub class features
  _determineClassFeatures() {
    this._excludedFeatureIds = this.isSubClass
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
   * @param {Array} excludedIds An array of IDs of class features to exclude (default: [])
   * @returns {Array} An array of class features
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
        && feature.definition.classId === this.ddbClassDefinition.id,
      )
      .map((feature) => feature.definition);

    return classFeatures.concat(optionFeatures)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .sort((a, b) => a.requiredLevel - b.requiredLevel);
  }

  /**
   * Finds a match in the compendium features for the given feature.
   *
   * @param {object} feature The feature to find a match for.
   * @returns {object|undefined} - The matched feature, or undefined if no match is found.
   */
  getFeatureCompendiumMatch(feature) {
    if (!this._compendiums.features) {
      return null;
    }
    return this._compendiums.features.index.find((match) => {
      const matchFlags = foundry.utils.getProperty(match, "flags.ddbimporter.featureMeta")
        ?? foundry.utils.getProperty(match, "flags.ddbimporter");
      if (!matchFlags) return false;
      const featureFlagName = foundry.utils.getProperty(matchFlags, "originalName")?.trim().toLowerCase();
      const featureFlagNameMatch = featureFlagName
        && featureFlagName == feature.name.trim().toLowerCase();
      const nameMatch = !featureFlagNameMatch
        && match.name.trim().toLowerCase() == feature.name.trim().toLowerCase();
      if (!nameMatch && !featureFlagNameMatch) return false;

      const featureClassMatch = !this.isSubClass
        && matchFlags.class == this.name
        && matchFlags.classId == this.ddbClassDefinition.id;
      const featureSubclassMatch = this.isSubClass
        && matchFlags.subClass === this.name
        && matchFlags.subClassId == this.ddbClassDefinition.id;
      return featureClassMatch || featureSubclassMatch;
    });
  }

  getCompendiumIxByFlags(compendiums, flags) {
    for (const compendium of compendiums) {
      if (!this._compendiums[compendium]) {
        continue;
      }
      logger.verbose(`Searching for feature with flags in ${compendium}:`, flags);

      const match = this._compendiums[compendium].index.find((i) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, `flags.ddbimporter.${key}`) === value;
        });
      });
      if (match) return match;
    }
    return null;
  }

  getFeatCompendiumMatch(featName) {
    if (!this._compendiums.feats) {
      return [];
    }
    const smallName = featName.trim().toLowerCase();
    return this._compendiums.feats.index.find((match) =>
      ((foundry.utils.hasProperty(match, "flags.ddbimporter.originalName")
        && smallName == match.flags.ddbimporter.originalName.trim().toLowerCase())
        || (!foundry.utils.hasProperty(match, "flags.ddbimporter.originalName")
          && (smallName == match.name.trim().toLowerCase()
          || smallName.split(":")[0].trim() == match.name.trim().toLowerCase()))
      ),
    );
  }

  async _buildClassFeaturesDescription() {
    logger.debug(`Parsing ${this.name} features`);
    let description = "<h1>Class Features</h1>\n\n";
    let classFeatures = [];

    this.classFeatures.forEach((feature) => {
      const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

      if (!classFeaturesAdded && !this._excludedFeatureIds.includes(feature.id)) {
        const featureMatch = this.getFeatureCompendiumMatch(feature);
        const levelName = (/^\d+/).test(feature.name)
          ? feature.name
          : `${feature.requiredLevel}: ${feature.name}`;
        const title = featureMatch?.uuid
          ? `<p><b>@UUID[${featureMatch.uuid}]{Level ${levelName}}</b></p>`
          : `<p><b>Level ${levelName}</b></p>`;
        description += `${title}\n${feature.description}\n\n`;
        classFeatures.push(feature.name);
      }
    });

    return description;
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

  // ADVANCEMENT FUNCTIONS

  // don't generate feature advancements for these features
  static EXCLUDED_FEATURE_ADVANCEMENTS = [
    "4: Ability Score Improvement",
    "6: Ability Score Improvement",
    "8: Ability Score Improvement",
    "12: Ability Score Improvement",
    "14: Ability Score Improvement",
    "16: Ability Score Improvement",
    "Ability Score Improvement",
    "Expertise",
    "Bonus Proficiencies",
    "Bonus Proficiency",
    "Tool Proficiency",
    "Weapon Mastery",

    "Speed",
    "Size",
    "Feat",
    "Languages",
    "Hit Points",
    "Proficiencies",
    "Fighting Style feat",

    // tashas
    "Martial Versatility",
  ];

  static EXCLUDED_FEATURE_ADVANCEMENTS_2014 = [
    "Primal Knowledge",
  ];

  featureAdvancements = [];

  async _generateFeatureAdvancementFromCompendiumMatch(feature) {
    logger.debug(`Trying to generate advancement for feature: ${feature.name}`);
    const featureMatch = this.getFeatureCompendiumMatch(feature);
    if (!featureMatch) {
      if (this.isMuncher && this.addToCompendium) {
        logger.warn(`Could not find feature advancement match for feature ${feature.name}`);
      }
      return;
    }
    const levelAdvancement = this.featureAdvancements.findIndex((advancement) => advancement.level === feature.requiredLevel);

    if (levelAdvancement == -1) {
      const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
      this._advancementMatches.features[advancement._id] = {};
      this._advancementMatches.features[advancement._id][featureMatch.name] = featureMatch.uuid;

      const update = {
        configuration: {
          items: [{ uuid: featureMatch.uuid }],
        },
        value: {},
        level: feature.requiredLevel ?? 0,
        title: "Features",
        icon: "",
        classRestriction: "",
      };
      advancement.updateSource(update);
      this.featureAdvancements.push(advancement.toObject());
    } else {
      this.featureAdvancements[levelAdvancement].configuration.items.push({ uuid: featureMatch.uuid, optional: false });
      this._advancementMatches.features[this.featureAdvancements[levelAdvancement]._id][featureMatch.name] = featureMatch.uuid;
    }

  }

  async _generateFeatureAdvancement(feature, choices) {
    console.warn(`Generating feature advancement for feature ${feature.name} with choices:`, choices);
    const keys = new Set();
    const version = this.is2014 ? "2014" : "2024";
    const uuids = new Set();
    const configChoices = {};

    for (const choice of choices) {
      // build a list of options for each choice
      const choiceRegex = /level (\d+) /i;
      const choiceLevel = choice.label.match(choiceRegex);
      const level = choiceLevel && choiceLevel.length > 1 ? parseInt(choiceLevel[1]) : 0;
      const currentCount = parseInt(configChoices[level]?.count ?? 0);
      configChoices[level] = { count: currentCount + 1, replacement: false };

      const key = `${choice.componentTypeId}-${choice.type}-${feature.requiredLevel ?? 0}-${level}`;
      const choiceDefinition = this.ddbData.character.choices.choiceDefinitions.find((def) => def.id === `${choice.componentTypeId}-${choice.type}`);
      if (!choiceDefinition) {
        logger.warn(`Could not find choice definition for ${key}`);
        continue;
      }
      const choiceOptions = choiceDefinition.options
        .filter((o) => choice.optionIds.includes(o.id));

      if (choiceOptions.length === 0) {
        logger.warn(`Could not find choice options for ${key} with option Ids: ${choice.optionIds.join(", ")}`);
        continue;
      }
      keys.add(key);

      const features = [];
      for (const option of choiceOptions) {
        logger.verbose(`Finding feature for choice option ${option.id} (${option.label}) for feature ${feature.name}`, option);
        const compendiumFeature = this.getCompendiumIxByFlags(["features"], { // action feature
          componentId: option.id,
          is2014: this.is2014,
          is2024: this.is2024,
          classId: this.ddbParentClassDefinition.id,
        })
        ?? this.getCompendiumIxByFlags(["features"], { // choice feature
          "isChoice": true,
          classId: this.ddbParentClassDefinition.id,
          "dndbeyond.choice.optionId": option.id,
        }) ?? this.getCompendiumIxByFlags(["feats"], { // feat choice
          id: option.id,
        });
        if (compendiumFeature) {
          features.push(compendiumFeature);
          uuids.add(compendiumFeature.uuid);
        } else if (this.isMuncher && this.addToCompendium) {
          logger.info(`Could not find choice feature option id ${option.id} (${option.label}) for feature ${feature.name}`);
        }
      }

      this.choiceMap.set(key, features);
      foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.class.${this.name}${version}.feature.${feature.name}.compendiumChoices`, features);
    }

    if (uuids.size === 0) {
      logger.warn(`No valid features found for advancement of feature ${feature.name}, you can ignore this message unless you think this feature should offer an advancement choice.`);
      return;
    }
    if (Object.keys(configChoices).length === 0) {
      logger.warn(`No valid choices found for advancement of feature ${feature.name}, you can ignore this message unless you think this feature should offer an advancement choice.`);
      return;
    }

    this.configChoices[feature.name] = configChoices;
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();

    // TODO: handle replacements on configChoices e.g. eldritch invocations
    advancement.updateSource({
      title: feature.name,
      hint: feature.snippet ?? feature.description ?? "",
      configuration: {
        restriction: {
          type: "class",
          subtype: DDBFeatureMixin.getFeatureSubtype(feature.name, "class", true),
        },
        choices: configChoices,
        type: "feat",
        pool: Array.from(uuids).map((f) => {
          return { uuid: f };
        }),
        allowDrops: true,
      },
      icons: "icons/magic/symbols/cog-orange-red.webp",
    });

    // TODO: handle chosen advancements on non muncher classes

    this.data.system.advancement.push(advancement.toObject());

  }

  async _generateFeatureAdvancements() {
    logger.debug(`Parsing ${this.name} features for advancement`);
    this.featureAdvancements = [];

    const version = this.is2014 ? "2014" : "2024";

    const classFeatures = this.classFeatures.filter((feature) =>
      !DDBClass.EXCLUDED_FEATURE_ADVANCEMENTS.includes(feature.name)
      || (this.is2014 && DDBClass.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(feature.name)));
    for (const feature of classFeatures) {
      await this._generateFeatureAdvancementFromCompendiumMatch(feature);
    }
    this.data.system.advancement = this.data.system.advancement.concat(this.featureAdvancements);

    console.warn({
      this: this,
      featureAdvancements: foundry.utils.deepClone(this.featureAdvancements),
    });

    // for choice features such as fighting styles:
    // for each feature with typ3 choices, build an item choice advancement
    // then search for matching features from the choicedefintiions.
    for (const feature of classFeatures) {
      // console.warn(feature);
      const choices = this.ddbData.character.choices.class
        .filter((choice) =>
          choice.type === 3 // class choice feature
          && (!choice.defaultSubtypes || choice.defaultSubtypes.length === 0) // this kind of feature grants a fixed thing
          && choice.componentId === feature.id,
        );
      if (choices.length === 0) continue;

      // TODO: determine if different features at each level, if so, create multiple advancements
      await this._generateFeatureAdvancement(feature, choices);
    }

    foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.class.${this.name}${version}.choiceMap`, this.choiceMap);


  }

  _generateScaleValueAdvancementsFromFeatures() {
    let specialFeatures = [];
    const advancements = this.classFeatures
      .filter((feature) => feature.levelScales?.length > 0)
      .filter((feature) => !this.NOT_ADVANCEMENT_FOR_FEATURE.includes(feature.name))
      .map((feature) => {
        let advancement = AdvancementHelper.generateScaleValueAdvancement(feature);
        const specialLookup = this.SPECIAL_ADVANCEMENTS[advancement.title];
        if (specialLookup) {
          if (specialLookup.additionalAdvancements) {
            specialLookup.additionalFunctions.forEach((fn) => {
              specialFeatures.push(fn(advancement));
            });
          }
          if (specialLookup.fixFunction) advancement = specialLookup.fixFunction(advancement, specialLookup.functionArgs);
          if (specialLookup.fixFunctions) {
            specialLookup.fixFunctions.forEach((fn) => {
              advancement = fn.fn(advancement, fn.args);
            });
          }
        }
        return advancement;
      }).filter((a) =>
        (this.is2014 && !this.NO_ADVANCEMENT_2014.includes(a.configuration?.identifier))
        || (!this.is2014 && !this.NO_ADVANCEMENT_2024.includes(a.configuration?.identifier)),
      );

    this.data.system.advancement = this.data.system.advancement.concat(advancements, specialFeatures);
  }

  _generateScaleValueSpellAdvancements() {
    if (!this.ddbClassDefinition.spellRules) return;

    // max prepared
    if (this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes
      && this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes.filter((a) => a).length > 1
    ) {
      const advancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "max-prepared",
          type: "number",
          scale: {},
        },
        value: {},
        title: "Maximum Prepared Spells",
        icon: null,
      };
      for (let i = 1; i < this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes.length; i += 1) {
        const value = this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes[i];
        if (value === 0) continue;
        const previousValue = this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes[i - 1];
        if (value === previousValue) continue;
        advancement.configuration.scale[i] = {
          value,
        };
      }
      this.data.system.advancement.push(advancement);
    }

    // cantrips-known
    if (this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes) {
      const advancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "cantrips-known",
          type: "number",
          scale: {},
        },
        value: {},
        title: "Cantrips Known",
        icon: null,
      };
      for (let i = 1; i < this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes.length; i += 1) {
        const value = this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes[i];
        if (value === 0) continue;
        const previousValue = this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes[i - 1];
        if (value === previousValue) continue;
        advancement.configuration.scale[i] = {
          value,
        };
      }
      this.data.system.advancement.push(advancement);
    }

    // spells-known
    if (this.ddbClassDefinition.spellRules.levelSpellKnownMaxes) {
      const advancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "spells-known",
          type: "number",
          scale: {},
        },
        value: {},
        title: "Spells Known",
        icon: null,
      };
      for (let i = 1; i < this.ddbClassDefinition.spellRules.levelSpellKnownMaxes.length; i += 1) {
        const value = this.ddbClassDefinition.spellRules.levelSpellKnownMaxes[i];
        if (value === 0) continue;
        const previousValue = this.ddbClassDefinition.spellRules.levelSpellKnownMaxes[i - 1];
        if (value === previousValue) continue;
        advancement.configuration.scale[i] = {
          value,
        };
      }
      this.data.system.advancement.push(advancement);
    }
  }

  _generateHTMLSaveAdvancement() {
    const advancements = [];
    // FUTURE ENHANCEMENT FOR BULK: Add what to do if no mods supplied
    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSaveAdvancement(feature, availableToMulticlass, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      availableToMulticlass,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);


    return this.advancementHelper.getSaveAdvancement(mods, availableToMulticlass, level);

  }

  _generateSaveAdvancements() {
    // if (this.options.isGeneric) {
    //   this._generateHTMLSaveAdvancement();
    //   return;
    // }
    const advancements = [];
    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if (!availableToMulticlass && i > 1) return;
        const proficiencyFeatures = this._proficiencyFeatures.filter((f) => f.requiredLevel === i);

        for (const proficiencyFeature of proficiencyFeatures) {
          const advancement = this._generateSaveAdvancement(proficiencyFeature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject());
        }
      });
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSkillAdvancement(feature, availableToMulticlass, i) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: i,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.actor.skills.map((s) => s.subType).includes(mod.subType),
    );
    const filterModOptions = { subType: `choose-a-${this.name.toLowerCase()}-skill` };
    const skillChooseMods = DDBModifiers.filterModifiers(mods, "proficiency", filterModOptions);
    const skillMods = skillChooseMods.concat(skillExplicitMods);

    return this.advancementHelper.getSkillAdvancement(skillMods, feature, availableToMulticlass, i, this.dictionary.multiclassSkill);
  }

  _generateSkillAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if ((!availableToMulticlass && i > 1)) return;
        if (this.isSubClass && !availableToMulticlass) return;
        const skillFeatures = this._proficiencyFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of skillFeatures) {
          const baseProficiency = feature.name === "Proficiencies" || (feature.name.startsWith("Core") && feature.name.endsWith("Traits"));
          if (availableToMulticlass
            && baseProficiency
            && this.dictionary.multiclassSkill === 0
          // eslint-disable-next-line no-continue
          ) continue;
          const advancement = this._generateSkillAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject());
        }
      });
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateLanguageAdvancement(feature, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);

    return this.advancementHelper.getLanguageAdvancement(mods, feature, level);
  }

  _generateLanguageAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const languageFeatures = this._languageFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of languageFeatures) {
        const advancement = this._generateLanguageAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateSkillOrLanguageAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const skillFeatures = this._languageOrSkillFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of skillFeatures) {
        const skillAdvancement = this._generateSkillAdvancement(feature, true, i);
        const languageAdvancement = this._generateLanguageAdvancement(feature, i);
        // console.warn(`SkillOrLanguageAdvancements`, {
        //   i,
        //   feature,
        //   skillAdvancement,
        //   languageAdvancement,
        // });
        if (skillAdvancement && languageAdvancement && skillAdvancement.configuration.choices.length > 0) {
          const advancement = skillAdvancement.toObject();
          advancement.configuration.choices[0].pool.push(...languageAdvancement.toObject().configuration.choices[0].pool);
          advancements.push(advancement);
        } else {
          logger.error(`Failed Skill or Lanugage Advancement Generation`, {
            i,
            feature,
            skillAdvancement,
            languageAdvancement,
          });
        }
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateToolAdvancement(feature, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getToolAdvancement(mods, feature, level);
  }

  _generateToolAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const toolFeatures = this._toolFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of toolFeatures) {
        const advancement = this._generateToolAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateArmorAdvancement(feature, availableToMulticlass, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getArmorAdvancement(mods, feature, availableToMulticlass, level);
  }

  _generateArmorAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      for (const availableToMulticlass of [true, false]) {
        // multiclass only profs only at level 1
        if (!availableToMulticlass && i > 1) continue;
        if (this.isSubClass && !availableToMulticlass) continue;
        const armorFeatures = this._armorFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of armorFeatures) {
          const advancement = this._generateArmorAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject());
        }
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateWeaponAdvancement(feature, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getWeaponAdvancement(mods, feature, level);
  }

  _generateWeaponAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const weaponFeatures = this._weaponFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of weaponFeatures) {
        const advancement = this._generateWeaponAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateWeaponMasteryAdvancement(feature, level) {
    const modFilters = {
      type: "feat",
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenTypeModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getWeaponMasteryAdvancement(mods, feature, level);
  }

  _generateWeaponMasteryAdvancements() {
    const advancements = [];

    // console.warn("Weapon Mastery Advancements", {
    //   this: this,
    // });

    for (let i = 0; i <= 20; i++) {
      const weaponFeatures = this._weaponMasteryFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of weaponFeatures) {
        const advancement = this._generateWeaponMasteryAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateExpertiseAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const expertiseFeature = this._expertiseFeatures.find((f) => f.requiredLevel === i);
      // eslint-disable-next-line no-continue
      if (!expertiseFeature) continue;

      const advancement = this.advancementHelper.getExpertiseAdvancement(expertiseFeature, i);
      if (advancement) advancements.push(advancement.toObject());
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateConditionAdvancement(feature, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);

    return this.advancementHelper.getConditionAdvancement(mods, feature, level);
  }

  _generateConditionAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const conditionAdvancements = this._conditionFeatures.filter((f) => f.requiredLevel === i);
      for (const feature of conditionAdvancements) {
        const advancement = this._generateConditionAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
      }
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  _generateHPAdvancement(character) {
    // const value = "value": {
    //   "1": "max",
    //   "2": "avg"
    // },
    const value = {};

    const rolledHP = foundry.utils.getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
    const startingClass = foundry.utils.getProperty(this.data, "flags.ddbimporter.isStartingClass") === true;
    const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
    if (rolledHP && !useMaxHP) {
      const baseHP = foundry.utils.getProperty(character, "flags.ddbimporter.baseHitPoints");
      const totalLevels = foundry.utils.getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels");
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


  async _addFoundryAdvancements() {
    const packIds = this.is2014
      ? SETTINGS.FOUNDRY_COMPENDIUM_MAP["classes"]
      : SETTINGS.FOUNDRY_COMPENDIUM_MAP["classes2024"];
    for (const packId of packIds) {
      const pack = CompendiumHelper.getCompendium(packId, false);
      if (!pack) continue;
      await pack.getIndex();
      const klassMatch = pack.index.find((k) =>
        k.name === this.name
        && k.type === "class",
      );
      if (!klassMatch) continue;
      const foundryKlass = await pack.getDocument(klassMatch._id);
      const scaleAdvancements = foundryKlass.system.advancement.filter((foundryA) => {
        let identifier = foundry.utils.getProperty(foundryA, "configuration.identifier");
        if (!identifier || identifier === "") {
          identifier = DDBDataUtils.classIdentifierName(foundryA.title);
        }
        return foundryA.type === "ScaleValue"
          && !this.data.system.advancement.some((ddbA) => ddbA.configuration.identifier === identifier);
      }).map((advancement) => {
        return advancement.toObject();
      });
      this.data.system.advancement.push(...scaleAdvancements);
      return;
    }
  }

  _generateAbilityScoreAdvancement() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const abilityAdvancementFeature = this.classFeatures.find((f) => f.name.includes("Ability Score Improvement") && f.requiredLevel === i);

      // eslint-disable-next-line no-continue
      if (!abilityAdvancementFeature) continue;
      const advancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();
      advancement.updateSource({ configuration: { points: 2 }, level: i, value: { type: "asi" } });

      // if advancement has taken ability improvements
      const modFilters = {
        includeExcludedEffects: true,
        classId: this.ddbClassDefinition.id,
        exactLevel: i,
        useUnfilteredModifiers: true,
      };
      const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);

      const assignments = {};
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

      advancements.push(advancement.toObject());
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
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
    const advancement = new game.dnd5e.documents.advancement.SubclassAdvancement();
    advancement.updateSource({
      title: subClassFeature.name,
      hint: subClassFeature.snippet ?? subClassFeature.description ?? "",
      level: subClassFeature.requiredLevel,
    });
    this.data.system.advancement.push(advancement.toObject());
  }

  async _generateCommonAdvancements() {
    this._generateScaleValueAdvancementsFromFeatures();
    await this._generateFeatureAdvancements();
    this._generateSaveAdvancements();
    this._generateSkillAdvancements();
    this._generateExpertiseAdvancements();
    this._generateLanguageAdvancements();
    this._generateToolAdvancements();
    this._generateArmorAdvancements();
    this._generateWeaponAdvancements();
    this._generateWeaponMasteryAdvancements();
    // FUTURE: Equipment? (for backgrounds), needs better handling in Foundry
    this._generateSkillOrLanguageAdvancements();
    this._generateConditionAdvancements();
    this._generateSpellCastingProgression();
    this._generateScaleValueSpellAdvancements();
  }

  // fixes

  async _fightingStyleAdvancement() {
    // TODO: come back to 2014
    if (this.is2014) return;
    const advancementFound = this.data.system.advancement.some((a) => a.title === "Fighting Style");
    const needsAdvancement = this.ddbClass.classFeatures.some((f) => f.definition.name === "Fighting Style");
    if (!advancementFound && needsAdvancement) {
      const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
      advancement.updateSource({
        title: "Fighting Style",
        hint: "Choose a Fighting Style",
        configuration: {
          choices: this.configChoices["Fighting Style"] ?? {},
          restriction: {
            type: "class",
            subtype: "fightingStyle",
          },
          type: "feat",
          allowDrops: true,
        },
        icons: "icons/magic/symbols/cog-orange-red.webp",
      });
      this.data.system.advancement.push(advancement.toObject());
    }
    console.warn("Checking Fighting Style Advancements", { this: this, advancementFound, needsAdvancement });
    for (let advancement of this.data.system.advancement) {
      if (advancement.title !== "Fighting Style") continue;
      const flags = {
        "flags.ddbimporter.is2014": this.is2014,
        "flags.ddbimporter.is2024": this.is2024,
        "system.type.subtype": "fightingStyle",
      };
      const feats = this._compendiums.feats.index.filter((i) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, key) === value;
        });
      }).map((i) => i.uuid);
      advancement.configuration.pool = feats.map((f) => {
        return { uuid: f };
      });
      advancement.configuration.restriction.subType = "fightingStyle";

      console.warn("Fight Style Feat Maps", {
        advancement,
        feats,
        this: this,
      })

      if (this.data.name === "Paladin") {
        const special = this._compendiums.features.find((c) =>
          c.name.includes("Blessed Warrior")
          && foundry.utils.getProperty(c, "flags.ddbimporter.is2024") === true,
        );
        if (special) {
          advancement.configuration.pool.push({ uuid: special.uuid });
        }
      } else if (this.data.name === "Ranger") {
        const special = this._compendiums.features.find((c) =>
          c.name.includes("Druidic Warrior")
          && foundry.utils.getProperty(c, "flags.ddbimporter.is2024") === true,
        );
        if (special) {
          advancement.configuration.pool.push({ uuid: special.uuid });
        }
      }
    }
  }

  async _fixes() {
    await this._fightingStyleAdvancement();
    if (this.data.name === "Druid") {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Wild Shape CR") continue;
        advancement.configuration.type = "cr";
        advancement.configuration.scale = {
          2: { value: 0.25 },
          4: { value: 0.5 },
          8: { value: 1 },
        };
      };
      if (this.is2014) {
        const wildshape = {
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
        this.data.system.advancement.push(wildshape);
      } else {
        const wildshape = {
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
        this.data.system.advancement.push(wildshape);
        const elementalFury = {
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
        this.data.system.advancement.push(elementalFury);
        const knownForms = {
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
        this.data.system.advancement.push(knownForms);
      }
    } else if (this.data.name === "Monk") {
      for (let advancement of this.data.system.advancement) {
        if (advancement.configuration.identifier !== "martial-arts") continue;
        const die = foundry.utils.deepClone(advancement);
        die.title = "Martial Arts Die";
        die._id = foundry.utils.randomID();
        die.configuration.identifier = "die";
        this.data.system.advancement.push(die);
      }
      const ki = {
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
      this.data.system.advancement.push(ki);
    } else if (this.data.name === "Rogue" && !this.is2014) {
      const cunningStrike = {
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
      this.data.system.advancement.push(cunningStrike);
      const sneakAttack = {
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
      this.data.system.advancement.push(sneakAttack);
    } else if (this.data.name === "Barbarian" && !this.is2014) {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Brutal Strike") continue;
        advancement.configuration.type = "dice";
        advancement.configuration.scale = {
          9: { number: 1, faces: 10 },
          17: { number: 2, faces: 10 },
        };
      };

      const damage = {
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
      this.data.system.advancement.push(damage);
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Rage") continue;
        advancement.title = "Rages";
        advancement.configuration.identifier = "rages";
      };
    } else if (this.data.name === "Bard") {
      const bardicInspiration = {
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "bardic-inspiration",
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
      this.data.system.advancement.push(bardicInspiration);
    } else if (this.data.name === "Sorcerer") {
      const points = {
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

      this.data.system.advancement.push(points);
    }

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

  async _addToCompendium() {
    // console.warn("add to compendium", {
    //   addToCompendium: this.addToCompendium,
    //   compendiumImportTypes: this.compendiumImportTypes,
    //   ddbClassLevel: this.ddbClass.level,
    //   import: this.compendiumImportTypes.some((t) => ["classes", "subclasses"].includes(t)),
    //   level20: this.ddbClass.level === 20,
    // });
    if (!this.addToCompendium) return;
    if (!this.compendiumImportTypes.some((t) => ["classes", "subclasses"].includes(t))) return;

    // only add full level 20 classes
    if (this.ddbClass.level !== 20) return;

    const updateFeatures = this.updateCompendiumItems ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const type = this.isSubClass ? "subclass" : "class";
    const featureCompendiumFolders = new DDBCompendiumFolders(type);
    await featureCompendiumFolders.loadCompendium(type);

    const versionStub = this.data.system.source.rules;

    if (this.isSubClass) {
      await featureCompendiumFolders.createSubClassFeatureFolder(this.name, this.className, versionStub);
    } else {
      await featureCompendiumFolders.createClassFeatureFolder(this.name, versionStub);
    }

    const handlerOptions = {
      chrisPremades: false,
      removeSRDDuplicates: false,
      filterDuplicates: false,
      deleteBeforeUpdate: false,
      useCompendiumFolders: true,
      notifier: null,
      matchFlags: ["definitionId", "is2014"],
    };

    const data = foundry.utils.deepClone(this.data);

    for (const advancement of data.system.advancement) {
      delete advancement.value;
    }
    if (data.system.levels) data.system.levels = 1;
    if (data.system.hd) data.system.hd.spent = 0;

    const handler = await DDBItemImporter.buildHandler(type, [data], updateFeatures, handlerOptions);
    await handler.buildIndex();
  }

  // GENERATE CLASS

  async generateFromCharacter(character) {
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
