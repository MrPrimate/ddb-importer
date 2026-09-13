import DDBEnricherData from "../../data/DDBEnricherData";

export default class MoonlightStep extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Transport",
      targetType: "self",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Moonlight Step: Advantage on Next Attack",
        options: {
          description: "You have Advantage on the next attack roll you make before the end of this turn. Without DAE or AC5e the effect lasts for every attack until the end of the turn.",
          expiry: "turnEnd",
        },
        // DAE and AC5e each end the effect after the one attack; the native expiry is the ceiling
        daeSpecialDurations: ["1Attack"],
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
