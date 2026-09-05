import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheInept extends Misfortune {

  override get jinxCost(): number {
    return 1;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye makes a D20 Test",
    };
  }

}
