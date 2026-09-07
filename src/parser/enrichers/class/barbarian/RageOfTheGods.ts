import DDBEnricherData from "../../data/DDBEnricherData";

export default class RageOfTheGods extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Rage of the Gods",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you activate rage",
      data: {
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rage of the Gods",
        activityMatch: "Rage of the Gods",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Resurrect",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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
