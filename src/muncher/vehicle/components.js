import { newComponent } from "./templates/component.js";
import DICTIONARY from "../../dictionary.js";

const TYPE_MAPPING = {
  hull: "equipment",
  helm: "equipment",
  weapon: "weapon",
  movement: "equipment",
  control: "equipment",
  // "crew" action: feat
  // "action", action: feat
  feature: "feat",
  // "loot": loot
};

// function getWeaponType(action) {
//   const entry = DICTIONARY.actions.attackTypes.find((type) => type.attackSubtype === action.attackSubtype);
//   const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === action.attackTypeRange);
//   return entry ? entry.value : range ? `simple${range.value}` : "simpleM";
// }

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

function getActionType(action) {
  let actionType = "rwak";
  // lets see if we have a save stat for things like Dragon born Breath Weapon
  if (typeof action.saveStatId === "number") {
    actionType = "save";
  } else if (action.actionType === 1) {
    if (action.attackTypeRange === 2) {
      actionType = "rwak";
    } else {
      actionType = "mwak";
    }
  } else if (action.rangeId && action.rangeId === 1) {
    actionType = "mwak";
  } else if (action.rangeId && action.rangeId === 2) {
    actionType = "rwak";
  } else {
    actionType = "other";
  }
  return actionType;
}


function getWeaponProperties(action, weapon) {
  if (action.name) weapon.name += `: ${action.name}`;
  weapon.data.description.value += `\n${action.description}`;

  if (action.fixedToHit !== null) {
    weapon.data.attackBonus = `${action.fixedToHit}`;
  }
  // weapon.data.weaponType = getWeaponType(action);
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

  weapon.data.equipped = true;
  weapon.data.actionType = getActionType(action);
  weapon.data.uses = getLimitedUse(action);
  weapon.data.activation = getActivation(action, weapon.data.activation.type === "crew");
  weapon = calculateRange(action, weapon);

  return weapon;

}

// eslint-disable-next-line complexity
function buildComponents(ddb, configurations, component) {
  const results = [];
  const types = component.definition.types.map((t) => t.type);

  console.warn("types", types);
  if (!TYPE_MAPPING[types[0]]) {
    console.error("BAD TYPE", component);
  }

  const item = duplicate(newComponent(component.definition.name, TYPE_MAPPING[types[0]]));

  if (types[0] === "equipment") {
    setProperty(item, "data.armor.type", "vehicle");
  }

  if (component.description) item.data.description.value = component.description;

  item.data.quantity = component.count;

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

  } else if (component.definition.groupType === "component") {

    if (component.definition.speeds && component.definition.speeds.length > 0) {
      item.data.speed = {
        value: component.definition.speeds[0].modes[0].value,
        conditions: component.definition.speeds[0].modes[0].description
          ? component.definition.speeds[0].modes[0].description
          : "",
      };
      if (component.definition.speeds[0].modes.length > 1) {
        const speedConditions = [];
        for (let i = 1; i < component.definition.speeds[0].modes.length; i++) {
          const speedValue = component.definition.speeds[0].modes[i].value;
          const speedCondition = component.definition.speeds[0].modes[i].description
            ? component.definition.speeds[0].modes[i].description
            : "";
          const speedRestriction = component.definition.speeds[0].modes[i].restrictionsText
            ? component.definition.speeds[0].modes[i].restrictionsText
            : "";
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

    if (Number.isInteger(component.definition.armorClass)) {
      item.data.armor = {
        value: parseInt(component.definition.armorClass),
        type: "vehicle",
        dex: null
      };
    }

    if (Number.isInteger(component.definition.hitPoints)) {
      item.data.hp = {
        value: parseInt(component.definition.hitPoints),
        max: parseInt(component.definition.hitPoints),
        dt: null,
        conditions: ""
      };
      if (component.definition.damageThreshold) {
        item.data.hp.dt = component.definition.damageThreshold;
      }
    }

  }

  console.warn("CHECKS", {
    component,
    types,
    includesWeapon: types.includes("weapon"),
  })

  if (types.includes("weapon") && component.definition.actions.length > 0) {
    console.warn("processing weapon", component);
    component.definition.actions.forEach((action) => {
      const actionItem = getWeaponProperties(action, duplicate(item));
      console.warn("action item", actionItem);
      results.push(actionItem);
    });
  } else {
    results.push(item);
  }

  return results;

}

export function processComponents(ddb, configurations) {
  const components = ddb.components.sort((c) => c.displayOrder);

  const componentCount = {};
  const uniqueComponents = [];
  components.forEach((component) => {
    const key = component.definitionKey;
    const count = componentCount[key] || 0;
    if (count === 0) uniqueComponents.push(component);
    componentCount[key] = count + 1;
  });


  const componentItems = uniqueComponents.map((component) => {
    component.count = componentCount[component.definitionKey];
    const builtItems = buildComponents(ddb, configurations, component);
    return builtItems;
  }).flat();

  const featureItems = ddb.features.map((feature) => {
    setProperty(feature, "definition.types", [{ type: "feature" }]);
    setProperty(feature, "definition.name", feature.name);
    const builtItems = buildComponents(ddb, configurations, feature);
    return builtItems;
  }).flat();

  return featureItems.concat(componentItems);
}
