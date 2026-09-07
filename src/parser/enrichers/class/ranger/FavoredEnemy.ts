import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The DDB data turns this into a direct damage activity spending a charge,
 * which is wrong: the feature grants free casts of Hunter's Mark.
 */
export default class FavoredEnemy extends DDBEnricherData {

  override get stopDefaultActivity(): boolean {
    return this.is2014 ? false : true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
