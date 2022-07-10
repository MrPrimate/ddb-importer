import DICTIONARY from "../../dictionary.js";

/**
 * Gets the activation information of this spell
 */
export function getActivation(data) {
  // for newer override spells, activation is at higher level
  const activation = data.activation ? data.activation : data.definition.activation;
  const activationType = DICTIONARY.spell.activationTypes.find(
    (type) => type.activationType === activation.activationType
  );
  if (activationType && activation.activationTime) {
    return {
      type: activationType.value,
      cost: activation.activationTime,
      condition: data.definition.castingTimeDescription || "",
    };
  } else {
    return {
      type: "action",
      cost: 1,
      condition: data.definition.castingTimeDescription || "",
    };
  }
}
