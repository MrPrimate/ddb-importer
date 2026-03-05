import DDBEnricherData from "../../data/DDBEnricherData";

export default class VigilantBlessing extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.customChange("1", 30, "flags.dnd5e.initiativeAdv"),
        ],
        daeSpecialDurations: ["Initiative" as const],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
    ];
  }

}
