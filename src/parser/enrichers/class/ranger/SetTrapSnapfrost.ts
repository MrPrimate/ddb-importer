import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trapper ranger, "Set Trap: Snapfrost (Magical)". Same split as Miasma:
 * "Create Magical Trap" (the parsed activity, keeps its uses) places the 5 ft
 * marker; "Trigger Magical Trap" places the 20-foot-radius frigid cloud whose
 * region fires the parsed "Activate Snapfrost" save on enter/turn start for the
 * minute it lasts.
 */
export default class SetTrapSnapfrost extends DDBEnricherData {

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
      name: "Create Magical Trap",
      useActivitySnippet: true,
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: {},
          template: {
            count: "1",
            contiguous: false,
            type: "square",
            size: "5",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Activate Snapfrost",
          type: "class",
        },
      },
      {
        init: {
          name: "Trigger Magical Trap",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "The trap is triggered",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {
              count: "1",
              contiguous: false,
              type: "radius",
              size: "20",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            duration: {
              override: true,
              value: "1",
              units: "minute",
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenEnter", "tokenTurnStart"],
                activityName: "Activate Snapfrost",
              }),
            ],
          },
        },
      },
    ];
  }

}
