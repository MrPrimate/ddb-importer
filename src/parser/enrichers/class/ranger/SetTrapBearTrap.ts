import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trapper ranger, "Set Trap: Bear Trap (Physical)". "Deploy Bear Trap" (the
 * parsed activity) places the 5 ft square the trap occupies; the region fires
 * the parsed "Bear Trap: Damage" save for a Large or smaller creature entering
 * it. A physical trap is spent when it activates, so the GM deletes the region
 * after the first trigger.
 */
export default class SetTrapBearTrap extends DDBEnricherData {

  /**
   * The trap sub-feature may parse with no activity of its own (Snapfrost, Bear
   * Trap), so the placer is forced. The trigger region fires the trap's own
   * class action by name, so that action is pulled onto this document.
   */
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Deploy Bear Trap",
      useActivitySnippet: true,
      addItemConsume: true,
      targetType: "creature",
      activationCondition: "The trap is spent once it activates: remove the region",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "square",
            size: "5",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenMoveIn"],
            activityName: "Bear Trap: Damage",
            sizes: ["tiny", "sm", "med", "lg"],
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Bear Trap: Damage",
          type: "class",
        },
      },
    ];
  }

}
