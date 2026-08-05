import {
  logger,
  utils,
  CompendiumHelper,
  DDBCompendiumFolders,
  DDBItemImporter,
  DDBSources,
} from "../../lib/_module";
import { getSpellCastingAbility } from "../spells/ability";
import AdvancementHelper from "../advancements/AdvancementHelper";
import { SETTINGS, DICTIONARY } from "../../config/_module";
import { DDBDataUtils, DDBModifiers, DDBTemplateStrings } from "../lib/_module";
import DDBFeatureMixin from "../features/DDBFeatureMixin";


type TBaseClassCompendiumTypes = "class" | "subclasses" | "features" | "feats";

interface IIndexFilter {
  fields: string[];
}

type TAdvancementMatchEntry = Record<TBaseClassCompendiumTypes, Record<string, Record<string, string>>>;


export default abstract class DDBBaseClass {

  // assigned by the subclass _generateDataStub() implementation, invoked from the constructor
  data!: T5eClassTypes;
  addToCompendium: boolean | null = null;
  compendiumImportTypes = ["classes", "subclasses"];
  updateCompendiumItems: boolean | null = null;
  collectOnly = false;
  pendingClassDocument: IDBClassPendingClassDocument | null = null;
  rules = "2014";
  name: string;
  className: string;
  isMuncher = false;
  isSubClass = false;
  choiceMap = new Map();
  featureAdvancementUuids = new Set();
  spellLinks: IDDBSpellLink[] = [];
  configChoices: Record<string, TI5eAdvItemChoiceConfigChoices> = {};
  featureAdvancements: I5eAdvancement[] = [];

  _indexFilter: Record<TBaseClassCompendiumTypes, IIndexFilter> = {
    features: {
      fields: [
        "name",
        "flags.ddbimporter.classId",
        "flags.ddbimporter.class",
        "flags.ddbimporter.subClass",
        "flags.ddbimporter.subClassId",
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
        "flags.ddbimporter.id",
        // "flags.ddbimporter",
        "flags.ddbimporter.is2014",
        "flags.ddbimporter.is2024",
        "flags.ddbimporter.featureMeta",
        "flags.ddbimporter.subType",
        "system.type.subtype",
      ],
    },
    class: {
      fields: ["name"],
    },
    subclasses: {
      fields: ["name"],
    },
  };

  _advancementMatches: TAdvancementMatchEntry = {
    features: {},
    feats: {},
    class: {},
    subclasses: {},
  };

  _compendiums = {
    features: CompendiumHelper.getCompendiumType("classfeatures", false),
    feats: CompendiumHelper.getCompendiumType("feats", false),
    class: CompendiumHelper.getCompendiumType("class", false),
    subclasses: CompendiumHelper.getCompendiumType("subclasses", false),
  };

  static SPECIAL_ADVANCEMENTS: TDDBClassSpecialAdvancements = {};

  static NO_ADVANCEMENT_2014 = [
    "rage",
  ];

  static NO_ADVANCEMENT_2024: string[] = [];

  static NOT_ADVANCEMENT_FOR_FEATURE = [
    "Bardic Inspiration",
  ];

  static FORCE_ADVANCEMENT_REPLACE = [
    "Metamagic Options",
  ];

  static PROFICIENCY_FEATURES = [
    "Core Barbarian Traits",
    "Core Bard Traits",
    "Core Cleric Traits",
    "Core Druid Traits",
    "Core Fighter Traits",
    "Core Artificer Traits",
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
    "Implement of Peace",
    "Implements of Mercy",
    "Bonus Proficiencies",
    "Otherworldly Glamour",
    "Survivalist",
    "Training in War and Song",
    "Blessings of Knowledge",
    "Elegant Courtier", // this is a you get a thing or otherwise choose from two others
    "Blessings of Knowledge",
    "Knightly Envoy",
    "Unfettered Mind",
    "Training In War and Song",
  ];

  static EXPERTISE_FEATURES = [
    "Expertise",
    "Canny",
    "Deft Explorer",
    "Survivalist",
    "Blessings of Knowledge",
    "Scholar",
    "Muscle Mass",
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
    "Favored Enemy",
    "Deft Explorer",
    "Canny",
    "Draconic Gift",
    "Speech of the Woods",
    "Knightly Envoy",
    "Unfettered Mind",
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
    "Core Artificer Traits",
    "Core Monk Traits",
    "Core Paladin Traits",
    "Core Ranger Traits",
    "Core Rogue Traits",
    "Core Sorcerer Traits",
    "Core Warlock Traits",
    "Core Wizard Traits",
    "Proficiencies",
    "Tool Proficiency",
    "Tools Proficiency",
    "Tools of the Trade",
    "Student of War",
    "Gunsmith",
    "Implements of Mercy",
    "Master of Intrigue",
    "Blessings of Knowledge",
    "Reanimator's Skillset",
    "Channeler",
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
    "Core Artificer Traits",
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
    "Training In War and Song",
    "Core Artificer Traits",
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

  ddbData: IDDBData;
  ddbClass: IDDBClass;
  ddbClassDefinition: IDDBClassDefinition;
  ddbParentClassDefinition: IDDBClassDefinition;
  // is2014/is2024/legacy are assigned in _processSources(), called from the constructor
  is2014!: boolean;
  is2024!: boolean;
  legacy!: boolean;
  // assigned in _generateSource() before its only read
  parentIs2014!: boolean;
  classFeatureIds: number[];
  // fields marked with ! below are populated by _fleshOutCommonDataStub(), which the
  // generateFromCharacter() flows always call before any advancement generation reads them
  classFeatures!: IDDBClassDefinitionFeature[];
  _proficiencyFeatureIds!: number[];
  _expertiseFeatureIds!: number[];
  _languageFeatureIds!: number[];
  _toolFeatureIds!: number[];
  _armorFeatureIds!: number[];
  _weaponFeatureIds!: number[];
  _weaponMasteryFeatureIds!: number[];
  _languageOrSkillFeatureIds!: number[];
  _conditionFeatureIds!: number[];
  _proficiencyFeatures!: IDDBClassDefinitionFeature[];
  _expertiseFeatures!: IDDBClassDefinitionFeature[];
  _languageFeatures!: IDDBClassDefinitionFeature[];
  _toolFeatures!: IDDBClassDefinitionFeature[];
  _armorFeatures!: IDDBClassDefinitionFeature[];
  _weaponFeatures!: IDDBClassDefinitionFeature[];
  _weaponMasteryFeatures!: IDDBClassDefinitionFeature[];
  _languageOrSkillFeatures!: IDDBClassDefinitionFeature[];
  _conditionFeatures!: IDDBClassDefinitionFeature[];
  subClassFeatureIds: number[];
  advancementHelper: AdvancementHelper;
  isStartingClass: boolean;
  _excludedFeatureIds!: number[];
  NOT_ADVANCEMENT_FOR_FEATURE: string[];
  NO_ADVANCEMENT_2014: string[];
  NO_ADVANCEMENT_2024: string[];
  SPECIAL_ADVANCEMENTS: TDDBClassSpecialAdvancements;
  // only DDBSubClass assigns and reads these; empty lists are the correct default elsewhere
  FORCE_SPELL_LIST_ADVANCEMENTS: string[] = [];
  NOT_SPELL_LIST_ADVANCEMENTS: string[] = [];
  dictionary: IDDBClassSkillDictionary;

  _generateSource() {
    const classSource = DDBSources.parseSource(this.ddbClassDefinition);
    this.data.system.source = classSource;
    this.parentIs2014 = (this.ddbParentClassDefinition.sources ?? []).every((s) => DDBSources.is2014Source(s));
    this.data.system.source.rules = this.parentIs2014 ? "2014" : "2024";
  }

  _fleshOutCommonDataStub() {
    // this.data.system.identifier = utils.referenceNameString(`${this.name.toLowerCase()}${this.is2014 ? " - legacy" : ""}`);
    this.data.system.identifier = DDBDataUtils.classIdentifierName(this.name);
    this._determineClassFeatures();

    this._proficiencyFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.PROFICIENCY_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._proficiencyFeatures = this.classFeatures
      .filter((feature) => this._proficiencyFeatureIds.includes(feature.id));

    this._expertiseFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.EXPERTISE_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._expertiseFeatures = this.classFeatures
      .filter((feature) => this._expertiseFeatureIds.includes(feature.id));

    this._languageFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.LANGUAGE_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._languageFeatures = this.classFeatures
      .filter((feature) => this._languageFeatureIds.includes(feature.id));

    this._toolFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.TOOL_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._toolFeatures = this.classFeatures
      .filter((feature) => this._toolFeatureIds.includes(feature.id));

    this._armorFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.ARMOR_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._armorFeatures = this.classFeatures
      .filter((feature) => DDBBaseClass.ARMOR_FEATURES.includes(utils.nameString(feature.name)));

    this._weaponFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.WEAPON_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._weaponFeatures = this.classFeatures
      .filter((feature) => DDBBaseClass.WEAPON_FEATURES.includes(utils.nameString(feature.name)));

    this._weaponMasteryFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.WEAPON_MASTERY_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._weaponMasteryFeatures = this.classFeatures
      .filter((feature) => DDBBaseClass.WEAPON_MASTERY_FEATURES.includes(utils.nameString(feature.name)));

    this._languageOrSkillFeatureIds = this.classFeatures.concat(this._languageFeatures)
      .filter((feature) => DDBBaseClass.LANGUAGE_OR_SKILL_FEATURE.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._languageOrSkillFeatures = this.classFeatures
      .filter((feature) => DDBBaseClass.LANGUAGE_OR_SKILL_FEATURE.includes(utils.nameString(feature.name)));

    this._conditionFeatureIds = this.classFeatures
      .filter((feature) => DDBBaseClass.CONDITION_FEATURES.includes(utils.nameString(feature.name)))
      .map((feature) => feature.id);
    this._conditionFeatures = this.classFeatures
      .filter((feature) => DDBBaseClass.CONDITION_FEATURES.includes(utils.nameString(feature.name)));

    this._generateSource();
  }

  abstract _generateDataStub(): void;

  _generateSpellCastingProgression() {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name === this.className);
    if (this.isSubClass && ["full", "pact", "half"].includes(spellProgression?.value ?? "")) {
      return;
    }
    if (this.ddbClassDefinition.canCastSpells) {
      const spellCastingAbility = getSpellCastingAbility(this.ddbClass, this.isSubClass, this.isSubClass);
      if (spellProgression) {
        this.data.system.spellcasting = {
          progression: spellProgression.value,
          ability: spellCastingAbility as T5eAbility,
        };
        let formula = "";
        const classIdentifier = DDBDataUtils.classIdentifierName(this.className);
        if ((this.ddbClassDefinition.spellRules?.levelPreparedSpellMaxes ?? []).filter((a) => a).length > 1) {
          formula = `@scale.${this.data.system.identifier}.max-prepared`;
        } else if (this.ddbClassDefinition.spellPrepareType === 1) {
          formula = `max(@abilities.${spellCastingAbility}.mod + @classes.${classIdentifier}.levels, 1)`;
        }
        this.data.system.spellcasting.preparation = {
          formula,
        };
      }
      const spellSlotDivisor = this.ddbClassDefinition.spellRules?.multiClassSpellSlotDivisor
        ? this.ddbClassDefinition.spellRules.multiClassSpellSlotDivisor
        : undefined;
      const ddbFlags = (this.data.flags.ddbimporter ??= {});
      ddbFlags.spellSlotDivisor = spellSlotDivisor;
      ddbFlags.spellCastingAbility = spellCastingAbility;
    }
  }

  /** The advancement record on the generated item data, initialised if the template did not provide one. */
  protected get _advancementData(): Record<string, I5eAdvancement> {
    this.data.system.advancement ??= {};
    return this.data.system.advancement;
  }

  _addAdvancement(advancement: I5eAdvancement) {
    if (!advancement._id) advancement._id = foundry.utils.randomID();
    this._advancementData[advancement._id] = advancement;
  }

  _addAdvancements(advancements: I5eAdvancement[]) {
    advancements.forEach((advancement) => {
      this._addAdvancement(advancement);
    });
  }

  async _buildCompendiumIndex(type: TBaseClassCompendiumTypes, indexFilter: IIndexFilter = { fields: ["name"] }) {
    if (Object.keys(indexFilter).length > 0) this._indexFilter[type] = indexFilter;
    if (!this._compendiums[type]) return;
    await this._compendiums[type].getIndex(this._indexFilter[type]);
  }

  async _generateDescriptionStub(character: I5ePCData) {
    const description = (this.data.system.description ??= { value: "", chat: "" });
    description.value = "<h1>Description</h1>";
    description.value += this.ddbClass.definition.description;
    // this excludes the subclass features
    description.value += await this._buildClassFeaturesDescription();
    // not all classes have equipment descriptions
    if (this.ddbClass.definition.equipmentDescription && !this.isSubClass && this.is2014) {
      description.value += `<h1>Starting Equipment</h1>\n${this.ddbClass.definition.equipmentDescription}\n\n`;
    }

    if (character) {
      // parse only returns undefined for empty text, and the description always has content here
      const parsed = DDBTemplateStrings.parse(
        this.ddbData,
        character,
        description.value,
        this.ddbClass,
      );
      if (parsed) description.value = parsed.text;
    }
  }

  _processSources() {
    const sources = this.ddbClassDefinition.sources ?? [];
    const sourceIds = sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;
  }

  constructor(ddbData: IDDBData, classId: number,
    { addToCompendium = null, compendiumImportTypes = null,
      updateCompendiumItems = null, isMuncher, collectOnly = false }: { addToCompendium?: boolean | null; compendiumImportTypes?: string[] | null; updateCompendiumItems?: boolean | null; isMuncher?: boolean; collectOnly?: boolean } = {},
  ) {
    this.addToCompendium = addToCompendium ?? false;
    if (compendiumImportTypes) this.compendiumImportTypes = compendiumImportTypes;
    this.updateCompendiumItems = updateCompendiumItems ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");
    this.collectOnly = collectOnly;

    // setup ddb source
    this.isMuncher = isMuncher ?? this.isMuncher;
    this.ddbData = ddbData;
    const ddbClass = ddbData.character.classes.find((c) => c.definition.id === classId);
    if (!ddbClass) {
      throw new Error(`DDBBaseClass: Unable to find class with definition id ${classId} in the character data`);
    }
    this.ddbClass = ddbClass;
    this.ddbParentClassDefinition = this.ddbClass.definition;
    this.ddbClassDefinition = this.ddbClass.definition;
    this.name = this.ddbClassDefinition.name;
    this.className = this.ddbClass.definition.name;
    this._processSources();

    // quick helpers
    this.classFeatureIds = this.ddbClass.definition.classFeatures.map((f) => f.id);
    const subclassDefinition = this.ddbClass.subclassDefinition;
    this.subClassFeatureIds = subclassDefinition && subclassDefinition.name
      ? this.ddbClass.classFeatures
        .filter((f) => f.definition.classId === subclassDefinition.id)
        .map((f) => f.definition.id)
      : [];

    this._generateDataStub();

    this.dictionary = DICTIONARY.actor.class[this.is2014 ? "2014" : "2024"].find((c) => c.name === this.ddbClassDefinition.name) ?? {
      name: "Generic",
      multiclassSkill: 0,
      multiclassTool: 0,
    };

    this.advancementHelper = new AdvancementHelper({
      ddbData,
      type: "class",
      isMuncher: this.isMuncher,
      dictionary: this.dictionary,
    });

    this.SPECIAL_ADVANCEMENTS = DDBBaseClass.SPECIAL_ADVANCEMENTS;
    this.NOT_ADVANCEMENT_FOR_FEATURE = DDBBaseClass.NOT_ADVANCEMENT_FOR_FEATURE;
    this.NO_ADVANCEMENT_2014 = DDBBaseClass.NO_ADVANCEMENT_2014;
    this.NO_ADVANCEMENT_2024 = DDBBaseClass.NO_ADVANCEMENT_2024;

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
  getClassFeatures(excludedIds: number[] = []): IDDBClassDefinitionFeature[] | any[] { // TODO classOptions on ddbData
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
   * @param {IDDBClassDefinitionFeature} feature The feature to find a match for.
   * @returns {TIndexEntry | null | undefined} - The matched feature, or undefined if no match is found.
   */
  getFeatureCompendiumMatch(feature: IDDBClassDefinitionFeature): TIndexEntry | null | undefined {
    const featuresCompendium = this._compendiums.features;
    if (!featuresCompendium) {
      return null;
    }

    const featureName = utils.nameString(feature.name);
    const findFeatures = (excludeFlags = {}, looseMatch = true) => {
      const results = featuresCompendium.index.filter((match) => {
        const matchFlags = foundry.utils.getProperty(match, "flags.ddbimporter.featureMeta") as IDDBImporterFlags
          ?? foundry.utils.getProperty(match, "flags.ddbimporter") as IDDBImporterFlags;
        if (!matchFlags) return false;
        const matchName: string = (foundry.utils.getProperty(matchFlags, "originalName") as string)?.trim()
          ?? ((foundry.utils.getProperty(match, "name") as string) ?? "").trim();
        const nameMatch = featureName.toLowerCase() === matchName.toLowerCase();
        const isIdMatch = feature.id === matchFlags.id;
        if (!nameMatch && looseMatch) {
          const containsMatch = featureName.toLowerCase().includes(matchName.toLowerCase());
          if (!containsMatch || !isIdMatch) return false;
        } else if (nameMatch && !looseMatch && !isIdMatch) {
          return false;
        }
        for (const [key, value] of Object.entries(excludeFlags)) {
          if (foundry.utils.getProperty(matchFlags, key) === value) return false;
        }

        const featureClassMatch = !this.isSubClass
          && matchFlags.classId == this.ddbClassDefinition.id;
        const featureSubclassMatch = this.isSubClass
          && matchFlags.subClassId == this.ddbClassDefinition.id;
        return featureClassMatch || featureSubclassMatch;
      });
      return results;
    };

    const exactMach = findFeatures.call(this, {}, false);
    const firstPass = findFeatures.call(this);

    if (firstPass.length === 1) {
      return firstPass[0];
    } else if (firstPass.length > 1) {
      const secondPass = findFeatures.call(this, {
        "isChoice": true,
      });

      if (secondPass.length === 1) {
        return secondPass[0];
      } else if (secondPass.length > 1 && exactMach.length === 1) {
        return exactMach[0];
      } else if (secondPass.length > 1) {
        logger.error(`Multiple compendium feature matches found for feature ${feature.name}, even after filtering choices.`, {
          firstPass,
          secondPass,
          feature,
          this: this,
        });
      } else {
        logger.warn(`No compendium feature matches found for feature ${feature.name}, using first match.`, {
          firstPass,
          secondPass,
          feature,
          this: this,
        });
      }


    }
    return null;
  }

  getCompendiumIxByFlags(compendiums: TBaseClassCompendiumTypes[], flags: Record<string, string | number | boolean>): TIndexEntry | null {
    for (const compendium of compendiums) {
      if (!this._compendiums[compendium]) {
        continue;
      }
      logger.verbose(`Searching for feature with flags in ${compendium}:`, flags);

      const match = this._compendiums[compendium].index.find((i: TIndexEntry) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, `flags.ddbimporter.${key}`) === value;
        });
      });
      if (match) return match;
    }
    return null;
  }

  getFeatCompendiumMatch(featName: string): TIndexEntry | null | undefined {
    // return null rather than [] - an empty array is truthy, and callers
    // treat a truthy return as a real compendium match
    if (!this._compendiums.feats) {
      return null;
    }
    const smallName = featName.trim().toLowerCase();
    return this._compendiums.feats.index.find((match) =>
      ((foundry.utils.hasProperty(match, "flags.ddbimporter.originalName")
        && smallName == (foundry.utils.getProperty(match, "flags.ddbimporter.originalName") as string).trim().toLowerCase())
        || (!foundry.utils.hasProperty(match, "flags.ddbimporter.originalName")
          && (smallName == (match.name as string).trim().toLowerCase()
          || smallName.split(":")[0].trim() == (match.name as string).trim().toLowerCase()))
      ),
    );
  }

  async _buildClassFeaturesDescription() {
    logger.debug(`Parsing ${this.name} features`);
    let description = "<h1>Class Features</h1>\n\n";
    const classFeatures: string[] = [];

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

  // ADVANCEMENT FUNCTIONS


  async _generateFeatureAdvancementFromCompendiumMatch(feature: IDDBClassDefinitionFeature) {
    logger.debug(`Trying to generate advancement for feature: ${feature.name}`);
    const featureMatch = this.getFeatureCompendiumMatch(feature);
    if (!featureMatch) {
      if (this.isMuncher && this.addToCompendium) {
        logger.warn(`Could not find feature advancement match for feature ${feature.name}`);
      } else {
        logger.debug(`No feature advancement match found for feature ${feature.name}, skipping.`);
      }
      return;
    }
    if (this.featureAdvancementUuids.has(featureMatch.uuid)) return;
    this.featureAdvancementUuids.add(featureMatch.uuid);
    const levelAdvancement = this.featureAdvancements.findIndex((advancement) => advancement.level === feature.requiredLevel);

    if (levelAdvancement == -1) {
      const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemGrantAdvancement);
      // dnd5e BaseAdvancement initialises _id via randomID, the field type just allows null
      const advancementId = advancement._id;
      if (advancementId && featureMatch.name) {
        this._advancementMatches.features[advancementId] = {};
        this._advancementMatches.features[advancementId][featureMatch.name] = featureMatch.uuid;
      }

      const update = {
        configuration: {
          items: [{ uuid: featureMatch.uuid }],
        },
        value: {},
        level: feature.requiredLevel ?? 0,
        title: "Features",
        icon: "",
        classRestriction: "",
      } as I5eAdvancement;
      advancement.updateSource(update as any);
      this.featureAdvancements.push(advancement.toObject() as I5eAdvancement);
    } else {
      const existingAdvancement = this.featureAdvancements[levelAdvancement];
      const existingConfig = existingAdvancement.configuration as I5eAdvItemGrantConfig;
      (existingConfig.items ??= []).push({ uuid: featureMatch.uuid, optional: false });
      if (existingAdvancement._id && featureMatch.name) {
        this._advancementMatches.features[existingAdvancement._id][featureMatch.name] = featureMatch.uuid;
      }
    }

  }


  async _generateFeatureAdvancement(feature: IDDBClassDefinitionFeature, choices: IDDBChoiceEntry[]) {
    logger.debug(`Generating choice feature advancement for feature ${feature.name} with ${choices.length} choices`);
    // console.warn({
    //   this: this,
    //   feature: feature,
    //   choices: choices,
    //   choiceMap: this.choiceMap,
    // })
    // logger.verbose(`Generating feature advancement for feature ${feature.name} with choices:`, choices);
    const keys = new Set();
    const version = this.is2014 ? "2014" : "2024";
    const uuids = new Set();
    const configChoices: Record<string, I5eAdvItemChoiceLevelConfig> = {};
    let lowestLevel = 0;

    for (const choice of choices) {
      // build a list of options for each choice
      const choiceRegex = /level (\d+) /i;
      const choiceLevel = (choice.label ?? "").match(choiceRegex);
      const level = choiceLevel && choiceLevel.length > 1
        ? parseInt(choiceLevel[1])
        : (feature.requiredLevel ?? 0);
      const currentCount = parseInt(String(configChoices[level]?.count ?? 0));

      if (lowestLevel === 0) lowestLevel = level;
      if (level < lowestLevel) lowestLevel = level;

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
      // console.warn({
      //   this: this,
      //   feature: feature,
      //   choices: choices,
      //   choiceMap: this.choiceMap,
      // })
      return;
    }
    if (Object.keys(configChoices).length === 0) {
      logger.warn(`No valid choices found for advancement of feature ${feature.name}, you can ignore this message unless you think this feature should offer an advancement choice.`);
      return;
    }

    const forceReplace = DDBBaseClass.FORCE_ADVANCEMENT_REPLACE.includes(feature.name);
    this.configChoices[feature.name] = AdvancementHelper.getChoiceReplacements(feature.description ?? feature.snippet ?? "", lowestLevel, configChoices, forceReplace);
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);

    const source: I5eAdvancement = {
      title: utils.nameString(feature.name),
      hint: feature.snippet ?? feature.description ?? "",
      configuration: {
        restriction: {
          type: "class",
          subtype: DDBFeatureMixin.getFeatureSubtype(feature.name, "class", true) ?? undefined,
        },
        choices: configChoices,
        type: "feat",
        pool: Array.from(uuids as Set<string>).map((f) => {
          return { uuid: f };
        }),
        allowDrops: true,
      },
      icon: "icons/magic/symbols/cog-orange-red.webp",
    };
    advancement.updateSource(source as any);

    // console.warn(`Generated choice advancement for feature ${feature.name}:`, {
    //   advancement,
    //   this: this,
    //   feature,
    //   choices,
    //   uuids,
    // });


    // TODO: handle chosen advancements on non muncher classes
    this._addAdvancement(advancement.toObject() as I5eAdvancement);

  }

  async _generateFeatureAdvancements() {
    logger.debug(`Parsing ${this.name} features for advancement`);
    this.featureAdvancements = [];

    const version = this.is2014 ? "2014" : "2024";

    const classFeatures = this.classFeatures.filter((feature) =>
      !DDBBaseClass.EXCLUDED_FEATURE_ADVANCEMENTS.includes(feature.name)
      || (this.is2014 && DDBBaseClass.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(feature.name)));
    for (const feature of classFeatures) {
      await this._generateFeatureAdvancementFromCompendiumMatch(feature);
    }
    this._addAdvancements(this.featureAdvancements);

    // console.warn({
    //   this: this,
    //   featureAdvancements: foundry.utils.deepClone(this.featureAdvancements),
    // });

    // for choice features such as fighting styles:
    // for each feature with typ3 choices, build an item choice advancement
    // then search for matching features from the choicedefintiions.
    for (const feature of classFeatures) {
      // console.warn(feature);
      const choices = (this.ddbData.character.choices.class ?? [])
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
    const specialFeatures: I5eAdvancement[] = [];
    const advancements: I5eAdvancement[] = this.classFeatures
      .filter((feature) => (feature.levelScales?.length ?? 0) > 0)
      .filter((feature) => !this.NOT_ADVANCEMENT_FOR_FEATURE.includes(feature.name))
      .map((feature) => {
        const generated = AdvancementHelper.generateScaleValueAdvancement(feature);
        if (!generated) {
          logger.warn(`Unable to generate scale value advancement for feature ${feature.name}`, { feature });
          return null;
        }
        logger.debug(`Generated scale value advancement for feature ${feature.name}`, { generated });
        if (!generated.title) return generated;
        let advancement: I5eAdvancement = generated;
        const specialLookup = this.SPECIAL_ADVANCEMENTS[generated.title];
        if (specialLookup) {
          logger.debug(`Found special advancement for ${generated.title}`, { specialLookup, generated });
          if (specialLookup.additionalAdvancements) {
            (specialLookup.additionalFunctions ?? []).forEach((fn) => {
              specialFeatures.push(fn(generated));
            });
          }
          if (specialLookup.fixFunction) {
            advancement = specialLookup.fixFunction(advancement, specialLookup.functionArgs);
          }
          if (specialLookup.fixFunctions) {
            specialLookup.fixFunctions.forEach((fn) => {
              advancement = fn.fn(advancement, fn.args);
            });
          }
        }
        return advancement;
      })
      .filter((a): a is I5eAdvancement => a !== null)
      .filter((a) =>
        (this.is2014 && !this.NO_ADVANCEMENT_2014.includes((a.configuration as I5eAdvConfig)?.identifier ?? ""))
        || (!this.is2014 && !this.NO_ADVANCEMENT_2024.includes((a.configuration as I5eAdvConfig)?.identifier ?? "")),
      );

    this._addAdvancements(advancements);
    this._addAdvancements(specialFeatures);
  }

  _generateScaleValueSpellAdvancements() {
    if (!this.ddbClassDefinition.spellRules) return;

    // max prepared
    if (this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes
      && this.ddbClassDefinition.spellRules.levelPreparedSpellMaxes.filter((a) => a).length > 1
    ) {
      const scale: Record<string, I5eAdvScaleValueEntry> = {};
      const advancement: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "max-prepared",
          type: "number",
          scale,
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
        scale[i] = {
          value,
        };
      }
      this._addAdvancement(advancement);
    }

    // cantrips-known
    if (this.ddbClassDefinition.spellRules.levelCantripsKnownMaxes) {
      const scale: Record<string, I5eAdvScaleValueEntry> = {};
      const advancement: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "cantrips-known",
          type: "number",
          scale,
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
        scale[i] = {
          value,
        };
      }
      this._addAdvancement(advancement);
    }

    // spells-known
    if (this.ddbClassDefinition.spellRules.levelSpellKnownMaxes) {
      const scale: Record<string, I5eAdvScaleValueEntry> = {};
      const advancement: I5eAdvancement = {
        _id: foundry.utils.randomID(),
        type: "ScaleValue",
        configuration: {
          distance: { units: "" },
          identifier: "spells-known",
          type: "number",
          scale,
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
        scale[i] = {
          value,
        };
      }
      this._addAdvancement(advancement);
    }
  }

  _generateHTMLSaveAdvancement() {
    const advancements: I5eAdvancement[] = [];
    // FUTURE ENHANCEMENT FOR BULK: Add what to do if no mods supplied
    this._addAdvancements(advancements);
  }

  _generateSaveAdvancement(feature: IDDBClassDefinitionFeature, availableToMulticlass: boolean, level: number) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      availableToMulticlass,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getSaveAdvancement({ feature, mods, availableToMulticlass, level });
  }

  _generateSaveAdvancements() {
    const advancements: I5eAdvancement[] = [];
    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if (!availableToMulticlass && i > 1) return;
        const proficiencyFeatures = this._proficiencyFeatures.filter((f) => f.requiredLevel === i);

        for (const proficiencyFeature of proficiencyFeatures) {
          const advancement = this._generateSaveAdvancement(proficiencyFeature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
        }
      });
    }

    this._addAdvancements(advancements);
  }

  _generateSkillAdvancement(feature: IDDBClassDefinitionFeature, availableToMulticlass: boolean, i: number) {
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

    return this.advancementHelper.getSkillAdvancement({
      mods: skillMods,
      feature,
      availableToMulticlass,
      level: i,
    });
  }

  _generateSkillAdvancements() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      [true, false].forEach((availableToMulticlass) => {
        if ((!availableToMulticlass && i > 1)) return;
        if (this.isSubClass && !availableToMulticlass) return;
        const skillFeatures = this._proficiencyFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of skillFeatures) {
          const baseProficiency = AdvancementHelper.isBaseProficiency(feature);
          if (availableToMulticlass
            && baseProficiency
            && this.dictionary.multiclassSkill === 0

          ) continue;
          const advancement = this._generateSkillAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
        }
      });
    }

    this._addAdvancements(advancements);
  }

  _generateLanguageAdvancement(feature: IDDBClassDefinitionFeature, level: number) {
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
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      const languageFeatures = this._languageFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of languageFeatures) {
        const advancement = this._generateLanguageAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
      }
    }

    this._addAdvancements(advancements);
  }

  _generateSkillOrLanguageAdvancements() {
    const advancements: I5eAdvancement[] = [];

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
        const advancement = skillAdvancement && languageAdvancement && skillAdvancement.configuration.choices.length > 0
          ? skillAdvancement.toObject() as I5eAdvancement
          : null;
        const advPool = (advancement?.configuration as I5eAdvTraitConfig | undefined)?.choices?.[0]?.pool;
        const languagePool = advancement && languageAdvancement
          ? ((languageAdvancement.toObject().configuration as I5eAdvTraitConfig).choices?.[0]?.pool)
          : undefined;
        if (advancement && advPool && languagePool) {
          advPool.push(...languagePool);
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

    this._addAdvancements(advancements);
  }

  _generateToolAdvancement(feature: IDDBClassDefinitionFeature, availableToMulticlass: boolean, level: number) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getToolAdvancement({
      mods: mods,
      feature,
      availableToMulticlass,
      level,
    });
  }

  _generateToolAdvancements() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      for (const availableToMulticlass of [true, false]) {
        // multiclass only profs only at level 1
        if (!availableToMulticlass && i > 1) continue;
        if (this.isSubClass && !availableToMulticlass) continue;
        const toolFeatures = this._toolFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of toolFeatures) {
          const advancement = this._generateToolAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
        }
      }
    }

    this._addAdvancements(advancements);
  }

  _generateArmorAdvancement(feature: IDDBClassDefinitionFeature, availableToMulticlass: boolean, level: number) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      exactLevel: level,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getArmorAdvancement({ mods, feature, availableToMulticlass, level });
  }

  _generateArmorAdvancements() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      for (const availableToMulticlass of [true, false]) {
        // multiclass only profs only at level 1
        if (!availableToMulticlass && i > 1) continue;
        if (this.isSubClass && !availableToMulticlass) continue;
        const armorFeatures = this._armorFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of armorFeatures) {
          const advancement = this._generateArmorAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
        }
      }
    }

    this._addAdvancements(advancements);
  }

  _generateWeaponAdvancement(feature: IDDBClassDefinitionFeature, availableToMulticlass: boolean, level: number) {
    const modFilters = {
      includeExcludedEffects: true,
      classId: this.ddbClassDefinition.id,
      availableToMulticlass: availableToMulticlass === false ? null : true,
      exactLevel: level,
      useUnfilteredModifiers: true,
      filterOnFeatureIds: [feature.id],
    };
    const mods = DDBModifiers.getChosenClassModifiers(this.ddbData, modFilters);
    return this.advancementHelper.getWeaponAdvancement(mods, feature, availableToMulticlass, level);
  }

  _generateWeaponAdvancements() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      for (const availableToMulticlass of [true, false]) {
        // multiclass only profs only at level 1
        if (!availableToMulticlass && i > 1) continue;
        if (this.isSubClass && !availableToMulticlass) continue;
        const weaponFeatures = this._weaponFeatures.filter((f) => f.requiredLevel === i);

        for (const feature of weaponFeatures) {
          const advancement = this._generateWeaponAdvancement(feature, availableToMulticlass, i);
          if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
        }
      }
    }

    this._addAdvancements(advancements);
  }

  _generateWeaponMasteryAdvancement(feature: IDDBClassDefinitionFeature, level: number) {
    const modFilters: IDDBModifiersChosenTypeModifiersOptions = {
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
    const advancements: I5eAdvancement[] = [];

    // console.warn("Weapon Mastery Advancements", {
    //   this: this,
    // });

    for (let i = 0; i <= 20; i++) {
      const weaponFeatures = this._weaponMasteryFeatures.filter((f) => f.requiredLevel === i);

      for (const feature of weaponFeatures) {
        const advancement = this._generateWeaponMasteryAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
      }
    }

    this._addAdvancements(advancements);
  }

  _generateExpertiseAdvancements() {
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      const expertiseFeature = this._expertiseFeatures.find((f) => f.requiredLevel === i);

      if (!expertiseFeature) continue;

      const advancement = this.advancementHelper.getExpertiseAdvancement(expertiseFeature, i);
      if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
    }

    this._addAdvancements(advancements);
  }

  _generateConditionAdvancement(feature: IDDBClassDefinitionFeature, level: number) {
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
    const advancements: I5eAdvancement[] = [];

    for (let i = 0; i <= 20; i++) {
      const conditionAdvancements = this._conditionFeatures.filter((f) => f.requiredLevel === i);
      for (const feature of conditionAdvancements) {
        const advancement = this._generateConditionAdvancement(feature, i);
        if (advancement) advancements.push(advancement.toObject() as I5eAdvancement);
      }
    }

    this._addAdvancements(advancements);
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
        && foundry.utils.getProperty(k, "type") === "class",
      );
      if (!klassMatch) continue;
      const foundryKlass: I5eClassItem = await pack.getDocument(klassMatch._id) as any;
      const scaleAdvancements: I5eAdvancement[] = Object.values(foundry.utils.getProperty(foundryKlass, "_source.system.advancement") as Record<string, I5eAdvancement>).filter((foundryA) => {
        if (foundryA.type !== "ScaleValue") return false;
        let identifier = foundry.utils.getProperty(foundryA, "configuration.identifier");
        if (!identifier || identifier === "") {
          identifier = DDBDataUtils.classIdentifierName(foundryA.title ?? "");
        }
        const exitingIdentifiers = Object.values(this._advancementData)
          .some((ddbA) => foundry.utils.getProperty(ddbA, "configuration.identifier") === identifier);
        if (exitingIdentifiers) return false;
        return true;
      });
      logger.debug(`Adding scale advancements from compendium class ${this.name} in pack ${pack.collection}`, {
        scaleAdvancements,
      });
      this._addAdvancements(scaleAdvancements);
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

  abstract _fixes() : Promise<void>;

  async _fightingStyleAdvancement2024() {
    const FIGHTING_STYLE_FEATURES = [
      "Fighting Style",
      "Additional Fighting Style",
    ];
    const advancementFound = Object.values(this._advancementData)
      .some((a) => FIGHTING_STYLE_FEATURES.includes(a.title ?? ""));
    const feature = this.classFeatures.find((f) => FIGHTING_STYLE_FEATURES.includes(f.name));
    if (!advancementFound && !feature) return;
    if (!advancementFound && feature) {
      const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);
      const update: I5eAdvancementItemChoice = {
        title: feature.name,
        hint: feature.snippet ?? feature.description ?? "",
        configuration: {
          choices: this.configChoices[feature.name] ?? {},
          restriction: {
            type: "class",
            subtype: "fightingStyle",
          },
          type: "feat",
          allowDrops: true,
        },
        icon: "icons/magic/symbols/cog-orange-red.webp",
      };
      advancement.updateSource(update as any);
      this._addAdvancement(advancement.toObject() as I5eAdvancement);
    }

    const featsCompendium = this._compendiums.feats;
    const featuresCompendium = this._compendiums.features;
    if (!featsCompendium || !featuresCompendium) {
      logger.warn(`Unable to find feats or features compendium for ${this.name} fighting style advancement generation`);
      return;
    }

    const advancementData = this._advancementData;
    for (const [id, advancement] of Object.entries(advancementData)) {
      if (!FIGHTING_STYLE_FEATURES.includes(advancement.title ?? "")) continue;
      const advConfig = advancement.configuration as I5eAdvItemChoiceConfig;
      const flags = {
        "flags.ddbimporter.is2014": this.is2014,
        "flags.ddbimporter.is2024": this.is2024,
        "system.type.subtype": "fightingStyle",
      };
      const feats = featsCompendium.index.filter((i) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, key) === value;
        });
      }).map((i) => i.uuid);
      const advPool = feats.map((f) => {
        return { uuid: f };
      });
      advConfig.pool = advPool;
      (advConfig.restriction ??= {}).subtype = "fightingStyle";

      let lowestLevel = 1;
      const description = feature?.description ?? feature?.snippet ?? "";
      const advancementTitle = advancement.title ?? "";

      if (feature?.name === "Fighting Style")
        this.configChoices[advancementTitle] ??= { 1: { count: 1, replacement: true } };
      else if (feature?.name === "Additional Fighting Style") {
        lowestLevel = 7;
        this.configChoices[advancementTitle] ??= { 7: { count: 1, replacement: true } };
      }
      advConfig.choices = AdvancementHelper.getChoiceReplacements(description, lowestLevel, this.configChoices[advancementTitle]);

      if (this.data.name === "Paladin") {
        const special = featuresCompendium.find((c) =>
          (c.name as string).includes("Blessed Warrior")
          && foundry.utils.getProperty(c, "flags.ddbimporter.is2024") === true,
        );
        if (special) {
          advPool.push({ uuid: special.uuid });
        }
      } else if (this.data.name === "Ranger") {
        const special = featuresCompendium.find((c) =>
          (c.name as string).includes("Druidic Warrior")
          && foundry.utils.getProperty(c, "flags.ddbimporter.is2024") === true,
        );
        if (special) {
          advPool.push({ uuid: special.uuid });
        }
      }
      advancementData[id] = advancement;
    }
  }

  async _fightingStyleAdvancement() {
    if (this.is2024) {
      await this._fightingStyleAdvancement2024();
    }

    // TODO: come back to 2014
  }

  static CLASS_HANDLER_OPTIONS: IDDBItemImporterBuildHandlerOptions = {
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
    const advancementData = data.system.advancement ?? {};
    for (const [id, advancement] of Object.entries(advancementData)) {
      delete (advancement as any).value;
      advancementData[id] = advancement;
    }
    if (data.system.levels) data.system.levels = 1;
    if (data.system.hd) data.system.hd.spent = 0;
    const versionStub = this.data.system.source?.rules ?? (this.is2014 ? "2014" : "2024");
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

    const handler = await DDBItemImporter.buildHandler(type, [prepared.data], updateFeatures, DDBBaseClass.CLASS_HANDLER_OPTIONS);
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
      const handler = await DDBItemImporter.buildHandler("class", docs, updateFeatures, DDBBaseClass.CLASS_HANDLER_OPTIONS);
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
      const handler = await DDBItemImporter.buildHandler("subclass", docs, updateFeatures, DDBBaseClass.CLASS_HANDLER_OPTIONS);
      await handler.buildIndex();
    }
  }

  abstract generateFromCharacter(character: I5ePCData): Promise<void>;

}
