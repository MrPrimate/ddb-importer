import { DICTIONARY } from "../../config/_module";

// is there a spell casting ability?
export function hasSpellCastingAbility(spellCastingAbilityId: number | string | null): boolean {
  return DICTIONARY.actor.abilities.some((ability) => ability.id === spellCastingAbilityId);
}

// convert spellcasting ability id to string used by foundry
export function convertSpellCastingAbilityId(spellCastingAbilityId: number | string | null): T5eAbility {
  const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === spellCastingAbilityId);
  // callers check hasSpellCastingAbility first; if that invariant is broken fall
  // back to wis, matching the "no spellcasting ability" default used elsewhere
  return ability?.value ?? "wis";
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
