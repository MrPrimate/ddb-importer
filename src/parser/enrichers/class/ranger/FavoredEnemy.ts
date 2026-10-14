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
          // Hunter's Mark's own casting time; the cast activity owns its activation
          activationType: "bonus",
          addItemConsume: true,
          addSpellUuid: "Hunter's Mark",
          data: {
            spell: {
              spellbook: true,
            },
          },
        },
      },
    ];
  }

  // DDB's maxUses is the count at the build's current level; its levelScales back a class scale
  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Favored Enemy",
        max: "@scale.ranger.favored-enemy",
        period: "lr",
      }),
    };
  }

}
