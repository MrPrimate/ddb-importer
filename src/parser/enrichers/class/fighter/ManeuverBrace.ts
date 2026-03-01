import Maneuver from "./Maneuver";

export default class ManeuverBrace extends Maneuver {

  get type(): IDDBActivityType {
    return Maneuver.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Brace",
      activationType: "reaction",
      addItemConsume: true,
    };
  }

  get additionalActivities() {
    return [
      this.extraDamageActivity(),
    ];
  }


  get override() {
    return {
      midiManualReaction: true,
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
      },
    };
  }

  get effects() {
    return [
      {
        name: "Brace: Extra Damage (Automation)",
        midiOnly: true,
        activityMatch: "Brace",
        daeSpecialDurations: ["1Attack:mwak" as const],
        data: {
          duration: {
            turns: 2,
          },
        },
        midiChanges: [
          Maneuver.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }


}
