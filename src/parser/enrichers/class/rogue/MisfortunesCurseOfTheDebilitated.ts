import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheDebilitated extends Misfortune {

  override get jinxCost(): number {
    return 1;
  }

  override get type(): IDDBActivityType | null {
    return Misfortune.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "reaction",
      activationCondition: "A creature cursed by your Evil Eye takes damage",
      noTemplate: true,
      damageParts: [
        Misfortune.basicDamagePart({ number: 1, denomination: 12, type: "necrotic" }),
      ],
    };
  }

}
