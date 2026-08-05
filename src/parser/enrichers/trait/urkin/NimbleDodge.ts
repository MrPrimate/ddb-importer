import DDBEnricherData from "../../data/DDBEnricherData";

export default class NimbleDodge extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you are hit by an attack roll",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Nimble Dodge",
        options: {
          description: "Add your Proficiency Bonus to your AC against the triggering attack.",
        },
        daeSpecialDurations: ["isAttacked"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@prof", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
