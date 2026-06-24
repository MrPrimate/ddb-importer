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

  get additionalActivities(): IDDBAdditionalActivity[] {
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
