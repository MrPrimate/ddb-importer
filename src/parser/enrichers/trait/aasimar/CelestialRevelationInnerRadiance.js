/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class CelestialRevelationInnerRadiance extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

  get override() {
    return {
      descriptionSuffix: `<br><p>[[/ddbifunc functionName="innerRadiance" functionType="feat"]]{Toggle Inner Radiance Light}</div></p>`,
    };
  }

}
