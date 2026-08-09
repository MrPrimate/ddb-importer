import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorceryIncarnate extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Restore Innate Sorcery Use",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Sorcery Points",
          value: "2",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "Innate Sorcery",
          value: "-1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
