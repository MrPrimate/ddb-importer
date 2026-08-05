import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReachForTheSkies extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You score a Critical Hit against a creature and call for its surrender",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // level 14 upgrades Incapacitated to Stunned
        name: "Surrendering",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Frightened", "Incapacitated"],
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }

}
