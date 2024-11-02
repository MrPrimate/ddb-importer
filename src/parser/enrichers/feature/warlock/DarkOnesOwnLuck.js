/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class DarkOnesOwnLuck extends DDBEnricherMixin {

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

  get effect() {
    return {
      midiOnly: true,
      options: {
        transfer: true,
      },
      midiChanges: [
        {
          key: "flags.midi-qol.optional.darkOnesOwnLuck.check.all",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "+1d10",
          priority: 20,
        },
        {
          key: "flags.midi-qol.optional.darkOnesOwnLuck.save.all",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "+1d10",
          priority: 20,
        },
        {
          key: "flags.midi-qol.optional.darkOnesOwnLuck.label",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "Dark One's Own Luck",
          priority: 20,
        },
        {
          key: "flags.midi-qol.optional.darkOnesOwnLuck.count",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `ItemUses.${document.name}`,
          priority: 20,
        },
        {
          key: "flags.midi-qol.optional.darkOnesOwnLuck.skill.all",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: "+1d10",
          priority: 20,
        },
      ],
    };
  }

}
