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

  // DDB's "Stone Rune" action is the Invoke Rune save this enricher already builds
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Stone Rune: Passive Bonuses",
        // carried with the rune, never applied by Invoke Rune
        options: { transfer: true },
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
            "label=Stone Rune (End of Turn Save),turn=end,saveDC=8 + @prof + @abilities.con.mod,saveAbility=wis,savingThrow=true,saveMagic=true,saveRemove=true,killAnim=true",
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
