import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Eventide's Splendor (College of the Moon, 2024). DDB ships the Vibrance of the Full Moon heal;
 * the enricher adds Shadow of the New Moon (the inspired creature also turns Invisible and
 * teleports, staying Invisible until the start of its own next turn) and Lunar Vitality (spend a
 * Bardic Inspiration die to heal that much extra, and the healed creature's Speed rises by 10 feet
 * until the end of its next turn).
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
              count: "1",
              type: "creature",
              choice: false,
              special: "The creature who received the Bardic Inspiration die",
            },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
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
        options: {
          // "remains Invisible until the start of its next turn": the inspired creature's turn
          expiry: "targetStart",
        },
      },
      {
        name: "Lunar Vitality",
        activityMatch: "Lunar Vitality",
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10"),
        ],
        options: {
          // "Speed also increases by 10 feet until the end of its next turn": the healed creature's turn
          expiry: "targetEnd",
        },
      },
    ];
  }

}
