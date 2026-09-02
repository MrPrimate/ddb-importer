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
      // "Rune Aura" places a 30-foot emanation on the fighter whose region offers
      // Invoke Rune (the once-per-rest reaction) when a creature ends its turn inside
      {
        init: {
          name: "Rune Aura",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "Places the 30-foot aura the rune watches",
          },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {
              count: "1",
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
        },
        overrides: {
          data: {
            range: {
              override: true,
              units: "self",
            },
            behaviors: [
              DDBEnricherData.BehaviorHelper.activity({
                events: ["tokenTurnEnd"],
                activityName: "Invoke Rune",
                excludeSelf: true,
              }),
            ],
          },
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
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.ranges.darkvision"),
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
