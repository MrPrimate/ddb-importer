import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.fey-wanderer.dreadful-strikes", types: ["psychic"] })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dreadful Strikes (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional extra damage on a weapon attack hit. The once per turn approximates the once per target per turn rule.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.fey-wanderer.dreadful-strikes[psychic]; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
