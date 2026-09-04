import DDBEnricherData from "../data/DDBEnricherData";

export default class ZoneOfAmicability extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Zone of Amicability",
        changes: [
          DDBEnricherData.ChangeHelper.ruleChange({
            category: "check",
            type: "dnd5e.minimum",
            value: "10",
            conditions: { k: "roll.ability", o: "exact", v: "cha" },
          }),
        ],
        options: { durationSeconds: 600, description: "Treat a d20 roll of 9 or lower as a 10 on checks to influence a creature in the Emanation." },
      },
    ];
  }

}
