import DDBEnricherData from "../../data/DDBEnricherData";

export default class VigilantBlessing extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.customChange("1", 30, "flags.dnd5e.initiativeAdv"),
        ],
        daeSpecialDurations: ["Initiative"],
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: null,
          },
        },
      },
    ];
  }

}
