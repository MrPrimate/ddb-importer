import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The 2024 invocation grants the highest number on False Life's dice (2d4 + 4), so it is a flat
 * 12 Temporary Hit Points rather than a cast of the compendium spell, which would roll.
 */
export default class FiendishVigor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.CAST
      : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        addSpellUuid: "False Life",
        addItemConsume: false,
        data: {
          spell: {
            spellbook: true,
          },
        },
      };
    }
    return {
      name: "Cast False Life",
      activationType: "action",
      targetType: "self",
      noConsumeTargets: true,
      data: {
        range: {
          override: true,
          value: null,
          units: "self",
        },
        duration: {
          override: true,
          value: "1",
          units: "hour",
        },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "12", type: "temphp" }),
      },
    };
  }
}
