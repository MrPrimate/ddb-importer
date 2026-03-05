import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulOfVengeance extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Vengeance Attack",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature under your Vow of Enmity hits or misses with an attack roll",
    };
  }

}
