import DDBEnricherData from "../../data/DDBEnricherData";

export default class HobblingStrike extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      activationCondition: "Once per turn, when you hit a creature with a weapon attack",
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Hobbling Strike: Knocked Prone",
        statuses: ["Prone"],
        options: {
          description: "Knocked Prone on a failed save. At Cleric level 14 the target's Speed is also halved until the start of your next turn.",
        },
      },
      {
        name: "Hobbling Strike: Hobbled",
        options: {
          durationRounds: 1,
          description: "Speed halved until the start of the cleric's next turn (Cleric level 14+).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0.5", 50, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
