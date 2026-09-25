import DDBEnricherData from "../data/DDBEnricherData";

export default class ZoneOfAmicability extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Zone of Amicability",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.abilities.cha.check.roll.min"),
        ],
        options: { durationSeconds: 600, description: "Treat a d20 roll of 9 or lower as a 10 on checks to influence a creature in the Emanation." },
      },
    ];
  }

}
