import utils from "../../utils.js";

const CONDITION_TYPES = [
  { name: "Blinded", value: "blinded" },
  { name: "Charmed", value: "charmed" },
  { name: "Deafened", value: "deafened" },
  { name: "Exhaustion", value: "exhaustion" },
  { name: "Frightened", value: "frightened" },
  { name: "Grappled", value: "grappled" },
  { name: "Incapacitated", value: "incapacitated" },
  { name: "Invisible", value: "invisible" },
  { name: "Paralyzed", value: "paralyzed" },
  { name: "Petrified", value: "petrified" },
  { name: "Poisoned", value: "poisoned" },
  { name: "Prone", value: "prone" },
  { name: "Restrained", value: "restrained" },
  { name: "Stunned", value: "stunned" },
  { name: "Unconscious", value: "unconscious" },
  { name: "Diseased", value: "diseased" },
  { name: "Disease", value: "diseased" },
];

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];


function getAdjustmentsConfig(type, DDB_CONFIG) {
  const damageAdjustments = DDB_CONFIG.damageAdjustments;

  switch (type) {
    case "resistances":
      return damageAdjustments.filter((adj) => adj.type == 1);
    case "immunities":
      return damageAdjustments.filter((adj) => adj.type == 2);
    case "vulnerabilities":
      return damageAdjustments.filter((adj) => adj.type == 3);
    case "conditions":
      return DDB_CONFIG.conditions.map((condition) => {
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

function getDamageAdjustments(monster, type, DDB_CONFIG) {
  const config = getAdjustmentsConfig(type, DDB_CONFIG);

  let values = [];
  let custom = [];

  monster.damageAdjustments.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    if (adjustment && DAMAGE_TYPES.includes(adjustment.name.toLowerCase())) {
      values.push(adjustment.name.toLowerCase());
    } else if (adjustment && adjustment.slug === "bludgeoning-piercing-and-slashing-from-nonmagical-attacks") {
      values.push("physical");
    } else if (adjustment) {
      const midiQolInstalled = utils.isModuleInstalledAndActive("midi-qol");
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

export function getDamageImmunities(monster, DDB_CONFIG) {
  return getDamageAdjustments(monster, "immunities", DDB_CONFIG);
}

export function getDamageResistances(monster, DDB_CONFIG) {
  return getDamageAdjustments(monster, "resistances", DDB_CONFIG);
}
export function getDamageVulnerabilities(monster, DDB_CONFIG) {
  return getDamageAdjustments(monster, "vulnerabilities", DDB_CONFIG);
}
export function getConditionImmunities(monster, DDB_CONFIG) {
  const config = getAdjustmentsConfig("conditions", DDB_CONFIG);

  let values = [];
  let custom = [];

  monster.conditionImmunities.forEach((adj) => {
    const adjustment = config.find((cadj) => adj === cadj.id);
    const valueAdjustment = CONDITION_TYPES.find((condition) => condition.name.toLowerCase() == adjustment.name.toLowerCase());
    if (adjustment && valueAdjustment) {
      values.push(valueAdjustment.value);
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
