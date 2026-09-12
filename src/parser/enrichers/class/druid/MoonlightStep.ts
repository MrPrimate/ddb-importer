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
          description: "You have Advantage on the next attack roll you make before the end of this turn.",
          expiry: "turnEnd",
        },
        daeSpecialDurations: ["1Attack"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }

}
