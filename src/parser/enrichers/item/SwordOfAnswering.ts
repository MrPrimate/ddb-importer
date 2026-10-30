import DDBEnricherData from "../data/DDBEnricherData";

export default class SwordOfAnswering extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbAnswerAttack1",
        overrides: {
          name: "Attack Reaction",
          activationType: "reaction",
          noConsumeTargets: true,
          activationCondition: DDBEnricherData.hasDamageRules
            ? "A creature within reach damages you. Roll with advantage."
            : "A creature within reach damages you. Roll with advantage; manually ignore its resistance and immunity for this attack.",
        },
      },
    ];
  }

  // any damage dealt with the reaction attack ignores the target's Immunity and Resistance
  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Sword of Answering: Answering Strike", "ALL", {
      conditions: this.selfActivityFilter("Attack Reaction"),
    });
  }

}
