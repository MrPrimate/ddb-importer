/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StepsOfTheFey extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        name: "Refreshing Step",
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          types: ["temphp"],
        }),
      },
    };
  }

  get effects() {
    return [
      {
        options: {
          description:
            "Disadvantage on attack rolls against creatures other than caster until the start of the casters next turn",
        },
        name: "Taunted",
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Taunting Step",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    ];
  }
}
