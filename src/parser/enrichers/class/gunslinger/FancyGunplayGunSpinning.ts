import DDBEnricherData from "../../data/DDBEnricherData";

export default class FancyGunplayGunSpinning extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Performance",
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you make a Performance or Sleight of Hand check using a ranged weapon",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d20 + @skills.prf.total + 1@scale.gunslinger.risk.die",
          name: "Performance Check + Risk Die",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sleight of Hand",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateConsumption: false,
          generateRange: false,
          generateRoll: true,
          generateTarget: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Once per turn, when you make a Sleight of Hand check using a ranged weapon",
          },
          rollOverride: {
            prompt: false,
            visible: true,
            formula: "1d20 + @skills.slt.total + 1@scale.gunslinger.risk.die",
            name: "Sleight of Hand Check + Risk Die",
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Gun Spinning",
      },
    };
  }

}
