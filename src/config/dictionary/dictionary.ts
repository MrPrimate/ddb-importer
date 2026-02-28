import { ACTOR } from "./actor/actor";
import { MONSTERS } from "./actor/monsters";
import { CONSUMPTION_LINKS, CONSUMPTION_SPELL_LINKS } from "./actor/consumptionLinking";
import { COMPENDIUM_FOLDERS } from "./folders/compendiums";
import { EQUIPMENT } from "./items/equipment";
import { ITEM_GENERICS } from "./items/generics";
import { WEAPONS } from "./items/weapons";
import { ACTIONS } from "./actor/actions";
import { MAGIC_ITEMS } from "./items/magicItems";
import { SENSES } from "./actor/senses";
import { SPELL } from "./spell/spell";
import { PARSING_ACTIONS, PARSING_ATTACK_ACTIONS } from "./parsing/actions";
import { FEATURE_SPELLS_IGNORE, IGNORE_SPELLS_GRANTED_BY_CLASS_FEATURES, IGNORE_SPELLS_GRANTED_BY_FEATS, LEVEL_SCALE, NO_GRANTED_SPELL_LIST_FEATURE_2014_INCLUDES, PARSING_CHOICE_FEATURES, PARSING_FEATURES } from "./parsing/features";
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
    features: PARSING_FEATURES,
    choiceFeatures: PARSING_CHOICE_FEATURES,
    featureSpellsIgnore: FEATURE_SPELLS_IGNORE,
    ignoreSpellsGrantedByClassFeatures: IGNORE_SPELLS_GRANTED_BY_CLASS_FEATURES,
    ignoreSpellsGrantedByFeats: IGNORE_SPELLS_GRANTED_BY_FEATS,
    spellListGrantsIgnore: {
      "2014": NO_GRANTED_SPELL_LIST_FEATURE_2014_INCLUDES,
    },
    levelScale: LEVEL_SCALE,
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
