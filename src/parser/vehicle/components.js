import { logger } from "../../lib/_module.mjs";
import DDBComponentFeature from "./DDBComponentFeature.mjs";


// eslint-disable-next-line no-unused-vars
async function buildComponents({ ddb, configurations, component, vehicle }) {
  const results = [];

  const actions = component.definition?.actions?.length > 0
    ? component.definition.actions
    : [{}];

  for (const action of actions) {
    const ddbFeature = new DDBComponentFeature(
      {
        ddbVehicle: {
          is2014: true,
          vehicle,
        },
        component,
        action,
      },
    );

    await ddbFeature.loadEnricher();
    await ddbFeature.parse();

    logger.debug("built component", ddbFeature);
    results.push(ddbFeature.data);

  }

  return results;
}

export async function processComponents(ddb, configurations, vehicle) {
  const components = ddb.components.sort((c) => c.displayOrder);

  const componentCount = {};
  const uniqueComponents = [];
  components.forEach((component) => {
    const key = component.definitionKey;
    const count = componentCount[key] || 0;
    if (count === 0) uniqueComponents.push(component);
    componentCount[key] = count + 1;
  });

  const results = [];
  for (const component of uniqueComponents.filter((f) => f.definition.name)) {
    component.count = componentCount[component.definitionKey];
    const builtItems = await buildComponents({ ddb, configurations, component, vehicle });
    results.push(...builtItems);
  }

  for (const feature of ddb.features.filter((f) => f.name)) {
    foundry.utils.setProperty(feature, "definition.types", [{ type: "feature" }]);
    foundry.utils.setProperty(feature, "definition.name", feature.name);
    const builtItems = await buildComponents({ ddb, configurations, component: feature, vehicle });

    results.push(...builtItems);
  }

  return results;
}
