import DDBEnricherData from "../../data/DDBEnricherData";

export default class MagicCoin extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.ATTACK : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      data: {
        attack: {
          ability: "cha",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        range: {
          value: 60,
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1",
              types: ["bludgeoning"],
            }),
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.mercantile.magic-coin",
              types: ["thunder"],
            }),
          ],
        },
      },
    };
  }

}
