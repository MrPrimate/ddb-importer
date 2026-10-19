import DDBEnricherData from "../../data/DDBEnricherData";

export default class HandOfHealing extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Hand of Healing",
      // "As a Magic action" (an action in 2014); the Flurry of Blows replacement is used from Flurry
      activationType: "action",
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
