import { newComponent } from "./templates/component.js";
import DICTIONARY from "../../dictionary.js";

const TYPE_MAPPING = {
  hull: "equipment",
  weapon: "weapon",
  movement: "equipment",
  control: "movement",
  // "crew" action: feat
  // "action", action: feat
  feature: "feat",
  // "loot": loot
};
function getWeaponType(action) {
  const entry = DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === action.attackSubtype);
  const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === action.attackTypeRange);
  return entry ? entry.value : range ? `simple${range.value}` : "simpleM";
}

function getActivation(action, crew=false) {
  if (action.activation) {
    const actionType = DICTIONARY.actions.activationTypes.find((type) => type.id === action.activation.activationType);
    const activation = !actionType
      ? {}
      : {
        type: crew ? "crew" : actionType.value,
        cost: action.activation.activationTime || 1,
        condition: "",
      };
    return activation;
  }
  return {};
}

function getLimitedUse(action) {
  if (
    action.limitedUse &&
    (action.limitedUse.maxUses)
  ) {
    const resetType = DICTIONARY.resets.find((type) => type.id === action.limitedUse.resetType);
    let maxUses = (action.limitedUse.maxUses && action.limitedUse.maxUses !== -1) ? action.limitedUse.maxUses : 0;

    const finalMaxUses = (maxUses) ? parseInt(maxUses) : null;

    return {
      value: (finalMaxUses !== null && finalMaxUses != 0) ? maxUses - action.limitedUse.numberUsed : null,
      max: (finalMaxUses != 0) ? finalMaxUses : null,
      per: resetType ? resetType.value : "",
    };
  } else {
    return {
      value: null,
      max: null,
      per: "",
    };
  }
}

function calculateRange(action, weapon) {
  if (action.range && action.range.aoeType && action.range.aoeSize) {
    weapon.data.range = { value: null, units: "self", long: "" };
    weapon.data.target = {
      value: action.range.aoeSize,
      type: DICTIONARY.actions.aoeType.find((type) => type.id === action.range.aoeType)?.value,
      units: "ft",
    };
  } else if (action.range && action.range.range) {
    weapon.data.range = {
      value: action.range.range,
      units: "ft",
      long: action.range.long || "",
    };
  } else {
    weapon.data.range = { value: 5, units: "ft", long: "" };
  }
  return weapon;
}


function getSaveAbility(description) {
  const save = description.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
  if (save) {
    return save[2] ? save[2].toLowerCase().substr(0, 3) : "";
  } else {
    return "";
  }
}


function getWeaponProperties(action, weapon) {
  if (action.name) weapon.name += `: ${action.name}`;
  weapon.data.description.value += `\n${action.description}`;

  if (action.fixedToHit !== null) {
    weapon.data.attackBonus = `${action.fixedToHit}`;
  }
  weapon.data.weaponType = "siege";
  weapon.data.target = {
    "value": 1,
    "width": null,
    "units": "",
    "type": "creature"
  };
  if (Number.isInteger(action.numberOfTargets)) weapon.data.target.value = action.numberOfTargets;

  const damageType = DICTIONARY.actions.damageType.find((type) => type.id === action.damageTypeId).name;

  if (hasProperty(action, "dice.diceString")) weapon.data.damage.parts = [[action.dice.diceString, damageType]];

  if (action.fixedSaveDc) {
    const saveAbility = (action.saveStatId)
      ? DICTIONARY.character.abilities.find((stat) => stat.id === action.saveStatId).value
      : getSaveAbility(action.description);
    weapon.data.save = {
      ability: saveAbility,
      dc: action.fixedSaveDc,
      scaling: action.fixedSaveDc,
    };
  }

  weapon.data.actionType = getWeaponType(action);
  weapon.data.uses = getLimitedUse(action);
  weapon.data.activation = getActivation(action, weapon.data.activation.type === "crew");
  weapon = calculateRange(action, weapon);

}

// eslint-disable-next-line complexity
function buildComponents(ddb, configurations, component) {
  const results = [];
  const types = component.definition.types.map((t) => t.type);

  if (!TYPE_MAPPING[types[0]]) {
    console.warn("BAD TYPE", component);
  }

  const item = duplicate(newComponent(component.definition.name, TYPE_MAPPING[types[0]]));

  if (component.description) item.data.description.value = component.description;

  if (component.groupType === "action-station") {
    item.data.activation.type = "crew";
    switch (component.definition.coverType) {
      case "full":
        item.data.cover = 1;
        break;
      case "half":
        item.data.cover = 0.5;
        break;
      case "three-quarters":
        item.data.cover = 0.75;
        break;
      default:
        item.data.cover = undefined;
        break;
    }

    if (component.hitPoints) {
      item.data.hp = {
        value: component.hitPoints,
        max: component.hitPoints,
        dt: null,
        conditions: ""
      };
      if (component.damageThreshold) {
        item.data.hp.dt = component.damageThreshold;
      }
    }

  } else if (component.groupType === "component") {

    if (component.speeds && component.speeds.length > 0) {
      item.data.speed = {
        value: component.speeds[0].modes[0].value,
        conditions: component.speeds[0].modes[0].description ? component.speeds[0].modes[0].description : "",
      };
      if (component.speeds[0].modes.length > 1) {
        const speedConditions = [];
        for (let i = 1; i < component.speeds[0].modes.length; i++) {
          const speedValue = component.speeds[0].modes[i].value;
          const speedCondition = component.speeds[0].modes[i].description ? component.speeds[0].modes[i].description : "";
          const speedRestriction = component.speeds[0].modes[i].restrictionsText ? component.speeds[0].modes[i].restrictionsText : "";
          speedConditions.push(`${speedValue} ${speedCondition}${speedRestriction}`);
        }

        const speedAdjustment = component.definition.types.find((t) => t.type === "movement");
        if (speedAdjustment && speedAdjustment.adjustments && speedAdjustment.adjustments.length > 0) {
          speedAdjustment.adjustments.filter((a) => a.type === "speed").forEach((a) => {
            a.values.forEach((v) => {
              speedConditions.push(`-${v.perDamageValue}ft speed per ${v.perDamageTaken} damage taken`);
            });
          });
        }
        if (speedConditions.length > 0) {
          item.data.speed.conditions += speedConditions.join("; ");
        }
      }
    }

  }

  if (types.includes("weapon") && component.definition.actions > 0) {
    component.definition.actions.forEach((action) => {
      results.push(getWeaponProperties(action, duplicate(item)));
    });
  } else {
    results.push(item);
  }

  return results;

}

export function processComponents(ddb, configurations) {
  const components = ddb.components.sort((c) => c.displayOrder);

  const componentItems = components.map((component) => {
    const builtItems = buildComponents(ddb, configurations, component);
    return builtItems;
  }).flat();

  const featureItems = ddb.features.map((feature) => {
    setProperty(feature, "definition.types.type", "feature");
    const builtItems = buildComponents(ddb, configurations, feature);
    return builtItems;
  }).flat();

  return featureItems.concat(componentItems);
}
