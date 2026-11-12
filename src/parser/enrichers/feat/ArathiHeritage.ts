import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arathi Heritage (World of Warcraft origin feat): Fey Ancestry gives Advantage on saves to avoid or
 * end Charmed (AC5e, initial save only), and Lethargy Resilience turns a failed save against
 * Unconscious into a success once per 1d4 Long Rests. dnd5e recovery cannot roll a number of rests,
 * so the use is left for the player to restore.
 */
export default class ArathiHeritage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Lethargy Resilience",
      activationType: "special",
      activationCondition: "You fail a saving throw to avoid or end the Unconscious condition",
      targetType: "self",
      addItemConsume: true,
      data: {
        roll: { prompt: false, visible: true, formula: "1d4", name: "Long Rests Until Restored" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fey Ancestry",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Advantage on saving throws against the Charmed condition. Automated for the initial save only.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("riderStatuses.charmed", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
    ];
  }

}
