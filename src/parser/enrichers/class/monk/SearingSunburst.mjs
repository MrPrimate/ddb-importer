/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class SearingSunburst extends Generic {

  get activity() {
    if (!this.isAction) return null;
    return {
      activationType: "action",
      itemConsumeValue: 0,
      itemConsumeTargetName: "Ki",
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        consumption: {
          spellSlot: true,
          scaling: {
            allowed: true,
            max: "4",
          },
        },
        damage: {
          parts: [
            Generic.basicDamagePart({
              customFormula: "(1 + @scaling)d6",
              typees: ["radiant"],
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.replaceActivityUses": true,
      },
    };
  }

}
