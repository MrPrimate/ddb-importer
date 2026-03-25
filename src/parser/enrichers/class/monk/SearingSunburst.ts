import Generic from "../Generic";

export default class SearingSunburst extends Generic {

  get activity(): IDDBActivityData {
    if (!this.isAction) return null;
    return {
      activationType: "action",
      itemConsumeValue: 0,
      itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
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
              types: ["radiant"],
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            replaceActivityUses: true,
          },
        },
      },
    };
  }

}
