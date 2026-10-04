import DDBEnricherData from "../../data/DDBEnricherData";

/** Barrow Guard Mortal Coil: a Reaction to an enemy (not a Construct or Undead) dying within 30 feet regains one Draugr Die. */
export default class SiphoningSoulsMortalCoil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "An enemy that isn't a Construct or Undead dies within 30 feet",
      addItemConsume: true,
      itemConsumeTargetName: "death-knight",
      itemConsumeValue: "-1",
    };
  }

}
