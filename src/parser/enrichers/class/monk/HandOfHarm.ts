import DDBEnricherData from "../../data/DDBEnricherData";

export default class HandOfHarm extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hand of Harm",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die.die + @abilities.wis.mod",
              type: "necrotic",
            }),
          ],
        },
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
