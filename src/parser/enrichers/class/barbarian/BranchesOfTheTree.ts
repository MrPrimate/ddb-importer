import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the World Tree: the parsed reaction save is the primary; "Branches
 * Aura" places a 30-foot emanation on the raging barbarian whose region offers
 * the reaction when a creature starts its turn inside. The teleport and the
 * optional speed 0 are manual.
 */
export default class BranchesOfTheTree extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Branches of the Tree",
      activationType: "reaction",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            count: "1",
          },
        },
        range: {
          value: "30",
          units: "ft",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Branches Aura",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "While your Rage is active",
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
            range: {
              override: true,
              units: "self",
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenTurnStart"],
                activityName: "Branches of the Tree",
                excludeSelf: true,
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
        name: "Branches of the Tree: Rooted",
        activityMatch: "Branches of the Tree",
        // expiry only, as Sentinel's Halted: "until the end of the current turn"
        options: {
          transfer: false,
          expiry: "turnEnd",
          description: "Speed 0 until the end of the current turn (optional, after the teleport).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange(0),
        ],
      },
    ];
  }

}
