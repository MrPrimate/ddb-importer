import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Hellspeaker's two Invoke Hell options, built from DDB's actions. Both spend the shared
 * Invoke Hell use.
 */
export default class InvokeHellHellspeaker extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Invoke Hell: Honey-Sweet Blades", type: "class", rename: ["Honey-Sweet Blades"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "special",
          activationCondition: "When you make a weapon attack against an interdicted creature: gain advantage, and a hit becomes a critical hit",
          targetType: "self",
        },
      },
      {
        action: { name: "Invoke Hell: Turncoat", type: "class", rename: ["Turncoat"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "action",
          targetType: "enemy",
          targetCount: "@prof",
          rangeType: "ft",
          rangeValue: 60,
          data: {
            save: {
              ability: ["cha"],
              dc: _Illrigger.INTERDICT_DC,
            },
          },
        },
      },
    ];
  }

}
