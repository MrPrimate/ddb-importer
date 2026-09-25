import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * The Architect of Ruin's two Invoke Hell options, built from DDB's actions. Both spend the
 * shared Invoke Hell use; Enervating Spell also expends a seal.
 */
export default class InvokeHellArchitectOfRuin extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Invoke Hell: Enervating Spell", type: "class", rename: ["Enervating Spell"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          additionalConsumptionTargets: [_Illrigger.sealConsumeTarget()],
          activationType: "special",
          activationCondition: "When you deal damage to a creature with an illrigger spell of 1st level or higher",
          targetType: "creature",
          targetCount: 1,
        },
      },
      {
        action: { name: "Invoke Hell: Spellblade", type: "class", rename: ["Spellblade"] },
        overrides: {
          ..._Illrigger.invokeHellConsume(),
          activationType: "action",
          targetType: "self",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enervated",
        activityMatch: "Enervating Spell",
        options: {
          description: "Vulnerable to the damage of the illrigger's spell; resistance or immunity to it is suppressed for that spell.",
          durationSeconds: 6,
        },
      },
    ];
  }

}
