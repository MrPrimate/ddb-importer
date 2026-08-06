import DDBEnricherData from "../../data/DDBEnricherData";

export default class AidNotGivenHeal extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Aid Not Given: Heal",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "touch",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @abilities.wis.mod",
          type: "healing",
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
