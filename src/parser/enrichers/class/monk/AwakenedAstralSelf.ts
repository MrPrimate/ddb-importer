import DDBEnricherData from "../../data/DDBEnricherData";

export default class AwakenedAstralSelf extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Armor of the Spirit",
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
