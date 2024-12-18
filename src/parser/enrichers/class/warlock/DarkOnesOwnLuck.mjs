/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DarkOnesOwnLuck extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return "heal";
  }

  get activity() {
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

  get override() {
    if (this.is2014) return null;

    return {
      data: {
        "system.uses.max": "@abilities.cha.mod",
      },
    };
  }

  get effects() {
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
