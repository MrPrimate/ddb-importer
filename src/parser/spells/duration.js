/**
 * Retrieves the spell duration
 */
export function getDuration(data) {
  if (data.definition.duration) {
    let units = "";
    if (data.definition.duration.durationUnit !== null) {
      units = data.definition.duration.durationUnit.toLowerCase();
    } else {
      units = data.definition.duration.durationType.toLowerCase().substring(0, 4);
    }
    return {
      value: data.definition.duration.durationInterval || "",
      units: units,
    };
  } else {
    return {};
  }
}
