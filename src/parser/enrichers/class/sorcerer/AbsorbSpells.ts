import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbsorbSpells extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Sorcery Points",
      activationType: "special",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          value: "-1d4",
          target: "feat:sorcery-points",
          scaling: { allowed: false, max: "" },
        },
      ],
    };
  }

}
