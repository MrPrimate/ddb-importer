/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class RevelationInFlesh extends DDBEnricherMixin {

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

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

  get effect() {
    return {
      multiple: [
        {
          name: "Aquatic Adaptation",
          options: {
            durationSeconds: 600,
          },
          changes: [
            DDBEnricherMixin.generateUpgradeChange("2 * @attributes.movement.walk", 20, "system.attributes.movement.swim"),
          ],
        },
        {
          name: "Glistening Flight",
          options: {
            durationSeconds: 600,
          },
          changes: [
            DDBEnricherMixin.generateUpgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
            DDBEnricherMixin.generateCustomChange("true", 20, "system.attributes.movement.hover"),
          ],
        },
        {
          name: "See the Invisible",
          options: {
            durationSeconds: 600,
          },
          changes: [
            DDBEnricherMixin.generateUnsignedAddChange(";See Invisibility (60ft)", 1, "system.attributes.senses.special"),
          ],
          atlChanges: [
            DDBEnricherMixin.generateUpgradeChange("60", 20, "ATL.detectionModes.seeInvisibility.range"),
          ],
        },
        {
          name: "Wormlike Movement",
          options: {
            durationSeconds: 600,
          },
        },
      ],
    };
  }

}
