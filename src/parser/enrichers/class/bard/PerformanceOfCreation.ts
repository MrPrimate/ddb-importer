import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Performance of Creation (College of Creation, 2014): one free use per long rest from the DDB
 * action, plus the official second activity that spends a level 2+ spell slot for another use.
 */
export default class PerformanceOfCreation extends DDBEnricherData {

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
          name: "Use with Spell Slot",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateDuration: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          durationOverride: {
            value: "@prof",
            units: "hour",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "space",
              choice: false,
              special: "",
            },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 10,
          addSpellSlotConsume: true,
          spellSlotConsumeTarget: "2",
          spellSlotConsumeValue: 1,
        },
      },
    ];
  }

}
