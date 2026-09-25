import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Painkiller's two Invoke Hell options, built from DDB's actions. Both spend the shared
 * Invoke Hell use. Punishment returns the damage the attacker dealt, which only the table knows,
 * so its damage stays manual.
 */
export default class InvokeHellPainkiller extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Invoke Hell: Grand Strategist", type: "class", rename: ["Grand Strategist"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "special",
          activationCondition: "No action required",
          targetType: "ally",
          targetCount: "@prof",
          rangeType: "ft",
          rangeValue: 60,
        },
      },
      {
        action: { name: "Invoke Hell: Punishment", type: "class", rename: ["Punishment"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "reaction",
          activationCondition: "When a creature damages you with an attack. It takes necrotic damage equal to the damage it dealt, or half on a success.",
          targetType: "creature",
          targetCount: 1,
          data: {
            save: {
              ability: ["wis"],
              dc: _Illrigger.INTERDICT_DC,
            },
          },
        },
      },
    ];
  }

}
