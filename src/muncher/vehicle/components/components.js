import { newComponent } from "../templates/component";

const TYPE_MAPPING = {
  hull: "equipment",
  // "weapons": "weapon",
  movement: "equipment",
  control: "movement",
  // "crew" action: feat
  // "action", action: feat
  // "feature": feat
  // "loot": loot
};

function buildComponent(ddb, configurations, component) {
  const types = component.definition.types.map((t) => t.type);

  const item = duplicate(newComponent(component.definition.name, types[0]));

  if (component.description) item.data.description.value = component.description;

  if (component.groupType === "action-station") {
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

  return item;

}

export function processComponents(ddb, configurations) {

  // const components = ddb.components.filter((c) => configurations.EC || (!configurations.EC && !c.isPrimaryComponent));

  const components = ddb.components.sort((c) => c.displayOrder);

  const items = components.map((component) => {
    const builtItem = buildComponent(ddb, configurations, component);
    return builtItem;
  });

  return items;
}
