import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorrowfulFate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you or an ally forces a saving throw: change it to a Charisma save; on a failure roll a Bardic Inspiration die",
      // once per short or long rest, and it also spends a Bardic Inspiration use
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "feat:bardic-inspiration",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.tragedy.sorrowful-fate",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Plagued with Regret",
        options: {
          durationSeconds: 60,
          description: "If reduced to 0 hit points while plagued with regret, the creature utters darkly poetic final words.",
        },
      },
    ];
  }

}
