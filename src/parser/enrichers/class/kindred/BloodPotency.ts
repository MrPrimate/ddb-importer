import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Potency is the Kindred's resource pool (Blood Points, scaling 1-11).
 * Points are regained by feeding, not by resting, so no recovery is set.
 * The spender actions are pulled on as activities consuming this pool.
 */
export default class BloodPotency extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Blood Potency: Heal Wounds",
          type: "class",
          rename: ["Heal Wounds"],
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        action: {
          name: "Blood Potency: Hunger Sated",
          type: "class",
          rename: ["Hunger Sated"],
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.kindred.blood-points",
            // points return via feeding, not rests; clear the junk default
            // recovery generated from DDB resetType 4
            recovery: [],
          },
        },
      },
    };
  }

}
