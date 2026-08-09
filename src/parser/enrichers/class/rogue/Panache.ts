import DDBEnricherData from "../../data/DDBEnricherData";

export default class Panache extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        check: {
          associated: ["per"],
          ability: [],
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
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
        daeSpecialDurations: ["turnStartSource"],
        data: {
          duration: {
            value: 6,
            units: "seconds",
            expiry: "turnStart",
          },
        },
      },
    ];
  }

}
