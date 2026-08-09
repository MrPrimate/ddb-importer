import DDBEnricherData from "../../data/DDBEnricherData";

export default class StoneRune extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    // if (!this.isAction) return null;
    return {
      name: "Invoke Rune",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        action: {
          name: "Stone Rune",
          type: "class",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Stone Rune: Passive Bonuses",
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ins"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", "upgrade", 120, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", "override", "darkvision", 5),
        ],
      },
      {
        activityMatch: "Invoke Rune",
        name: "Stone Rune: Dreamy Stupor",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Charmed", "Incapacitated"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Stone Rune (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveMagic=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }


  // get clearAutoEffects() {
  //   return true;
  // }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Stone Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

}
