import DDBEnricherData from "../data/DDBEnricherData";

export default class MindSliver extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
        daeSpecialDurations: ["isSave"],
        // "subtract 1d4 from the next saving throw it makes before the end of your next turn"
        options: { expiry: "sourceEnd" },
      },
    ];
  }

}
