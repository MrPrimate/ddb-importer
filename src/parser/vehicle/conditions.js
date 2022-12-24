import DICTIONARY from "../../dictionary.js";

export function getDamageImmunities(ddb) {
  const config = CONFIG.DDB.damageTypes;

  let values = [];
  let custom = [];

  const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

  ddb.damageImmunities.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    if (adjustment && damageTypes.includes(adjustment.name.toLowerCase())) {
      values.push(adjustment.name.toLowerCase());
    } else if (adjustment && adjustment.slug === "bludgeoning-piercing-and-slashing-from-nonmagical-attacks") {
      values.push("physical");
    } else if (adjustment) {
      const midiQolInstalled = game.modules.get("midi-qol")?.active;
      if (midiQolInstalled) {
        if (adjustment.name.toLowerCase().includes("silvered")) {
          values.push("silver");
        } else if (adjustment.name.toLowerCase().includes("adamantine")) {
          values.push("adamant");
        } else if (adjustment.slug === "damage-from-spells") {
          values.push("spell");
        } else {
          custom.push(adjustment.name);
        }
      } else {
        custom.push(adjustment.name);
      }
    }
  });

  const adjustments = {
    value: values,
    custom: custom.join("; "),
  };

  return adjustments;
}

export function getConditionImmunities(ddb) {
  const config = CONFIG.DDB.conditions.map((condition) => {
    return {
      id: condition.definition.id,
      name: condition.definition.name,
      type: condition.definition.type,
      slug: condition.definition.slug,
    };
  });

  let values = [];
  let custom = [];

  ddb.conditionImmunities.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    const valueAdjustment = DICTIONARY.conditions.find((condition) => condition.label.toLowerCase() == adjustment.name.toLowerCase());
    if (adjustment && valueAdjustment) {
      values.push(valueAdjustment.foundry);
    } else if (adjustment) {
      custom.push(adjustment.name);
    }
  });

  const adjustments = {
    value: values,
    custom: custom.join("; "),
  };

  return adjustments;
}
