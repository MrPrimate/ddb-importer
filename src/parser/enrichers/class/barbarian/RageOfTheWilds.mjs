/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class RageOfTheWilds extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get activity() {
    return {
      targetType: "self",
      name: "Owl",
      activationType: "special",
    };
  }

  get additionalActivities() {
    return ["Bear", "Eagle", "Wolf"].map((name) => {
      return {
        constructor: {
          name,
          type: "utility",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "self",
            },
          },
        },
      };
    });
  }

  get effects() {
    return [
      {
        name: "Bear",
        options: {
        },
        activityMatch: "Bear",
        changes: DDBEnricherMixin.allDamageTypes(["force", "necrotic", "psychic", "radiant"]).map((damage) => {
          return DDBEnricherMixin.generateUnsignedAddChange(damage, 20, "system.traits.dr.value");
        }),
      },
      {
        name: "Eagle",
        options: {
        },
        activityMatch: "Eagle",
        changes: [
        ],
      },
      {
        name: "Wolf",
        options: {
          description: `Allies have Advantage on attack rolls against your enemies within 5 ft .`,
        },
        activityMatch: "Wolf",
        changes: [
        ],
      },
    ];
  }

}
