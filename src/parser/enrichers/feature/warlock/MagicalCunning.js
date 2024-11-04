/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class MagicalCunning extends DDBEnricherMixin {

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
