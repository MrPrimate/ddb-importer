import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchMaster extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Pact Slots",
      targetType: "self",
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "-@spells.pact.max",
          target: "spells.pact.value",
        },
      ],
    };
  }

}
