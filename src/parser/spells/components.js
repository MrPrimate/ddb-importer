export function getComponents (data) {
  const properties = [];

  if (data.definition.components.includes(1)) properties.push("vocal");
  if (data.definition.components.includes(2)) properties.push("somatic");
  if (data.definition.components.includes(3)
    || foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.forceMaterial")
  ) {
    properties.push("material");
  }
  if (data.definition.ritual) properties.push("ritual");
  if (data.definition.concentration) properties.push("concentration");
  return {
    value: data.definition.componentsDescription,
    vocal: data.definition.components.includes(1),
    somatic: data.definition.components.includes(2),
    material: data.definition.components.includes(3) || foundry.utils.getProperty(data, "flags.ddbimporter.dndbeyond.forceMaterial"),
    ritual: data.definition.ritual,
    concentration: data.definition.concentration,
    properties,
  };
}

export function getMaterials(data) {
  // this is mainly guessing
  if (data.definition.componentsDescription && data.definition.componentsDescription.length > 0) {
    let cost = 0;
    let matches = data.definition.componentsDescription.toLowerCase().match(/([\d.,]+)\s*gp/);
    if (matches) {
      cost = parseInt(matches[1].replace(/,|\./g, ""));
    }

    return {
      value: data.definition.componentsDescription,
      consumed: data.definition.componentsDescription.toLowerCase().indexOf("consume") !== -1,
      cost: cost,
      supply: 0,
    };
  } else {
    return {
      value: "",
      consumed: false,
      cost: 0,
      supply: 0,
    };
  }
}
