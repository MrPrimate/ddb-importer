import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntThePrey extends DDBEnricherData {

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Hunted Prey",
      options: {
        durationSeconds: 60,
        description: "Marked as the paladin's prey. As a Bonus Action on subsequent turns, the paladin can teleport up to 60 feet to an unoccupied space within 5 feet of this creature (it must be visible). If the creature drops to 0 Hit Points before the mark ends, the mark can transfer to another creature within 60 feet.",
      },
    }];
  }

}
