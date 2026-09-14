import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Mighty Swarm (Swarmkeeper, 2014). The Gathered Swarm damage increase is handled by that
 * feature's scale link; this covers the other two upgrades: the swarm knocks a moved target
 * prone (Strength save) and gives the ranger half cover when it moves them.
 */
export default class MightySwarm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Knock Prone",
      activationType: "special",
      activationCondition: "After you hit a creature with an attack and your Gathered Swarm moves it",
      targetType: "creature",
      targetCount: 1,
      rangeSelf: true,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Swarm Protection",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "After your Gathered Swarm moves you",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Swarmed: Prone",
        activityMatch: "Knock Prone",
        statuses: ["Prone"],
      },
      {
        name: "Swarm Protection",
        activityMatch: "Swarm Protection",
        statuses: ["coverHalf"],
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
