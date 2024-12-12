import { ACTOR } from "./actor/actor.mjs";
import { MONSTERS } from "./actor/monsters.mjs";
import { CONSUMPTION_LINKS, CONSUMPTION_SPELL_LINKS } from "./actor/consumptionLinking.mjs";
import { COMPENDIUM_FOLDERS } from "./folders/compendiums.mjs";
import { EQUIPMENT } from "./items/equipment.mjs";
import { ITEM_GENERICS } from "./items/generics.mjs";
import { WEAPONS } from "./items/weapons.mjs";
import { ACTIONS } from "./actor/actions.mjs";
import { MAGIC_ITEMS } from "./items/magicItems.mjs";
import { SENSES } from "./actor/senses.mjs";
import { SPELL } from "./spell/spell.mjs";
import { PARSING_ACTIONS, PARSING_ATTACK_ACTIONS } from "./parsing/actions.mjs";
import { PARSING_CHOICE_FEATURES, PARSING_FEATURES } from "./parsing/features.mjs";
import { EXCLUDED_EFFECT_MODIFIERS } from "./effects/excluded.mjs";
import { VISION_5E_EFFECTS } from "./effects/vision5e.mjs";
import { RESETS } from "./actor/resets.mjs";
import { CONDITIONS } from "./actor/conditions.mjs";
import { SIZES } from "./actor/sizes.mjs";
import { ITEM_TYPES } from "./items/types.mjs";
import { CURRENCY } from "./actor/currency.mjs";
import { SOURCE_CATEGORIES } from "./generics/sources.mjs";
import { NUMBER_MATRIX } from "./generics/numbers.mjs";
import { COMPANIONS } from "./parsing/companions.mjs";

const DICTIONARY = {
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
    actions: PARSING_ACTIONS,
    attackActions: PARSING_ATTACK_ACTIONS,
    features: PARSING_FEATURES,
    choiceFeatures: PARSING_CHOICE_FEATURES,
  },
  effects: {
    excludedModifiers: EXCLUDED_EFFECT_MODIFIERS,
    vision5e: VISION_5E_EFFECTS,
  },
  companions: COMPANIONS,
};

export default DICTIONARY;
