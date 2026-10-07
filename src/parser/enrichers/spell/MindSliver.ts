import DDBEnricherData from "../data/DDBEnricherData";

export default class MindSliver extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // "subtract 1d4 from the next saving throw it makes before the end of your next turn"
    return [
      {
        name: "Mind Sliver",
        ac5eOnly: true,
        options: { expiry: "sourceEnd" },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("bonus=-1d4; once", 20, "flags.automated-conditions-5e.save.bonus"),
        ],
      },
      {
        name: "Mind Sliver",
        ac5eNever: true,
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
        daeSpecialDurations: ["isSave"],
        options: { expiry: "sourceEnd" },
      },
    ];
  }

}
