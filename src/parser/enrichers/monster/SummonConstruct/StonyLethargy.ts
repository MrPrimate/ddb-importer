import DDBEnricherData from "../../data/DDBEnricherData";

export default class StonyLethargy extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lethargic",
        daeSpecialDurations: ["turnStart" as const],
        options: {
          durationSeconds: 6,
          description: "Unable to make opportunity attacks",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
        ],
      },
    ];
  }

}
