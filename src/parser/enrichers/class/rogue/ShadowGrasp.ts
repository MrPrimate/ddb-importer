import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowGrasp extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "8 + @prof + @abilities.dex.mod",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Shadow Grasp",
        statuses: ["Restrained"],
        options: {
          durationSeconds: 60,
          description: "Restrained for 1 minute; repeats the saving throw at the end of each of its turns, ending the effect on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Shadow Grasp (End of Turn Save),turn=end,saveDC=@abilities.dex.dc,saveAbility=dex,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
