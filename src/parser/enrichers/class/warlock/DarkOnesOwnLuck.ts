import DDBEnricherData from "../../data/DDBEnricherData";

export default class DarkOnesOwnLuck extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll for your luck",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;

    return {
      uses: {
        max: "@abilities.cha.mod",
      },
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
