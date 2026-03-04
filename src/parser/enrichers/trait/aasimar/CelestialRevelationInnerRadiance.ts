import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationInnerRadiance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

  get override(): IDDBOverrideData {
    return {
      ddbMacroDescription: true,
    };
  }

  get ddbMacroDescriptionData() {
    return {
      name: "innerRadiance",
      label: "Toggle Inner Radiance Light", // optional
      type: "feat",
    };
  }

}
