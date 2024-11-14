/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class SearingSmite extends DDBEnricherMixin {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Initial Damage",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          number: 2,
          denomination: 6,
          types: ["fire"],
          scalingMode: "whole",
          scalingNumber: "1",
        }),
      ],
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Ongoing Damage",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherMixin.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "fire",
            }),
          ],
          noeffect: true,
          activationOverride: { type: "", condition: "Start of the creatures turn" },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "On fire from Searing Smite",
      },
    ];
  }
}
