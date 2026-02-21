import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchMaster extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
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
