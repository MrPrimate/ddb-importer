import DDBEnricherData from "../../data/DDBEnricherData";

export default class Panache extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
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
          // Panache lasts 1 minute with its own end conditions (an ally engages the target,
          // or you separate by 60 ft) - the rules text has no "next turn" clause at all
          expiry: "turnStart",
          durationSeconds: 60,
          description: `Disadvantage on attack rolls against targets other than you, and no opportunity attacks against anyone but you, for 1 minute or until one of your allies engages the target or you and the target are more than 60 feet apart`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("!workflow.target.getName('@token.name')", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["isAttacked", "isSave"],
      },
    ];
  }

}
