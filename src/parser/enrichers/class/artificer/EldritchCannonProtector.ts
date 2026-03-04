import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchCannonProtector extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: this.is2014 ? 1 : null,
          denomination: this.is2014 ? 8 : null,
          bonus: this.is2014 ? "@abilities.int.mod" : null,
          customFormula: this.is2014 ? null : "@scale.artillerist.healing-dice + @abilities.int.mod",
          types: ["temphp"],
        }),
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "" },
    };
  }
}
