import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmpoweredEvocation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.int.mod",
          types: DDBEnricherData.allDamageTypes(),
        }),
      ],
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Empowered Evocation: Damage Bonus",
        options: {
          transfer: true,
          disabled: true,
          description: "Adds your Intelligence modifier to one damage roll of a wizard evocation spell. The Damage activity is a manual fallback; using both applies the modifier twice.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@abilities.int.mod", {
            conditions: [
              DDBEnricherData.ChangeHelper.SPELL_FILTER,
              DDBEnricherData.ChangeHelper.classSpellFilter("wizard"),
              { k: "roll.item.school", o: "exact", v: "evo" },
            ],
          }),
        ],
      },
    ];
  }

}
