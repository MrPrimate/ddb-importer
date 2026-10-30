import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Bloody Fiddle: the Sanguine Curse deals 1 Slashing damage the first time you play the fiddle
 * after a Long Rest, 2 once you have used Song of Stirred Blood, and that damage ignores
 * Resistance. DDB carries both amounts as one activity's damage parts, so each is its own activity.
 */
export default class BloodyFiddle extends DDBEnricherData {

  static FIRST_PLAY = "The first time you play the fiddle after a Long Rest";

  static curseDamage(amount: number): I5eDamagePart[] {
    return [DDBEnricherData.basicDamagePart({ customFormula: `${amount}`, types: ["slashing"] })];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sanguine Curse",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: BloodyFiddle.FIRST_PLAY,
      noConsumeTargets: true,
      data: {
        damage: { parts: BloodyFiddle.curseDamage(1) },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Sanguine Curse (After Song)", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        selfTarget: true,
        condition: `${BloodyFiddle.FIRST_PLAY}, once you have used Song of Stirred Blood`,
        damageParts: BloodyFiddle.curseDamage(2),
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Bloody Fiddle: Sanguine Curse", "slashing", {
      immunity: false,
      conditions: this.selfIdentifierFilter,
    });
  }

}
