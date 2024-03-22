import { newComponent } from "./templates/component.js";
import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";

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

function getActivation(action, crew = false) {
  const actionType = DICTIONARY.actions.activationTypes.find((type) => type.id === action.activation?.activationType);
  const activation = {
    type: crew ? "crew" : actionType ? actionType.value : "action",
    cost: action.activation?.activationTime || 1,
    condition: "",
  };
  return activation;
}

function getLimitedUse(action) {
  if (
    action.limitedUse
    && (action.limitedUse.maxUses)
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
    weapon.system.range = { value: null, units: "self", long: "" };
    weapon.system.target = {
      value: action.range.aoeSize,
      type: DICTIONARY.actions.aoeType.find((type) => type.id === action.range.aoeType)?.value,
      units: "ft",
    };
  } else if (action.range && action.range.range) {
    weapon.system.range = {
      value: action.range.range,
      units: "ft",
      long: action.range.longRange || "",
    };
  } else {
    weapon.system.range = { value: 5, units: "ft", long: "" };
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
  if (typeof action.saveStatId === "number" || action.fixedSaveDc) {
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
  weapon.system.description.value += `\n${action.description}`;

  if (action.fixedToHit !== null) {
    weapon.system.attack.bonus = `${action.fixedToHit}`;
  }

  weapon.system.type.value = "siege";
  weapon.system.target = {
    "value": 1,
    "width": null,
    "units": "",
    "type": "creature"
  };
  if (Number.isInteger(action.numberOfTargets)) weapon.system.target.value = action.numberOfTargets;

  const damageType = DICTIONARY.actions.damageType.find((type) => type.id === action.damageTypeId).name;

  if (action.dice?.diceString) weapon.system.damage.parts = [[action.dice.diceString, damageType]];

  if (action.fixedSaveDc) {
    const saveAbility = (action.saveStatId)
      ? DICTIONARY.character.abilities.find((stat) => stat.id === action.saveStatId).value
      : getSaveAbility(action.description);
    weapon.system.save = {
      ability: saveAbility,
      dc: Number.parseInt(action.fixedSaveDc),
      scaling: "flat",
    };
  }

  weapon.system.equipped = true;
  weapon.system.actionType = getActionType(action);
  weapon.system.uses = getLimitedUse(action);
  weapon.system.activation = getActivation(action, weapon.system.activation.type === "crew");
  weapon = calculateRange(action, weapon);

  return weapon;

}

// eslint-disable-next-line complexity
function buildComponents(ddb, configurations, component) {
  const results = [];
  const types = component.definition.types.map((t) => t.type);
  const item = foundry.utils.duplicate(newComponent(component.definition.name, TYPE_MAPPING[types[0]]));

  if (types[0] === "equipment") {
    foundry.utils.setProperty(item, "data.armor.type", "vehicle");
  }

  if (component.description) item.system.description.value = parseTags(component.description);

  item.system.quantity = component.count;

  item.system.armor = {
    value: null,
    type: "vehicle",
    dex: null
  };
  item.system.hp = {
    value: null,
    max: null,
    dt: null,
    conditions: ""
  };

  if (component.groupType === "action-station") {
    item.system.activation.type = "crew";
    switch (component.definition.coverType) {
      case "full":
        item.system.cover = 1;
        break;
      case "half":
        item.system.cover = 0.5;
        break;
      case "three-quarters":
        item.system.cover = 0.75;
        break;
      default:
        item.system.cover = undefined;
        break;
    }

  } else if (component.definition.groupType === "component") {

    if (component.definition.speeds && component.definition.speeds.length > 0) {
      item.system.speed = {
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
          item.system.speed.conditions += speedConditions.join("; ");
        }
      }
    }

    if (Number.isInteger(component.definition.armorClass)) {
      item.system.armor = {
        value: parseInt(component.definition.armorClass),
        type: "vehicle",
        dex: null
      };
    }

    if (Number.isInteger(component.definition.hitPoints)) {
      item.system.hp = {
        value: parseInt(component.definition.hitPoints),
        max: parseInt(component.definition.hitPoints),
        dt: null,
        conditions: ""
      };
      if (component.definition.damageThreshold) {
        item.system.hp.dt = component.definition.damageThreshold;
      }
    }
  }

  if (types.includes("weapon") && component.definition.actions.length > 0) {
    logger.debug("processing weapon", component);
    component.definition.actions.forEach((action) => {
      const actionItem = getWeaponProperties(action, foundry.utils.duplicate(item));
      logger.debug("action item", actionItem);
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


  const componentItems = uniqueComponents
    .filter((f) => f.definition.name)
    .map((component) => {
      component.count = componentCount[component.definitionKey];
      const builtItems = buildComponents(ddb, configurations, component);
      return builtItems;
    })
    .flat();

  const featureItems = ddb.features
    .filter((f) => f.name)
    .map((feature) => {
      foundry.utils.setProperty(feature, "definition.types", [{ type: "feature" }]);
      foundry.utils.setProperty(feature, "definition.name", feature.name);
      const builtItems = buildComponents(ddb, configurations, feature);
      return builtItems;
    })
    .flat();

  return featureItems.concat(componentItems);
}
