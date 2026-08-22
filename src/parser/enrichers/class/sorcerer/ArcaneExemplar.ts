import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneExemplar extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Expend a charged Essence Rune; extend at end of turn by expending another",
      addItemConsume: true,
      itemConsumeTargetName: "Essence Runes",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Exemplar Form",
        options: {
          durationRounds: 1,
          description: "Flying speed 60 ft; resistance to damage dealt by spells; creatures have disadvantage on saving throws against your sorcerer spells; you regain hit points equal to the spell's level when you cast a spell of 1st level or higher. When the form ends you are stunned until the end of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("Damage dealt by spells", 20, "system.traits.dr.custom"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Arcane Exemplar",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
