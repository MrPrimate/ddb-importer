import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbsorbSpells extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Regain Sorcery Points",
      activationType: "special",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          value: "-1d4",
          target: "sorcery-points",
          scaling: { allowed: false, max: "" },
        },
      ],
    };
  }

}
