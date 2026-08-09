import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicalCunning extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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
