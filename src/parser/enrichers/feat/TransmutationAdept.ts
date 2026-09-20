import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Magical Augmentation raises Speed by five feet per level of the
 * Transmutation spell's slot until the end of the turn. An applied effect cannot read the slot
 * level here, so there is one effect per slot level to pick from on the chat card.
 */
export default class TransmutationAdept extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Magical Augmentation",
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn when you cast a Transmutation spell using a spell slot",
      noConsumeTargets: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((level): IDDBEffectHint => ({
      name: `Magical Augmentation: Level ${level} Slot`,
      activityMatch: "Magical Augmentation",
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${5 * level}`, 20, "system.attributes.movement.walk"),
      ],
      options: {
        durationSeconds: null,
        expiry: "turnEnd",
        description: `Speed increased by ${5 * level} feet (5 feet per level of the spell slot expended) until the end of the turn.`,
      },
    }));
  }

}
