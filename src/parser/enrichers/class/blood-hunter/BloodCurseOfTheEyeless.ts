import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodCurse from "./_BloodCurse";

export default class BloodCurseOfTheEyeless extends _BloodCurse {

  get curseName(): string {
    return "Blood Curse of the Eyeless";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      targetCount: 1,
      activationType: "reaction",
      activationCondition: "A creature you can see within 30 feet of you makes an attack, and is not immune to the blinded condition",
      data: {
        roll: {
          name: "Hemocraft Die",
          formula: _BloodCurse.DIE,
          prompt: false,
          visible: true,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: this.amplifiedName,
          activationCondition: `A creature you can see within 30 feet of you makes an attack, and is not immune to the blinded condition. ${_BloodCurse.AMPLIFY_CONDITION}. Roll separately for each of the creature's attack rolls until the end of its turn.`,
        },
      },
      this.amplifyCostActivity,
    ];
  }

}
