import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class HellishFrenzy extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hellish Frenzy",
      ..._Illrigger.sealConsume(),
      activationType: "special",
      activationCondition: "When you start your turn within 30 feet of an interdicted creature",
      targetType: "self",
      rangeSelf: true,
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hellish Frenzy",
        activityMatch: "Hellish Frenzy",
        options: {
          description: "Your speed is doubled, you have a +2 bonus to AC, and you can make an extra weapon attack when you take the Attack action.",
          expiry: "turnStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange(2),
          DDBEnricherData.ChangeHelper.addChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
