import DDBEnricherData from "../../data/DDBEnricherData";

export default class EntropicInfection extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Entropic Infection",
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "action",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, type: "necrotic" }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Entropic Infection",
      options: {
        durationSeconds: 60,
        description: "When the paladin deals damage to the target, it takes an extra 2d6 Necrotic damage. The target loses Resistance and Immunity to Necrotic damage. It makes a Constitution saving throw at the end of each of its turns, ending the effect on itself on a success.",
      },
    }];
  }

}
