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
          activationCondition:
            "A creature within reach damages you. Roll with advantage; manually ignore its resistance and immunity for this attack.",
        },
      },
    ];
  }

}
