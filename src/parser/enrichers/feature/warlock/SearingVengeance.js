/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class SearingVengeance extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Use",
      noeffect: true,
      activationCondition: "You or an ally make a death saving throw",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage Roll",
          type: "damage",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          data: {
            range: {
              value: 30,
              unit: "feet",
            },
            target: {
              affects: {
                type: "enemy",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "30",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [{
      name: "Searing Vengeance: Blinded",
      options: {
        durationSeconds: 6,
      },
      statuses: ["Blinded"],
    }];
  }

}
