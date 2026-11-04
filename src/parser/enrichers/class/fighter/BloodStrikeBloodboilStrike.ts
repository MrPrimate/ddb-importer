import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Bloodboil Strike: on a hit the target and every creature other than you within 10 feet of it
 * take 2d6 Fire damage (4d6 from fighter level 18) and start burning; that Fire damage ignores
 * Resistance to Fire damage. DDB's action carries a flat 4d6, so the damage is built here. The rule
 * matches the activity by name alone: an option document's identifier is only settled after its
 * effects are built.
 */
export default class BloodStrikeBloodboilStrike extends DDBEnricherData {

  static NAME = "Bloodboil Strike";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  // the option document shares this action's name, so keep DDB's shared Blood Strike action beside it
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Blood Strike"];
  }

  override get activity(): IDDBActivityData {
    return {
      name: BloodStrikeBloodboilStrike.NAME,
      activationType: "special",
      activationCondition: "You hit a creature: it and each other creature within 10 feet of it, other than you, start burning",
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: `(2 + 2 * floor(@classes.${this.classIdentifier("Fighter")}.levels / 18))d6`, types: ["fire"] })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect(BloodStrikeBloodboilStrike.NAME, "fire", {
      immunity: false,
      conditions: { k: "activity.name", o: "exact", v: BloodStrikeBloodboilStrike.NAME },
    });
  }

}
