import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorceryPoints extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities() {
    return this.is2014
      ? [{ action: { name: "Font of Magic", type: "class" } }]
      : [{ action: { name: "Font of Magic: Sorcery Points", type: "class" } }];

  }

  get override() {
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
