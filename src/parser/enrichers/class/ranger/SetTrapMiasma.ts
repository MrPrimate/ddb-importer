import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trapper ranger, "Set Trap: Miasma (Magical)". Split into two steps:
 * - "Create Magical Trap" (the parsed activity, keeps its itemUses consumption)
 *   places a plain 5x5 ft template marking the untriggered trap - no behaviors.
 * - "Trigger Magical Trap" (no consumption) places the 20-foot-radius gas cloud
 *   whose region fires the parsed "Activate Miasma" save on enter/turn start:
 *   3d6 poison half on success, poisoned until the start of its next turn on a
 *   failure. The gas lasts 1 minute.
 */
export default class SetTrapMiasma extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Create Magical Trap",
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
                activityName: "Activate Miasma",
              }),
            ],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Miasma Poison",
        activityMatch: "Activate Miasma",
        statuses: ["Poisoned"],
        // "poisoned until the start of its next turn"
        daeSpecialDurations: ["turnStart"],
        options: {
          description: "Poisoned until the start of its next turn; disadvantage on saving throws to maintain concentration while poisoned this way.",
        },
      },
    ];
  }

}
