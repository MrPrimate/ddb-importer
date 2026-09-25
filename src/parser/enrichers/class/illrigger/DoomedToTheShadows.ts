import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The larger Strike from the Dark dice are handled by that feature; this is the reaction that
 * burns a seal to blind instead of dealing the seal's damage.
 */
export default class DoomedToTheShadows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Blind",
      activationType: "reaction",
      activationCondition: "When you deal damage with Strike from the Dark, burn a seal on the creature instead of dealing its damage",
      targetType: "creature",
      targetCount: 1,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Doomed to the Shadows: Blinded",
        activityMatch: "Blind",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
