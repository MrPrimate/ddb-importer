import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

export default class ImpalingShot extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Impaling Shot",
      ..._Illrigger.sealConsume(),
      activationType: "bonus",
      activationCondition: "When you hit an interdicted creature with a ranged weapon attack",
      targetType: "creature",
      targetCount: 1,
      rangeType: "any",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Impaled",
        activityMatch: "Impaling Shot",
        options: {
          expiry: "sourceEnd",
        },
        changes: [
          _Illrigger.originChange(
            DDBEnricherData.ChangeHelper.addChange("-@prof", 20, "system.attributes.ac.bonus"),
          ),
        ],
      },
    ];
  }

}
