/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RageOfTheGods extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Rage of the Gods",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you activate rage",
      data: {
      },
    };
  }

  get effects() {
    return [
      {
        name: "Rage of the Gods",
        activityMatch: "Rage of the Gods",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Resurrect",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.barbarian.levels",
            type: "healing",
          }),
          rangeOverride: {
            units: "ft",
            value: "30",
          },
        },
      },
    ];
  }

}
