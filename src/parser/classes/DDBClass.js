import logger from '../../logger.js';
import DICTIONARY from '../../dictionary.js';
import utils from '../../lib/utils.js';
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from '../../lib/CompendiumHelper.js';
import { getSpellCastingAbility } from "../spells/ability.js";
import parseTemplateString from "../../lib/DDBTemplateStrings.js";
import AdvancementHelper from '../advancements/AdvancementHelper.js';
import SETTINGS from '../../settings.js';


export default class DDBClass {

  static SPECIAL_ADVANCEMENTS = {
    "Wild Shape": {
      fix: true,
      fixFunction: AdvancementHelper.rename,
      functionArgs: { newName: "Wild Shape CR" },
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
  };

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
  ];

  static EXPERTISE_FEATURES = [
    "Expertise",
    "Canny",
    "Deft Explorer",
    "Survivalist",
    "Blessings of Knowledge",
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
    const classSource = DDBHelper.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
    this.data.system.source.rules = this.is2014 ? "2014" : "2024";
  }

  _fleshOutCommonDataStub() {
    // this.data.system.identifier = utils.referenceNameString(`${this.ddbClassDefinition.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
    this.data.system.identifier = DDBHelper.classIdentifierName(this.ddbClassDefinition.name);
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
          ddbImg: this.ddbClass.definition.portraitAvatarUrl,
          is2014: this.is2014,
          is2024: !this.is2014,
        },
        obsidian: {
          source: {
            type: "class",
            text: this.ddbClass.definition.name,
          },
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
        if (this.ddbClassDefinition.spellRules?.levelPreparedSpellMaxes?.length > 0) {
          this.data.system.spellcasting.preparation = {
            formula: `@scale.${this.data.system.identifier}.max-prepared`,
          };
        }
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
    if (this.ddbClass.definition.equipmentDescription && !this._isSubClass && this.is2014) {
      // eslint-disable-next-line require-atomic-updates
      this.data.system.description.value += `<h1>Starting Equipment</h1>\n${this.ddbClass.definition.equipmentDescription}\n\n`;
    }

    if (character) {
      this.data.system.description.value = parseTemplateString(
        this.ddbData,
        character,
        this.data.system.description.value,
        this.data,
      ).text;
    }
  }

  constructor(ddbData, classId, { noMods = false } = {}) {
    this._indexFilter = {
      features: {
        fields: [
          "name",
          "flags.ddbimporter.classId",
          "flags.ddbimporter.class",
          "flags.ddbimporter.subClass",
          "flags.ddbimporter.parentClassId",
          "flags.ddbimporter.featureName",
        ],
      },
      feats: {
        fields: [
          "name",
          "flags.ddbimporter",
        ],
      },
      class: {},
      subclasses: {},
    };

    this.rules = "2014";

    // setup ddb source
    this.ddbData = ddbData;
    this.ddbClass = ddbData.character.classes.find((c) => c.definition.id === classId);
    this.ddbClassDefinition = this.ddbClass.definition;

    this.is2014 = this.ddbClassDefinition.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);

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

    this._isSubClass = false;
    this._generateDataStub();

    this.options = {
      noMods,
    };

    this.dictionary = DICTIONARY.character.class.find((c) => c.name === this.ddbClassDefinition.name);

    this.advancementHelper = new AdvancementHelper({
      ddbData,
      type: "class",
      noMods: this.options.noMods,
    });

    this.SPECIAL_ADVANCEMENTS = DDBClass.SPECIAL_ADVANCEMENTS;

    this.isStartingClass = this.ddbClass.isStartingClass;

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
   * @param {Object} feature - The feature to find a match for.
   * @return {Object|undefined} - The matched feature, or undefined if no match is found.
   */
  getFeatureCompendiumMatch(feature) {
    if (!this._compendiums.features) {
      return [];
    }
    return this._compendiums.features.index.find((match) =>
      ((feature.name.trim().toLowerCase() == foundry.utils.getProperty(match, "flags.ddbimporter.featureName")?.trim().toLowerCase())
        || (!foundry.utils.hasProperty(match, "flags.ddbimporter.featureName")
          && (feature.name.trim().toLowerCase() == match.name.trim().toLowerCase()
          || `${feature.name} (${this.ddbClassDefinition.name})`.trim().toLowerCase() == match.name.trim().toLowerCase()))
      )
      && foundry.utils.hasProperty(match, "flags.ddbimporter")
      && (match.flags.ddbimporter.class == this.ddbClassDefinition.name
        || match.flags.ddbimporter.parentClassId == this.ddbClassDefinition.id
        || match.flags.ddbimporter.classId == this.ddbClassDefinition.id),
    );
  }

  getFeatCompendiumMatch(featName) {
    if (!this._compendiums.feats) {
      return [];
    }
    const smallName = featName.trim().toLowerCase();
    return this._compendiums.feats.index.find((match) =>
      ((foundry.utils.hasProperty(match, "flags.ddbimporter.featureName")
        && smallName == match.flags.ddbimporter.featureName.trim().toLowerCase())
        || (!foundry.utils.hasProperty(match, "flags.ddbimporter.featureName")
          && (smallName == match.name.trim().toLowerCase()
          || smallName.split(":")[0].trim() == match.name.trim().toLowerCase()))
      ),
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
        const levelName = (/^\d+/).test(feature.name)
          ? feature.name
          : `${feature.requiredLevel}: ${feature.name}`;
        const title = (featureMatch)
          ? `<p><b>@UUID[${featureMatch.uuid}]{Level ${levelName}}</b></p>`
          : `<p><b>Level ${levelName}</b></p>`;
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

    // tashas
    "Primal Knowledge",
    "Martial Versatility",
  ];

  async _generateFeatureAdvancements() {
    logger.debug(`Parsing ${this.ddbClass.definition.name} features for advancement`);

    const advancements = [];
    this.classFeatures
      .filter((feature) => !DDBClass.EXCLUDED_FEATURE_ADVANCEMENTS.includes(feature.name))
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
                items: [{ uuid: featureMatch.uuid }],
              },
              value: {},
              level: feature.requiredLevel,
              title: "Features",
              icon: "",
              classRestriction: "",
            };
            advancement.updateSource(update);
            advancements.push(advancement.toObject());
          } else {
            advancements[levelAdvancement].configuration.items.push({ uuid: featureMatch.uuid });
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
        const specialLookup = this.SPECIAL_ADVANCEMENTS[advancement.title];
        if (specialLookup) {
          if (specialLookup.additionalAdvancements) {
            specialLookup.additionalFunctions.forEach((fn) => {
              specialFeatures.push(fn(advancement));
            });
          }
          if (specialLookup.fixFunction) advancement = specialLookup.fixFunction(advancement, specialLookup.functionArgs);
        }
        return advancement;
      });

    this.data.system.advancement = this.data.system.advancement.concat(advancements, specialFeatures);
  }

  _generateScaleValueSpellAdvancements() {
    if (!this.ddbClassDefinition.spellRules) return;

    // max prepared
    if (this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes) {
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
      this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes.forEach((value, i) => {
        if (i !== 0) {
          advancement.configuration.scale[i] = {
            value,
          };
        }
      });
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
      this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes.forEach((value, i) => {
        if (i !== 0) {
          advancement.configuration.scale[i] = {
            value,
          };
        }
      });
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
      this.ddbClassDefinition.spellRules.levelSpellKnownMaxes.forEach((value, i) => {
        if (i !== 0) {
          advancement.configuration.scale[i] = {
            value,
          };
        }
      });
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
    const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);


    return AdvancementHelper.getSaveAdvancement(mods, availableToMulticlass, level);

  }

  _generateSaveAdvancements() {
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
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: i,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType),
    );
    const filterModOptions = { subType: `choose-a-${this.ddbClassDefinition.name.toLowerCase()}-skill` };
    const skillChooseMods = DDBHelper.filterModifiers(mods, "proficiency", filterModOptions);
    const skillMods = skillChooseMods.concat(skillExplicitMods);

    return this.advancementHelper.getSkillAdvancement(skillMods, feature, availableToMulticlass, i, this.dictionary.multiclassSkill);
  }

  _generateSkillAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if ((!availableToMulticlass && i > 1)) return;
        if (this._isSubClass && !availableToMulticlass) return;
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getArmorAdvancement(mods, feature, availableToMulticlass, level);
  }

  _generateArmorAdvancements() {
    const advancements = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if ((!availableToMulticlass && i > 1)) return;
        if (this._isSubClass && !availableToMulticlass) return;
        const armorFeatures = this._armorFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of armorFeatures) {
          const advancement = this._generateArmorAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject());
        }
      });
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenTypeModifiers(this.ddbData, modFilters);
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
    const mods = this.options.noMods ? [] : DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

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
        k.name === this.ddbClassDefinition.name
        && k.type === "class",
      );
      if (!klassMatch) continue;
      const foundryKlass = await pack.getDocument(klassMatch._id);
      const scaleAdvancements = foundryKlass.system.advancement.filter((foundryA) =>
        foundryA.type === "ScaleValue"
        && !this.data.system.advancement.some((ddbA) => ddbA.configuration.identifier === foundryA.configuration.identifier),
      ).map((advancement) => {
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
      const mods = DDBHelper.getChosenClassModifiers(this.ddbData, modFilters);

      const assignments = {};
      DICTIONARY.character.abilities.forEach((ability) => {
        const count = DDBHelper.filterModifiers(mods, "bonus", { subType: `${ability.long}-score` }).length;
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
        k.name === this.ddbClassDefinition.name
        && k.type === "class",
      );
      if (!klassMatch) continue;
      const foundryKlass = await pack.getDocument(klassMatch._id);
      const startingEquipment = foundry.utils.duplicate(foundryKlass.system.startingEquipment);
      this.data.system.startingEquipment = startingEquipment;
      return;
    }
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

  _fixes() {
    if (this.data.name === "Druid") {
      for (let advancement of this.data.system.advancement) {
        if (advancement.title !== "Wild Shape CR") continue;
        advancement.configuration.type = "cr";
        advancement.configuration.scale = {
          2: {
            value: 0.25,
          },
          4: {
            value: 0.5,
          },
          8: {
            value: 1,
          },
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
              2: {
                value: 2,
              },
              20: {
                value: 99,
              },
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
              2: {
                value: 2,
              },
              6: {
                value: 3,
              },
              17: {
                value: 4,
              },
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
              7: {
                number: 1,
                faces: 8,
              },
              18: {
                number: 2,
                faces: 8,
              },
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
              2: {
                value: 4,
              },
              4: {
                value: 6,
              },
              8: {
                value: 8,
              },
            },
          },
          value: {},
          title: "Known Forms",
          icon: null,
        };
        this.data.system.advancement.push(knownForms);
      }
    } else if (this.data.name === "Monk") {
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
      utils.arrayRange(18, 1, 2).forEach((i) => {
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
            5: {
              value: 1,
            },
            11: {
              value: 2,
            },
          },
        },
        value: {},
        title: "Cunning Strike Uses",
        icon: null,
      };
      this.data.system.advancement.push(cunningStrike);
    } else if (this.data.name === "Barbarian" && !this.is2014) {
      const damage = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "rage-damage",
          type: "number",
          scale: {
            1: {
              value: 2,
            },
            9: {
              value: 3,
            },
            16: {
              value: 4,
            },
          },
        },
        value: {},
        title: "Rage Damage",
        icon: null,
      };
      this.data.system.advancement.push(damage);
    }
  }

  _generatePrimaryAbility() {
    this.data.system.primaryAbility = {
      value: this.ddbClassDefinition.primaryAbilities.map((a) => DICTIONARY.character.abilities.id === a)?.value,
      all: false, // if multiclassing selected does muticlass require all to be 13, or just 1?
    }; // KNOWN_ISSUE_4_0: can i use preq data in ddb for this?
  };

  // GENERATE CLASS

  async generateFromCharacter(character) {
    await this._buildCompendiumIndex("features");
    this._setClassLevel();
    this._generatePrimaryAbility();
    this._fleshOutCommonDataStub();

    // these are class specific
    this._generateHPAdvancement(character);
    await this._generateCommonAdvancements();
    this._generateHitDice();
    this._generateAbilityScoreAdvancement();
    this._generateWealth();
    this._copyFoundryEquipment();

    // finally a description
    await this._generateDescriptionStub(character);

    this._fixes();

    // FUTURE: choice options such as fighting styles, this requires improved feature parsing
    await this._addFoundryAdvancements();
  }

}
