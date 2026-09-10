import DDBEnricherData from "../../data/DDBEnricherData";

export default class InnateSorcery extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Innate Sorcery",
      useActivitySnippet: true,
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Innate Sorcery",
        options: {
          description: "+1 to spell save DC and advantage on Sorcerer spell attack rolls",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.bonuses.spell.dc"),
          // DDB restricts the advantage to "Sorcerer Spell Attacks": the rolled spell's class comes
          // through roll.item, so a multiclass wizard cantrip is left alone
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack", {
            conditions: [
              { k: "roll.attack.classification", o: "exact", v: "spell" },
              DDBEnricherData.ChangeHelper.classSpellFilter("sorcerer"),
            ],
          }),
        ],
      },
    ];
  }


  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Innate Sorcery",
      max: "2",
      period: "lr",
    });

    return {
      uses,
    };
  }

}
