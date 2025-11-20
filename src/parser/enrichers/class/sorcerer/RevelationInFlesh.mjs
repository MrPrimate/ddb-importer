/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RevelationInFlesh extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Font of Magic: Sorcery Points",
      activationType: "bonus",
      addScalingMode: "amount",
      addConsumptionScalingMax: "4",
      duration: {
        value: 10,
        units: "minute",
      },
    };
  }

  get effects() {
    return [
      {
        name: "Aquatic Adaptation",
        options: {
          durationSeconds: 600,
        },
        changes: [
          this.movementChange("2 * @attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
      },
      {
        name: "Glistening Flight",
        options: {
          durationSeconds: 600,
        },
        changes: [
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
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
