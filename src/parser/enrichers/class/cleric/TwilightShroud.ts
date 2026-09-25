import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Twilight Shroud (Twilight Domain, 2014): allies in the Twilight Sanctuary have half cover.
 * Models the cover as +2 AC and +2 Dexterity saves until the start of
 * the cleric's next turn; the half-cover status carries the same in the dnd5e rules.
 */
export default class TwilightShroud extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shroud Allies",
      activationType: "special",
      activationCondition: "While your Channel Divinity: Twilight Sanctuary is active",
      targetType: "ally",
      rangeSelf: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shrouded",
        activityMatch: "Shroud Allies",
        statuses: ["coverHalf"],
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          expiry: "sourceStart",
        },
      },
    ];
  }

}
