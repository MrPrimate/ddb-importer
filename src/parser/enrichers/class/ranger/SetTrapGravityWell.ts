import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trapper ranger, "Set Trap: Gravity Well (Magical)". "Create Magical Trap"
 * (the parsed activity) places the 5 ft marker; "Trigger Magical Trap" places
 * the 30-foot well: difficult terrain plus the parsed "Gravity Well: Damage"
 * Strength save for creatures that start their turn inside. The activation
 * burst ("Activate Gravity Well") and the end-of-next-turn "Critical Mass" are
 * the ranger's own rolls.
 */
export default class SetTrapGravityWell extends DDBEnricherData {

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
          name: "Activate Gravity Well",
          type: "class",
        },
      },
      {
        action: {
          name: "Gravity Well: Damage",
          type: "class",
        },
      },
      {
        action: {
          name: "Gravity Well: Critical Mass",
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
            condition: "The trap is triggered; the well lasts until the end of your next turn",
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
              size: "30",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            duration: {
              override: true,
              value: "1",
              units: "round",
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.difficultTerrain(),
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenTurnStart"],
                activityName: "Gravity Well: Damage",
              }),
            ],
          },
        },
      },
    ];
  }

}
