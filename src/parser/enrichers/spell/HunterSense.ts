import DDBEnricherData from "../data/DDBEnricherData";

export default class HunterSense extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hunter Sense",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 20, "system.skills.prc.roll.min"),
        ],
      },
    ];
  }

}
