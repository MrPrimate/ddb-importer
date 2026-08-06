import DDBEnricherData from "../../data/DDBEnricherData";

export default class Frostbite extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    // the same-named DDB action loads this enricher too and its effect is
    // cloned onto the feature; only emit on the action side to avoid a dupe
    if (!this.isAction) return [];
    return [
      {
        name: "Frostbitten",
        activityMatch: "Frostbite",
        options: {
          description: "Speed reduced by 10 feet until the start of the barbarian's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
