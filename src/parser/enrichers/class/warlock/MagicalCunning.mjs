/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MagicalCunning extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    const isEldritchMaster = this.hasClassFeature({
      featureName: "Eldritch Master",
      className: "Warlock",
      subClassName: "Fiend Patron",
    });
    return {
      name: "Regain Pact Slots",
      targetType: "self",
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: isEldritchMaster ? "-@spells.pact.max" : "-(ceil(@spells.pact.max / 2))",
          target: "spells.pact.value",
        },
      ],
    };
  }

}
