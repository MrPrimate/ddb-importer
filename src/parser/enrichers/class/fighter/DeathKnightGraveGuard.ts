import DDBEnricherData from "../../data/DDBEnricherData";

/** Barrow Guard Grave Guard: a Reaction to damage spends a Draugr Die to reduce the damage by its roll plus your Constitution modifier. */
export default class DeathKnightGraveGuard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You take damage",
      addItemConsume: true,
      itemConsumeTargetName: "death-knight",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.barrow-guard.death-knight + @abilities.con.mod",
          name: "Damage Reduction",
        },
      },
    };
  }

}
