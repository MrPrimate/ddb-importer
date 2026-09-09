import DDBEnricherData from "../data/DDBEnricherData";

export default class DisruptiveTune extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Disrupted Concentration",
        changes: [
          DDBEnricherData.ChangeHelper.rollModeChange("system.attributes.concentration.roll.mode", -1),
        ],
        options: {
          durationSeconds: 60,
          description: "Concentration is lost on the failed save; disadvantage on saves to maintain Concentration.",
        },
      },
    ];
  }

}
