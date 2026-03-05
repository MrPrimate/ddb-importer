import ArcaneShotOption from "./ArcaneShotOption";

export default class SeekingArrow extends ArcaneShotOption {

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          critical: { allow: true },
          onSave: "half",
          parts: [
            SeekingArrow.basicDamagePart({
              customFormula: "@scale.arcane-archer.minor-damage",
              types: ["piercing"],
            }),
          ],
        },
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

}
