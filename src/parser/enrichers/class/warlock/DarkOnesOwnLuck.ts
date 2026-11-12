import DDBEnricherData from "../../data/DDBEnricherData";

/** The 2024 feature is a d10 added to an ability check or saving throw, Charisma modifier (min 1) times per Long Rest. */
export default class DarkOnesOwnLuck extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Luck",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you make an ability check or saving throw",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d10",
          name: "Roll for your luck",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;

    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Dark One's Own Luck",
        max: "max(1, @abilities.cha.mod)",
        period: "lr",
      }),
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      midiOnly: true,
      options: {
        transfer: true,
      },
      midiOptionalChanges: [{
        name: "darkOnesOwnLuck",
        data: {
          label: "Dark One's Own Luck",
          "check.all": "+1d10",
          "save.all": "+1d10",
          "skill.all": "+1d10",
          count: `ItemUses.${this.data.name}`,
        },
      }],
    }];
  }

}
