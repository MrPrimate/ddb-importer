import DDBEnricherData from "../../data/DDBEnricherData";

export default class CursedInvocation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Divine Power: Cursed Invocation",
      targetType: "creature",
      activationType: "bonus",
      data: { range: { value: "30", units: "ft" } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed by Vestige",
        statuses: ["Cursed"],
        activityMatch: "Divine Power: Cursed Invocation",
        // the flags do not single out the warlock and the vestige as targets
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        options: {
          durationSeconds: 60,
          description: "Disadvantage on attack rolls against the warlock and the vestige. Needs midi-qol or automated-conditions-5e, which apply it to every attack roll; without one of those this effect carries no mechanical change.",
        },
      },
    ];
  }

}
