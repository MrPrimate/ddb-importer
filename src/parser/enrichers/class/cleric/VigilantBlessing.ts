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
          DDBEnricherData.ChangeHelper.advantageInitiativeChange(30),
        ],
        daeSpecialDurations: ["Initiative" as const],
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
