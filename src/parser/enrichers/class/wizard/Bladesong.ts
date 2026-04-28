import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bladesong extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Activate Bladesong",
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.concentration.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.acr.roll.mode"),
        ],
      },
    ];
  }

}
