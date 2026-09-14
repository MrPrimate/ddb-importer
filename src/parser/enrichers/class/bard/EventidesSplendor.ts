import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Eventide's Splendor (College of the Moon, 2024). DDB ships the Vibrance of the Full Moon heal;
 * the official compendium adds Shadow of the New Moon (the bard and the inspired creature turn
 * Invisible until the start of the bard's next turn) and Lunar Vitality (spend a Bardic
 * Inspiration die to heal that much extra and grant +10 feet of speed).
 */
export default class EventidesSplendor extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Shadow of the New Moon",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you take a Bonus Action to give a creature a Bardic Inspiration die",
          },
          durationOverride: {
            value: "1",
            units: "round",
          },
          targetOverride: {
            affects: {
              count: "2",
              type: "creature",
              choice: false,
              special: "You and the inspired creature",
            },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 30,
        },
      },
      {
        init: {
          name: "Lunar Vitality",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you restore Hit Points to a creature with a spell, expend a Bardic Inspiration die",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.bard.inspiration",
            types: ["healing"],
          }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
        overrides: {
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeTargetName: "Bardic Inspiration",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Shadow of the New Moon: Invisible",
        activityMatch: "Shadow of the New Moon",
        statuses: ["Invisible"],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
      },
      {
        name: "Lunar Vitality",
        activityMatch: "Lunar Vitality",
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10"),
        ],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
      },
    ];
  }

}
