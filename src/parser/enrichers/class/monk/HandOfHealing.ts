import DDBEnricherData from "../../data/DDBEnricherData";

export default class HandOfHealing extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hand of Healing",
      activationType: "special",
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

  override get override(): IDDBOverrideData {
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
