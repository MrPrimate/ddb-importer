import DDBEnricherData from "../../data/DDBEnricherData";

export default class CompoundCreatorPrestoPowder extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Presto Powder",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 600,
          description: "You have Advantage on Initiative rolls and can take the Dash or Disengage action as a Bonus Action.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.init.roll.mode"),
        ],
      },
    ];
  }

}
