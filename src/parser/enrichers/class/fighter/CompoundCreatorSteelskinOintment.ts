import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorSteelskinOintment extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Steelskin Ointment",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

}
