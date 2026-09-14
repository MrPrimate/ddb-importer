import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Actor (2024): Mimicry is a contested check, system standard is to model this as a check
 * activity where the listener rolls Insight against the actor's Charisma-based DC. Lives in
 * ActorFeat.ts (NAME_HINTS maps "Actor" here) because a barrel export named Actor would
 * shadow Foundry's global.
 */
export default class ActorFeat extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.CHECK : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2024) return null;
    return {
      name: "Mimicry",
      activationType: "special",
      activationCondition: "A creature that hears the mimicry can use its action to make an Insight check against your Deception",
      targetType: "creature",
      rangeSelf: true,
      data: {
        check: {
          ability: "",
          associated: ["ins"],
          dc: {
            calculation: "cha",
            formula: "",
          },
        },
      },
    };
  }

}
