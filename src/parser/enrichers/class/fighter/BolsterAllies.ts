import DDBEnricherData from "../../data/DDBEnricherData";

/** Bolstering Presence: at the start of your turn (no action), chosen creatures within 30 feet regain 2d6 + half your fighter level. */
export default class BolsterAllies extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "turnStart",
      activationCondition: "Start of your turn (no action required; not while Incapacitated)",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        target: { override: true, affects: { type: "ally", choice: true } },
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "floor(@classes.fighter.levels / 2)", types: ["healing"] }),
      },
    };
  }

}
