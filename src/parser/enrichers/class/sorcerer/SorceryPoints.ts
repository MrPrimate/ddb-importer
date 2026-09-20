import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorceryPoints extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // 2014 sorcerers ship "Convert Sorcery Points", which DDBAction skips as a standalone
    // document so that it can live here instead
    return this.is2014
      ? [{ action: { name: "Convert Sorcery Points", type: "class" } }]
      : [{ action: { name: "Font of Magic: Sorcery Points", type: "class" } }];

  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            max: "@scale.sorcerer.points",
          },
        },
      },
    };
  }

}
