import DDBEnricherData from "../data/DDBEnricherData";

export default class MindSliver extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
        daeSpecialDurations: ["isSave" as const],
      },
    ];
  }

}
