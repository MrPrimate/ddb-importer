import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicSorcery extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      addScalingMode: "amount",
      addConsumptionScalingMax: "9",
    };
  }

}
