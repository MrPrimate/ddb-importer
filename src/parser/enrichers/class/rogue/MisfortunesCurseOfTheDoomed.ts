import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheDoomed extends Misfortune {

  override get jinxCost(): number {
    return 1;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "You miss with an attack roll against a creature cursed by your Evil Eye",
    };
  }

}
