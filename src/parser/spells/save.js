import DICTIONARY from "../../dictionary.js";

export function getSave(data) {
  if (data.definition.requiresSavingThrow && data.definition.saveDcAbilityId) {
    const saveAbility = DICTIONARY.character.abilities.find((ability) => ability.id === data.definition.saveDcAbilityId)
      .value;
    if (data.overrideSaveDc) {
      return {
        ability: saveAbility,
        dc: data.overrideSaveDc,
        scaling: "flat",
      };
    } else {
      return {
        ability: saveAbility,
        dc: null,
        scaling: "spell",
      };
    }
  } else {
    return {
      ability: "",
      dc: null,
    };
  }
}
