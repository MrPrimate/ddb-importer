import DDBEnricherData from "../../data/DDBEnricherData";

export default class Panache extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  get activity() {
    return {
      data: {
        check: {
          associated: ["per"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Taunted",
        options: {
          durationSeconds: 60,
          description: `Disadvantage on attack rolls against targets other than you until the start of your next turn`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["turnStartSource" as const],
        data: {
          duration: {
            seconds: 60,
          },
        },
      },
    ];
  }

}
