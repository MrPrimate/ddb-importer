import DICTIONARY from "../../dictionary.js";

function getAdjustmentsConfig(type) {
  const damageAdjustments = CONFIG.DDB.damageAdjustments;

  switch (type) {
    case "resistances":
      return damageAdjustments.filter((adj) => adj.type == 1);
    case "immunities":
      return damageAdjustments.filter((adj) => adj.type == 2);
    case "vulnerabilities":
      return damageAdjustments.filter((adj) => adj.type == 3);
    case "conditions":
      return CONFIG.DDB.conditions.map((condition) => {
        return {
          id: condition.definition.id,
          name: condition.definition.name,
          type: condition.definition.type,
          slug: condition.definition.slug,
        };
      });
    default:
      return null;
  }
}

function getDamageAdjustments(monster, type) {
  const config = getAdjustmentsConfig(type);

  let values = [];
  let custom = [];

  const damageTypes = DICTIONARY.actions.damageType.filter((d) => d.name !== null).map((d) => d.name);

  monster.damageAdjustments.forEach((adj) => {
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

export function getDamageImmunities(monster) {
  return getDamageAdjustments(monster, "immunities");
}

export function getDamageResistances(monster) {
  return getDamageAdjustments(monster, "resistances");
}
export function getDamageVulnerabilities(monster) {
  return getDamageAdjustments(monster, "vulnerabilities");
}
export function getConditionImmunities(monster) {
  const config = getAdjustmentsConfig("conditions");

  let values = [];
  let custom = [];

  monster.conditionImmunities.forEach((adj) => {
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
