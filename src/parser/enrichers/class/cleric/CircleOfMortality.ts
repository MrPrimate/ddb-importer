import DDBEnricherData from "../../data/DDBEnricherData";

export default class CircleOfMortality extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Spare the Dying",
      activationType: "bonus",
      data: {
        activation: {
          override: true,
        },
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // Pull of Death is the 2024 feature's; the 2014 (XGtE) Circle of Mortality has no such action
    if (this.is2014) return [];
    return [
      {
        action: {
          name: "Pull of Death",
          type: "class",
        },
      },
    ];
  }
}
