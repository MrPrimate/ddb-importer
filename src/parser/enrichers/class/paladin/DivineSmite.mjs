/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineSmite extends DDBEnricherData {
  get type() {
    return this.is2014 ? "damage" : null;
  }

  get activity() {
    if (this.is2024) return null;
    return {
      targetType: "creature",
      activationType: "special",
      addConsumptionScalingMax: "5",
      midiUseCondition: `!["fiend", "undead"].includes(raceOrType)`,
      data: {
        consumption: {
          targets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: {
                mode: "level",
                formula: "",
              },
            },
          ],
          spellSlot: true,
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["radiant"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    if (this.is2024) return [];
    return [
      {
        duplicate: true,
        overrides: {
          name: "vs Fiends or Undead",
          midiUseCondition: `!["fiend", "undead"].includes(raceOrType)`,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 8,
                  types: ["radiant"],
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
