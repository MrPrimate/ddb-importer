import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheMaimed extends Misfortune {

  override get jinxCost(): number {
    return 2;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "You roll a 19 on an attack against a creature cursed by your Evil Eye",
    };
  }

}
