import ArcaneShotOption from "./ArcaneShotOption";

export default class PiercingArrow extends ArcaneShotOption {

  get activity() {
    return {
      data: {
        damage: {
          critical: { allow: true },
          onSave: "half",
          parts: [
            PiercingArrow.basicDamagePart({
              customFormula: "@scale.arcane-archer.minor-damage",
              types: ["piercing"],
            }),
          ],
        },
        range: {
          value: null,
          units: "self",
        },
        target: {
          template: {
            width: "1",
          },
        },
      },
    };
  }

}
