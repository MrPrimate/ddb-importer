import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Insect Cloud: one charge fills a 30-foot emanation on the wielder with harmless insects for 10
 * minutes (heavily obscured for everyone else). The spells arrive as cast activities from DDB.
 */
export default class StaffOfSwarmingInsects extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Insect Cloud", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          activationOverride: { type: "action", value: 1, condition: "" },
          generateDuration: true,
          durationOverride: { value: "10", units: "minute" },
          generateRange: true,
          rangeOverride: { units: "self" },
          generateTarget: true,
          targetOverride: {
            affects: { type: "", choice: false, special: "Heavily obscured for creatures other than you" },
            template: { count: "1", contiguous: false, type: "radius", size: "30", units: "ft" },
          },
          generateConsumption: false,
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

}
