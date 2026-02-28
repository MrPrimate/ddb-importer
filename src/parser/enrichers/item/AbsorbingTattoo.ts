import DDBEnricherData from "../data/DDBEnricherData";

export default class AbsorbingTattoo extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      type: "utility",
      addItemConsume: true,
      activationType: "reaction",
      activationCondition: `When you take ${this.ddbParser.originalName.split(',').pop().trim().toLowerCase()} damage`,
      targetType: "self",
      data: {
        name: "Healing Reaction",
      },
    };
  }

}
