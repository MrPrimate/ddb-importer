import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorrowfulFate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you or an ally forces a saving throw: change it to a Charisma save; on a failure roll a Bardic Inspiration die",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
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

  get effects(): IDDBEffectHint[] {
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
