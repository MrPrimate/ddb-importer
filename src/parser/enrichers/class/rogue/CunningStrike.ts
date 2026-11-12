import DDBEnricherData from "../../data/DDBEnricherData";

export default class CunningStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Dealing Sneak Attack damage",
      data: {
        name: "Poison",
        save: {
          ability: ["con"],
          dc: { calculation: "dex", formula: "" },
        },
        // the Poisoned effect carries its own minute
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Trip",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { value: "", units: "inst" },
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            condition: "Dealing Sneak Attack damage",
          },
          saveOverride: {
            ability: ["dex"],
            dc: { calculation: "dex", formula: "" },
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        init: {
          name: "Withdraw",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: { value: "", units: "inst" },
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateRange: false,
          noeffect: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            condition: "Dealing Sneak Attack damage",
          },
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

  /**
   * Activities other than Poison are instantaneous and Prone clears the feature's minute: dnd5e 6
   * stamps an activity's duration onto an applied effect without one, and effects inherit the host
   * feature's duration unless given their own.
   */
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Poisoned"],
        activityMatch: "Poison",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Cunning Strike: Poison (End of Turn Save),turn=end,saveDC=@abilities.dex.dc,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
      {
        name: "Prone",
        // Prone lasts until the creature stands up, not the feature's minute
        options: { durationSeconds: null },
        statuses: ["Prone"],
        activityMatch: "Trip",
      },
    ];
  }


  override get clearAutoEffects(): boolean {
    return true;
  }

}
