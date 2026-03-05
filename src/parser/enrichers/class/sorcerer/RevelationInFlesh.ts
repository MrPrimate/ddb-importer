import DDBEnricherData from "../../data/DDBEnricherData";

export default class RevelationInFlesh extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      activationType: "bonus",
      addScalingMode: "amount",
      addConsumptionScalingMax: "4",
      duration: {
        value: 10,
        units: "minute",
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aquatic Adaptation",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("2 * @attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
      },
      {
        name: "Glistening Flight",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.customChange("true", 20, "system.attributes.movement.hover"),
        ],
      },
      {
        name: "See the Invisible",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";See Invisibility (60ft)", 1, "system.attributes.senses.special"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.detectionModes.seeInvisibility.range"),
        ],
      },
      {
        name: "Wormlike Movement",
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
