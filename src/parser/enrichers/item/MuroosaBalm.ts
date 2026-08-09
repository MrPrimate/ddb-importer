import DDBEnricherData from "../data/DDBEnricherData";

export default class MuroosaBalm extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      activationType: "minute",
      data: {
        duration: {
          value: "20",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
        ],
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
      },
    ];
  }

}
