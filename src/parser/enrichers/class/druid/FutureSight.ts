import DDBEnricherData from "../../data/DDBEnricherData";

export default class FutureSight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "1",
          units: "hour",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Future Sight",
        options: {
          durationSeconds: 3600,
          description: "While not Incapacitated or Blinded, you have Advantage on all attack rolls and attacks against you have Disadvantage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
        ],
        // the incoming-attack half modifies other creatures' rolls, which only the modules can do
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
      },
    ];
  }

}
