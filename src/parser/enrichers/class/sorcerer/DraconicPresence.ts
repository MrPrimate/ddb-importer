import DDBEnricherData from "../../data/DDBEnricherData";

const SAVE_ACTIVITIES = [
  { label: "Awe", status: "Charmed", id: "ddbDracPresAweSv" },
  { label: "Fear", status: "Frightened", id: "ddbDracPresFrSv1" },
] as const;

/**
 * Draconic Bloodline (2014) level 18: an action and 5 sorcery points exude a
 * 60-foot aura of awe or fear for a minute of concentration. Each choice is its
 * own cast activity whose emanation fires the matching save on hostile creatures
 * that start their turn inside; the effect lasts until the aura ends and a
 * creature that succeeds is immune for 24 hours (manual).
 */
export default class DraconicPresence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  static castData(label: string): IDDBActivityData {
    return {
      name: `Draconic Presence: ${label}`,
      targetType: "enemy",
      activationType: "action",
      activationCondition: "Hostile creatures starting their turn in the aura; lasts 1 minute (concentration)",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: `${label} Save`,
            excludeSelf: true,
          }),
        ],
        range: {
          units: "self",
        },
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "60",
            units: "ft",
          },
        },
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get activity(): IDDBActivityData {
    return DraconicPresence.castData(SAVE_ACTIVITIES[0].label);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const [, fear] = SAVE_ACTIVITIES;
    return [
      {
        duplicate: true,
        id: "ddbDracPresFear1",
        overrides: DraconicPresence.castData(fear.label),
      },
      ...SAVE_ACTIVITIES.map(({ label, id }): IDDBAdditionalActivity => ({
        id,
        init: {
          name: `${label} Save`,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          activationOverride: {
            type: "special",
            condition: "Hostile creature starts its turn in the aura",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "spec",
            },
          },
        },
      })),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return SAVE_ACTIVITIES.map(({ label, status }): IDDBEffectHint => ({
      name: `Draconic Presence: ${label}`,
      activityMatch: `${label} Save`,
      statuses: [status],
      options: {
        durationSeconds: 60,
        description: `${status} until the aura ends. A creature that succeeds on the save is immune to the aura for 24 hours.`,
      },
    }));
  }

}
