import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The DDB data turns this into a direct damage activity spending a charge,
 * which is wrong: the feature grants free casts of Hunter's Mark.
 */
export default class FavoredEnemy extends DDBEnricherData {

  get stopDefaultActivity() {
    return this.is2014 ? false : true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014 ? [] : [
      {
        init: {
          name: "Hunter's Mark",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          activationType: "action",
          addItemConsume: true,
          addSpellUuid: "Hunter's Mark",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
    ];
  }

}
