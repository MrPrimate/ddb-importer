import { ACTOR } from "./actor/actor";
import { MONSTERS } from "./actor/monsters";
import { CONSUMPTION_LINKS, CONSUMPTION_SPELL_LINKS } from "./actor/consumptionLinking";
import { COMPENDIUM_FOLDERS } from "./folders/compendiums";
import { EQUIPMENT } from "./items/equipment";
import { ITEM_GENERICS } from "./items/generics";
import { WEAPONS } from "./items/weapons";
import { AMMUNITION } from "./items/ammunition";
import { ACTIONS } from "./actor/actions";
import { MAGIC_ITEMS } from "./items/magicItems";
import { SENSES } from "./actor/senses";
import { SPELL } from "./spell/spell";
import { PARSING_ACTIONS, PARSING_ATTACK_ACTIONS } from "./parsing/actions";
import { CLASS_SUFFIXED_FEATURE_IDENTIFIERS, FEATURE_SCALE_VALUES, MOVED_FOUNDRY_CLASS_SCALES, FEATURE_SPELLS_FORCE_PREPARED, FEATURE_SPELLS_IGNORE, FORCE_TRAIT_SPELL_ADVANCEMENT_ON_RACE, IGNORE_SPELLS_GRANTED_BY_CLASS_FEATURES, IGNORE_SPELLS_GRANTED_BY_FEATS, LEVEL_SCALE, NO_GRANTED_SPELL_LIST_FEATURE_2014_INCLUDES, NO_GRANTED_SPELL_LIST_FEATURE_2024_INCLUDES, NON_ITEM_CHOICE_LABELS, PARSING_CHOICE_FEATURES, PARSING_FEATURES, DRAGON_ANCESTRY_DAMAGE_TYPES, SPECIES_ANCESTRY_GRANTS, SPECIES_LINEAGE_TRAITS, SPECIES_SAVE_ADVANTAGE_TRAITS, SPELL_NAMES_WITH_CONJUNCTIONS, SPELL_TABLE_NAME_EXPANSIONS, TRAIT_REQUIRED_LEVELS } from "./parsing/features";
import { EXCLUDED_EFFECT_MODIFIERS } from "./effects/excluded";
import { VISION_5E_EFFECTS } from "./effects/vision5e";
import { RESETS } from "./actor/resets";
import { CONDITIONS } from "./actor/conditions";
import { SIZES } from "./actor/sizes";
import { ITEM_TYPES } from "./items/types";
import { CURRENCY } from "./actor/currency";
import { SOURCE_CATEGORIES, SOURCE_DATA } from "./generics/sources";
import { NUMBER_MATRIX } from "./generics/numbers";
import { COMPANIONS } from "./parsing/companions";
import { SCENE_IMG } from "./encounters";
import { IDENTIFIER_ADJUSTMENTS } from "./parsing/identifiers";
import { LOADING_MESSAGES } from "./messages/messages";
import { ACTIVITY_TYPES } from "./parsing/data";
import { CLASS_BASE_NAMES, CLASS_FOLDER_SUFFIXES, SUBCLASS_BASE_NAMES } from "./parsing/classes";
import { STATUSES } from "./effects/data";

const DICTIONARY = {
  source: SOURCE_DATA,
  sourceCategories: SOURCE_CATEGORIES,
  numbers: NUMBER_MATRIX,
  currency: CURRENCY,
  sizes: SIZES,
  resets: RESETS,
  conditions: CONDITIONS,
  magicitems: MAGIC_ITEMS,
  types: ITEM_TYPES,
  ...SENSES,
  actor: ACTOR,
  ...ITEM_GENERICS,
  equipment: EQUIPMENT,
  weapon: WEAPONS,
  ammunition: AMMUNITION,
  actions: ACTIONS,
  spell: SPELL,
  monsters: MONSTERS,
  COMPENDIUM_FOLDERS: COMPENDIUM_FOLDERS,
  CONSUMPTION_LINKS: CONSUMPTION_LINKS,
  CONSUMPTION_SPELL_LINKS: CONSUMPTION_SPELL_LINKS,
  parsing: {
    activity: {
      types: ACTIVITY_TYPES,
    },
    actions: PARSING_ACTIONS,
    attackActions: PARSING_ATTACK_ACTIONS,
    classBaseNames: CLASS_BASE_NAMES,
    classFolderSuffixes: CLASS_FOLDER_SUFFIXES,
    subclassBaseNames: SUBCLASS_BASE_NAMES,
    features: PARSING_FEATURES,
    choiceFeatures: PARSING_CHOICE_FEATURES,
    featureSpellsForcePrepared: FEATURE_SPELLS_FORCE_PREPARED,
    featureSpellsIgnore: FEATURE_SPELLS_IGNORE,
    ignoreSpellsGrantedByClassFeatures: IGNORE_SPELLS_GRANTED_BY_CLASS_FEATURES,
    ignoreSpellsGrantedByFeats: IGNORE_SPELLS_GRANTED_BY_FEATS,
    spellListGrantsIgnore: {
      "2014": NO_GRANTED_SPELL_LIST_FEATURE_2014_INCLUDES,
      "2024": NO_GRANTED_SPELL_LIST_FEATURE_2024_INCLUDES,
    },
    levelScale: LEVEL_SCALE,
    forceTraitSpellAdvancementOnRace: FORCE_TRAIT_SPELL_ADVANCEMENT_ON_RACE,
    classSuffixedFeatureIdentifiers: CLASS_SUFFIXED_FEATURE_IDENTIFIERS,
    featureScaleValues: FEATURE_SCALE_VALUES,
    movedFoundryClassScales: MOVED_FOUNDRY_CLASS_SCALES,
    traitRequiredLevels: TRAIT_REQUIRED_LEVELS,
    speciesSaveAdvantageTraits: SPECIES_SAVE_ADVANTAGE_TRAITS,
    speciesLineageTraits: SPECIES_LINEAGE_TRAITS,
    speciesAncestryGrants: SPECIES_ANCESTRY_GRANTS,
    dragonAncestryDamageTypes: DRAGON_ANCESTRY_DAMAGE_TYPES,
    nonItemChoiceLabels: NON_ITEM_CHOICE_LABELS,
    spellNamesWithConjunctions: SPELL_NAMES_WITH_CONJUNCTIONS,
    spellTableNameExpansions: SPELL_TABLE_NAME_EXPANSIONS,
  },
  identifierAdjustments: IDENTIFIER_ADJUSTMENTS,
  effects: {
    excludedModifiers: EXCLUDED_EFFECT_MODIFIERS,
    vision5e: VISION_5E_EFFECTS,
    statuses: STATUSES,
  },
  companions: COMPANIONS,
  encounters: {
    SCENE_IMG,
  },
  messages: {
    loading: LOADING_MESSAGES,
  },
};

export default DICTIONARY;
