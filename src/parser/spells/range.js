/** Spell range */
export function getRange(data) {
  // else lets try and fill in some target details
  let value = data.definition.range.rangeValue ? data.definition.range.rangeValue : null;
  let units = "ft";
  let long = null;

  switch (data.definition.range.origin) {
    case "Touch":
      value = null;
      units = "touch";
      break;
    case "Self":
      value = null;
      units = "self";
      break;
    case "None":
      units = "none";
      break;
    case "Ranged":
      units = "ft";
      break;
    case "Feet":
      units = "ft";
      break;
    case "Miles":
      units = "ml";
      break;
    case "Sight":
    case "Special":
      units = "special";
      break;
    case "Any":
      units = "any";
      break;
    case undefined:
      units = null;
      break;
    // no default
  }

  return {
    value: value,
    long: long,
    units: units,
  };
}
