/* eslint-disable class-methods-use-this */
import ArcaneShotOption from "./ArcaneShotOption.mjs";

export default class SeekingArrow extends ArcaneShotOption {

  get activity() {
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
