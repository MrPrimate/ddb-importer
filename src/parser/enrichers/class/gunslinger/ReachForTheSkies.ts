import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReachForTheSkies extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
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
