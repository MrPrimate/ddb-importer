import { DICTIONARY } from "../../config/_module";

// is there a spell casting ability?
export function hasSpellCastingAbility(spellCastingAbilityId: number | string): boolean {
  return DICTIONARY.actor.abilities.some((ability) => ability.id === spellCastingAbilityId);
}

// convert spellcasting ability id to string used by foundry
export function convertSpellCastingAbilityId(spellCastingAbilityId: number | string): T5eAbility {
  return DICTIONARY.actor.abilities.find((ability) => ability.id === spellCastingAbilityId).value;
}

// search through classinfo and determine spellcasting ability
export function getSpellCastingAbility(classInfo: any, checkSubclass = true, onlySubclass = false): T5eAbility {
  let spellCastingAbility: T5eAbility;
  if (!onlySubclass && hasSpellCastingAbility(classInfo.definition.spellCastingAbilityId)) {
    spellCastingAbility = convertSpellCastingAbilityId(classInfo.definition.spellCastingAbilityId);
  } else if (
    checkSubclass
    && classInfo.subclassDefinition
    && hasSpellCastingAbility(classInfo.subclassDefinition.spellCastingAbilityId)
  ) {
    // e.g. Arcane Trickster has spellcasting ID granted here
    spellCastingAbility = convertSpellCastingAbilityId(classInfo.subclassDefinition.spellCastingAbilityId);
  } else {
    // special cases: No spellcaster, but can cast spells like totem barbarian, default to wis
    spellCastingAbility = "wis";
  }
  return spellCastingAbility;
}
