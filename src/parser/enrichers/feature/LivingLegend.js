/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class LivingLegend extends DDBEnricherMixin {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {

    return [
      // these don't always show up
      // { action: { name: "Saving Throw Reroll", type: "class" } },
      // { action: { name: "Unerring Strike", type: "class" } },

      {
        constructor: {
          name: "Saving Throw Reroll",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          overrideActivation: {
            type: "reaction",
          },
        },
        overrides: {
          addItemConsumption: true,
        },
      },

    ];
  }

  get override() {
    return {
      data: {
        name: "Living Legend",
      },
    };
  }

}
