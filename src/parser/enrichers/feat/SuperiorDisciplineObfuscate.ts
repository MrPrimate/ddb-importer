import DDBEnricherData from "../data/DDBEnricherData";

export default class SuperiorDisciplineObfuscate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you gain the Invisible condition; expend 1 Blood Point per creature (up to 3)",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      addScalingMode: "amount",
      addConsumptionScalingMax: "3",
      data: {
        target: {
          affects: {
            type: "creature",
            count: "3",
            choice: true,
          },
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Obfuscate: Shared Invisibility",
        statuses: ["Invisible"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
