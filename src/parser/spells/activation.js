import DICTIONARY from "../../dictionary.js";

/**
 * Gets the activation information of this spell
 */
export function getActivation(data) {
  let activationType = DICTIONARY.spell.activationTypes.find(
    (type) => type.activationType === data.definition.activation.activationType
  );
  if (activationType && data.definition.activation.activationTime) {
    return {
      type: activationType.value,
      cost: data.definition.activation.activationTime,
      condition: "",
    };
  } else {
    return {
      type: "action",
      cost: 1,
      condition: "",
    };
  }
}
