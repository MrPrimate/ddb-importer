import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import AdvancementHelper from '../advancements/AdvancementHelper.js';
import { getGenericConditionAffectData } from '../../effects/effects.js';


export default class DDBClass {

  static SPECIAL_ADVANCEMENTS = {};

  static PROFICIENCY_FEATURES = [
    "Proficiencies",
    "Primal Knowledge",
    "Master of Intrigue",
    "Implements of Mercy",
    "Bonus Proficiencies",
    "Otherworldly Glamour",
    "Survivalist",
    "Training in War and Song",
    "Elegant Courtier", // this is a you get a thing or otherwise choose from two others
  ];

  static EXPERTISE_FEATURES = [
    "Expertise",
    "Canny",
    "Deft Explorer",
    "Survivalist",
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
    "Proficiencies",
    "Tool Proficiency",
    "Tools of the Trade",
    "Student of War",
    "Gunsmith",
    "Implements of Mercy",
    "Master of Intrigue",
  ];

  static ARMOR_FEATURES = [
    "Proficiencies",
    "Tools of the Trade",
    "Training in War and Song",
  ];

  static WEAPON_FEATURES = [
    "Proficiencies",
    "Firearm Proficiency",
    "Training in War and Song",
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
    const classSource = DDBHelper.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
  }

  _fleshOutCommonDataStub() {
    this.data.system.identifier = utils.referenceNameString(this.ddbClassDefinition.name.toLowerCase());
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

    this.advancementHelper = new AdvancementHelper({
      ddbData,
      type: "class",
    });

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

    const skills = this.advancementHelper.getSkillChoicesFromOptions(null, 1);

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

    // TO DO: for choice features such as fighting styles:

    // {
    //   "type": "ItemChoice",
    //   "configuration": {
    //     "hint": "Choose one of the following options. You can’t take a Fighting Style option more than once, even if you later get to choose again.",
    //     "choices": {
    //       "2": 1
    //     },
    //     "allowDrops": true,
    //     "type": "feat",
    //     "pool": [
    //       "Compendium.dnd5e.classfeatures.8YwPFv3UAPjWVDNf",
    //       "Compendium.dnd5e.classfeatures.zSlV0O2rQMdoq6pB",
    //       "Compendium.dnd5e.classfeatures.hCop9uJrWhF1QPb4",
    //       "Compendium.dnd5e.classfeatures.mHcSjcHJ8oZu3hkb"
    //     ],
    //     "spell": {
    //       "ability": "",
    //       "preparation": "",
    //       "uses": {
    //         "max": "",
    //         "per": ""
    //       }
    //     },
    //     "restriction": {
    //       "type": "class",
    //       "subtype": "fightingStyle",
    //       "level": ""
    //     }
    //   },
    //   "value": {},
    //   "title": "Fighting Style",
    //   "icon": "systems/dnd5e/icons/svg/item-choice.svg",
    //   "_id": "ih8WlydEZdg3rCPh"
    // },

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
    const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const updates = DICTIONARY.character.abilities
      .filter((ability) => {
        return DDBHelper.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
      })
      .map((ability) => `saves:${ability.value}`);

    if (updates.length === 0) return null;

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    advancement.updateSource({
      classRestriction: level > 1 ? "" : availableToMulticlass ? "secondary" : "primary",
      configuration: {
        grants: updates,
        allowReplacements: false,
      },
      level: level,
    });

    // add selection
    if (updates.length > 0) {
      advancement.updateSource({
        value: {
          chosen: updates,
        },
      });
    }

    return advancement;

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

    const baseProficiency = feature.name === "Proficiencies";
    const classModFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: i,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, classModFilters);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType)
    );
    const filterModOptions = { subType: `choose-a-${this.ddbClassDefinition.name.toLowerCase()}-skill` };
    const skillChooseMods = DDBHelper.filterModifiers(mods, "proficiency", filterModOptions);
    const skillMods = skillChooseMods.concat(skillExplicitMods);

    const skillsFromMods = skillMods
      .filter((mod) =>
        DICTIONARY.character.skills.find((s) => s.label === mod.friendlySubtypeName)
      )
      .map((mod) =>
        DICTIONARY.character.skills.find((s) => s.label === mod.friendlySubtypeName).name
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedSkills = AdvancementHelper.parseHTMLSkills(feature.description);
    const chosenSkills = this.advancementHelper.getSkillChoicesFromOptions(feature, i);

    const count = this.options.noMods || parsedSkills.number > 0 || parsedSkills.grants.length > 0
      ? parsedSkills.number
      : baseProficiency && availableToMulticlass
        ? this.dictionary.multiclassSkill
        : skillMods.length;

    // console.warn(`Parsing skill advancement for level ${i}`, {
    //   availableToMulticlass,
    //   i,
    //   proficiencyFeature,
    //   mods,
    //   skillExplicitMods,
    //   skillChooseMods,
    //   skillMods,
    //   parsedSkills,
    //   chosenSkills,
    //   skillCount: count,
    //   skillsFromMods,
    // });

    if (count === 0 && parsedSkills.grants.length === 0) return null;

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "Skills",
      classRestriction: i > 1 ? "" : availableToMulticlass ? "secondary" : "primary",
      configuration: {
        allowReplacements: false,
      },
      level: i,
    });

    const pool = this.options.noMods || parsedSkills.choices.length > 0 || parsedSkills.grants.length > 0
      ? parsedSkills.choices.map((skill) => `skills:${skill}`)
      : skillsFromMods.map((choice) => `skills:${choice}`);

    const chosen = this.options.noMods || chosenSkills.chosen.length > 0
      ? chosenSkills.chosen.map((choice) => `skills:${choice}`).concat(parsedSkills.grants.map((grant) => `skills:${grant}`))
      : skillsFromMods.map((choice) => `skills:${choice}`);

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedSkills.grants.map((grant) => `skills:${grant}`),
    });

    return advancement;
  }

  _generateSkillAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      // eslint-disable-next-line complexity
      [true, false].forEach((availableToMulticlass) => {
        if (!availableToMulticlass && i > 1) return;
        const skillFeatures = this._proficiencyFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of skillFeatures) {
          const baseProficiency = feature.name === "Proficiencies";
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const languagesMods = DDBHelper.filterModifiers(mods, "language");

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedLanguages = AdvancementHelper.parseHTMLLanguages(feature.description);
    const chosenLanguages = this.advancementHelper.getLanguageChoicesFromOptions(feature, level);

    const languagesFromMods = languagesMods
      .filter((mod) => DICTIONARY.character.languages.find((lang) => lang.name === mod.friendlySubtypeName))
      .map((mod) => {
        const language = DICTIONARY.character.languages.find((lang) => lang.name === mod.friendlySubtypeName);
        return language.advancement ? `${language.advancement}:${language.value}` : language.value;
      });

    const count = this.options.noMods || parsedLanguages.number > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.number !== 0
        ? parsedLanguages.number
        : 1
      : languagesMods.length;

    console.warn(`Languages`, {
      i: level,
      languageFeature: feature,
      mods,
      languagesMods,
      parsedLanguages,
      chosenLanguages,
      languagesFromMods,
      languageCount: count,
    });

    if (count === 0 && parsedLanguages.grants.length === 0) return null;

    const pool = this.options.noMods || parsedLanguages.choices.length > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.choices.map((choice) => `languages:${choice}`)
      : languagesFromMods.map((choice) => `languages:${choice}`);

    const chosen = this.options.noMods || chosenLanguages.chosen.length > 0
      ? chosenLanguages.chosen.map((choice) => `languages:${choice}`).concat(parsedLanguages.grants.map((grant) => `languages:${grant}`))
      : languagesFromMods.map((choice) => `languages:${choice}`);

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "Languages",
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count: count,
      grants: parsedLanguages.grants.map((grant) => `languages:${grant}`),
    });

    return advancement;
  }

  _generateLanguageAdvancements() {
    if (this.legacyMode) return;
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
    if (this.legacyMode) return;
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
        if (skillAdvancement && languageAdvancement) {
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const proficiencyMods = DDBHelper.filterModifiers(mods, "proficiency");
    const toolMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.character.proficiencies
          .some((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName)
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedTools = AdvancementHelper.parseHTMLTools(feature.description);
    const chosenTools = this.advancementHelper.getToolChoicesFromOptions(feature, level);

    const toolsFromMods = toolMods.map((mod) => {
      const tool = DICTIONARY.character.proficiencies.find((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName);
      return tool.toolType === ""
        ? tool.baseTool
        : `${tool.toolType}:${tool.baseTool}`;
    });

    const count = this.options.noMods || parsedTools.number > 0 || parsedTools.grants.length > 0
      ? parsedTools.number > 0
        ? parsedTools.number
        : 1
      : toolMods.length;

    // console.warn(`Tools`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods,
    //   parsedTools,
    //   chosenTools,
    //   toolsFromMods,
    //   count,
    // });

    if (count === 0 && parsedTools.grants.length === 0) return null;

    const pool = this.options.noMods || parsedTools.choices.length > 0 || parsedTools.grants.length > 0
      ? parsedTools.choices.map((choice) => `tool:${choice}`)
      : toolsFromMods.map((choice) => `tool:${choice}`);


    const chosen = this.options.noMods || chosenTools.chosen.length > 0
      ? chosenTools.chosen.map((choice) => `tool:${choice}`).concat(parsedTools.grants.map((grant) => `tool:${grant}`))
      : toolsFromMods.map((choice) => `tool:${choice}`);

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "Tool Proficiencies",
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("tools", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    });

    return advancement;
  }

  _generateToolAdvancements() {
    if (this.legacyMode) return;
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

  _generateArmorAdvancement(feature, level) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const proficiencyMods = DDBHelper.filterModifiers(mods, "proficiency");
    const armorMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.character.proficiencies
          .some((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName)
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedArmors = AdvancementHelper.parseHTMLArmorProficiencies(feature.description);
    const chosenArmors = this.advancementHelper.getChoicesFromOptions(feature, "Armor", level);

    const armorsFromMods = armorMods.map((mod) => {
      const armor = DICTIONARY.character.proficiencies
        .find((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName);
      return armor.advancement === ""
        ? armor.foundryValue
        : `${armor.advancement}:${armor.foundryValue}`;
    });

    const count = this.options.noMods || parsedArmors.number > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.number > 0
        ? parsedArmors.number
        : 1
      : armorMods.length;

    // console.warn(`Armor`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods: armorMods,
    //   parsedArmors,
    //   chosenArmors,
    //   armorsFromMods,
    //   count,
    // });

    if (count === 0 && parsedArmors.grants.length === 0) return null;

    const pool = this.options.noMods || parsedArmors.choices.length > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.choices.map((choice) => `armor:${choice}`)
      : armorsFromMods.map((choice) => `armor:${choice}`);


    const chosen = this.options.noMods || chosenArmors.chosen.length > 0
      ? chosenArmors.chosen.map((choice) => `armor:${choice}`).concat(parsedArmors.grants.map((grant) => `armor:${grant}`))
      : armorsFromMods.map((choice) => `armor:${choice}`);

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "Armor Proficiencies",
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("tools", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedArmors.grants.map((grant) => `armor:${grant}`),
    });

    return advancement;
  }

  _generateArmorAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const armorFeatures = this._armorFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of armorFeatures) {
        const advancement = this._generateArmorAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject());
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const proficiencyMods = DDBHelper.filterModifiers(mods, "proficiency");
    const weaponMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.character.proficiencies
          .some((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName)
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedWeapons = AdvancementHelper.parseHTMLWeaponProficiencies(feature.description);
    const chosenWeapons = this.advancementHelper.getChoicesFromOptions(feature, "Weapon", level);

    const weaponsFromMods = weaponMods.map((mod) => {
      const weapon = DICTIONARY.character.proficiencies
        .find((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName);
      return weapon.advancement === ""
        ? weapon.foundryValue
        : `${weapon.advancement}:${weapon.foundryValue}`;
    });

    const count = this.options.noMods || parsedWeapons.number > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.number > 0
        ? parsedWeapons.number
        : 1
      : weaponMods.length;

    // console.warn(`Weapon`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   armorMods: weaponMods,
    //   parsedArmors: parsedWeapons,
    //   chosenArmors: chosenWeapons,
    //   armorsFromMods: weaponsFromMods,
    //   count,
    // });

    if (count === 0 && parsedWeapons.grants.length === 0) return null;

    const pool = this.options.noMods || parsedWeapons.choices.length > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.choices.map((choice) => `weapon:${choice}`)
      : weaponsFromMods.map((choice) => `weapon:${choice}`);


    const chosen = this.options.noMods || chosenWeapons.chosen.length > 0
      ? chosenWeapons.chosen.map((choice) => `weapon:${choice}`).concat(parsedWeapons.grants.map((grant) => `weapon:${grant}`))
      : weaponsFromMods.map((choice) => `weapon:${choice}`);

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "Weapon Proficiencies",
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("weapons", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    });

    return advancement;
  }

  _generateWeaponAdvancements() {
    if (this.legacyMode) return;
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


  _generateExpertiseAdvancement(feature, level) {
    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    const expertiseOptions = this.advancementHelper.getExpertiseChoicesFromOptions(feature, level);

    // add HTML Parsing to improve this at a later date

    const pool = feature.name === "Survivalist"
      ? ["skills:prc", "skills:nat"]
      : feature.name === "Expertise"
        ? ["skills:*", "tool:thief"]
        : ["skills:*"];

    const grants = feature.name === "Survivalist"
      ? pool
      : [];

    const count = feature.name === "Survivalist"
      ? 0
      : expertiseOptions.length > 0
        ? expertiseOptions.length
        : 2;

    advancement.updateSource({
      title: feature.name === "Survivalist" ? `${feature.name} (Expertise)` : `${feature.name}`,
      configuration: {
        allowReplacements: false,
        pool,
        mode: "expertise",
      },
      level: level,
    });

    const chosenSkills = expertiseOptions.skills.chosen.map((skill) => `skills:${skill}`);
    const chosenTools = expertiseOptions.tools.chosen.map((tool) => `tool:${tool}`);
    const chosen = [].concat(chosenSkills, chosenTools, grants);

    AdvancementHelper.advancementUpdate(advancement, {
      chosen,
      count,
      grants,
    });

    return advancement;

  }

  _generateExpertiseAdvancements() {
    if (this.legacyMode) return;
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      const expertiseFeature = this._expertiseFeatures.find((f) => f.requiredLevel === i);
      // eslint-disable-next-line no-continue
      if (!expertiseFeature) continue;

      const advancement = this._generateExpertiseAdvancement(expertiseFeature, i);
      if (advancement) advancements.push(advancement.toObject());
    }

    this.data.system.advancement = this.data.system.advancement.concat(advancements);
  }

  static CONDITION_MAPPING = {
    1: "dr",
    2: "di",
    3: "dv",
    4: "ci",
  };

  _generateConditionAdvancement(feature, level) {

    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

    const conditionsFromMods = [];
    ["resistance", "immunity", "vulnerability", "immunity"].forEach((condition, i) => {
      const proficiencyMods = DDBHelper.filterModifiers(mods, condition, { restriction: null });
      const conditionId = i + 1;
      const conditionData = getGenericConditionAffectData(proficiencyMods, condition, conditionId, true);
      const conditionValues = new Set(conditionData.map((result) => `${DDBClass.CONDITION_MAPPING[conditionId]}:${result.value}`));
      // console.warn("Individual Parse", {
      //   proficiencyMods,
      //   condition,
      //   conditionId,
      //   conditionData,
      //   conditionValues,
      // });
      conditionsFromMods.push(...conditionValues);
    });

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedConditions = AdvancementHelper.parseHTMLConditions(feature.description);

    const count = this.options.noMods || parsedConditions.number > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.number > 0
        ? parsedConditions.number
        : 1
      : conditionsFromMods.length;

    // console.warn(`Conditions`, {
    //   level,
    //   feature,
    //   mods,
    //   conditionsFromMods,
    //   parsedConditions,
    //   count,
    // });

    if (count === 0 && parsedConditions.grants.length === 0) return null;

    const pool = this.options.noMods || parsedConditions.choices.length > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.choices.map((choice) => choice)
      : conditionsFromMods.map((choice) => choice);

    const chosen = this.options.noMods
      ? parsedConditions.grants.map((grant) => grant)
      : conditionsFromMods.map((choice) => choice);

    advancement.updateSource({
      title: feature.name !== "Proficiencies" ? feature.name : "",
      configuration: {
        allowReplacements: false,
        hint: parsedConditions.hint,
      },
      level: level,
    });

    // console.warn("conditions", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedConditions.grants.map((grant) => grant),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedConditions.grants.map((grant) => grant),
    });

    return advancement;
  }

  _generateConditionAdvancements() {
    if (this.legacyMode) return;
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
    this._generateLanguageAdvancements();
    this._generateToolAdvancements();
    this._generateArmorAdvancements();
    this._generateWeaponAdvancements();
    // FUTURE: Equipment? (for backgrounds), needs better handling in Foundry
    this._generateSkillOrLanguageAdvancements();
    this._generateConditionAdvancements();
    this._generateSpellCastingProgression();
    // FUTURE: choice options such as fighting styles, this requires improved feature parsing
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
