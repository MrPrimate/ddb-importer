import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The bears roll their save against each enemy as the cube appears, then again for one that
 * enters it or ends its turn there: the second is a free copy of the cast with no slot and no
 * template, rolled by hand. Moving the cube 40 feet is a Bonus Action, and the save it forces on
 * creatures it moves onto is the same free roll.
 */
export default class Bearstormer extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbBearstormSpSv",
      targetType: "enemy",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbBearstormZon1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "An enemy enters the cube or ends its turn there, or the cube moves into its space (once per turn)",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: { override: true, units: "spec" },
            target: { override: true },
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // unmatched, so both the cast and its ongoing copy carry it
        name: "Frightened",
        statuses: ["Frightened"],
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Frightened until the end of its next turn.",
        },
      },
    ];
  }

}
