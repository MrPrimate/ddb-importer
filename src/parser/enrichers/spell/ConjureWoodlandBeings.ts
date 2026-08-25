import DDBEnricherData from "../data/DDBEnricherData";

export default class ConjureWoodlandBeings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: "Cast",
      targetType: "self",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbConjWoodBeSav",
          }),
        ],
        midiProperties: {
          autoTargetAction: "none",
          triggeredActivityId: "none",
          triggeredActivityTargets: "targets",
          triggeredActivityRollAs: "self",
          forceDialog: false,
          confirmTargets: "never",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    if (this.is2014) return null;
    return [
      {
        init: {
          name: "Save vs Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          generateSave: true,
          generateDuration: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            condition: "Enters or ends turn in emanation (1/turn only)",
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          rangeOverride: {
            value: "10",
            units: "ft",
          },
        },
        overrides: {
          id: "ddbConjWoodBeSav",
          targetType: "creature",
          overrideTemplate: true,
          noTemplate: true,
          data: {
            midiProperties: {
              autoTargetAction: "none",
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              forceDialog: false,
              confirmTargets: "never",
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    return {
      data: {
        system: {
          target: {
            template: {
              type: "radius",
            },
          },
        },
        "midi-qol": {
          autoTarget: "none",
        },
      },
    };
  }
}
