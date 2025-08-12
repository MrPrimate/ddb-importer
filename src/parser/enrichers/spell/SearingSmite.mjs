/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SearingSmite extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Initial Damage",
      allowCritical: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["fire"],
              scalingMode: "whole",
              scalingNumber: "1",
            }),
          ],
        },
      },
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
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "fire",
              scalingMode: "whole",
              scalingNumber: "1",
            }),
          ],
          noeffect: true,
          activationOverride: { type: "", condition: "Start of the creatures turn" },
        },
        overrides: {
          data: {
            damage: { onSave: "full" },
          },
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
