import DDBEnricherData from "../../data/DDBEnricherData";

export default class CircleOfMortality extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
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
