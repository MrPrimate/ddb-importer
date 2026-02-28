import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiredEclipse extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Give someone Bardic Inspiration",
    };
  }

  get effects() {
    return [
      {
        statuses: ["Invisible"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnStart", "1Attack", "1Spell"],
      },
    ];
  }

}
