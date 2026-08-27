import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntThePrey extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Hunt the Prey",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "60",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Teleport to Prey",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateDamage: false,
          generateDuration: true,
          generateRange: true,
          generateSave: false,
          generateTarget: true,
          activationOverride: {
            type: "bonus",
            condition: "Teleport to an unoccupied space within 5 feet of the visible marked prey",
          },
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "Destination must be within 5 feet of the visible marked prey.",
          },
          targetOverride: {
            prompt: false,
            affects: {
              count: "1",
              type: "self",
            },
            template: {},
          },
          durationOverride: {
            units: "inst",
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Hunted Prey",
      options: {
        durationSeconds: 60,
        description: "Marked as the paladin's prey. As a Bonus Action on subsequent turns, the paladin can teleport up to 60 feet to an unoccupied space within 5 feet of this creature (it must be visible). If the creature drops to 0 Hit Points before the mark ends, the mark can transfer to another creature within 60 feet.",
      },
      activityMatch: "Hunt the Prey",
    }];
  }

}
