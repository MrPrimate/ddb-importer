import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeguilingMagic extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Save",
      addItemConsume: true,
      activationType: "special",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Recharge",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Beguiling Magic",
        max: "1",
        period: "lr",
      }),
      ignoredConsumptionActivities: ["Save"],
      retainOriginalConsumption: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        options: {
        },
        statuses: ["Frightened"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Beguiling Magic (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Charmed",
        options: {
        },
        statuses: ["Charmed"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Beguiling Magic (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
