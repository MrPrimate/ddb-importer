/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StoneRune extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
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

  get additionalActivities() {
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

  get effects() {
    return [
      {
        noCreate: true,
        name: "Stone Rune: Passive Bonuses",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.ins.roll.mode"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 120, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
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

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Stone Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
