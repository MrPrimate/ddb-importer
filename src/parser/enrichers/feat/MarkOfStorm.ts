import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dragonmark. Gust of Wind becomes castable once per long rest from the mark
 * itself, from 3rd level.
 */
export default class MarkOfStorm extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Gust of Wind",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Gust of Wind",
          data: {
            visibility: {
              level: {
                min: 3,
                max: null,
              },
            },
            spell: {
              spellbook: true,
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
