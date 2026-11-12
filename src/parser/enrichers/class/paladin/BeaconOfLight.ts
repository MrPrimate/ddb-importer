import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Holy (World of Warcraft) and the WoW Paladin's Holy Specialization: a Magic action
 * spending Channel Divinity marks an ally for a minute; healing others also heals it for half.
 */
export default class BeaconOfLight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Beacon of Light",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "ally",
      data: {
        range: {
          units: "ft",
          value: "60",
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
        name: "Beacon of Light",
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "When the paladin heals another creature with a spell or Lay On Hands, this creature also regains half as many Hit Points.",
        },
      },
    ];
  }

}
