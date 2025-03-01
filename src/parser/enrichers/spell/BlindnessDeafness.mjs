/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BlindnessDeafness extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Blindness",
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Deafness",
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    const midiChanges = [
      DDBEnricherData.ChangeHelper.overrideChange(
        `label=${this.data.name} (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveMagic=true,killAnim=true`,
        20,
        "flags.midi-qol.OverTime",
      ),
    ];
    return [
      {
        name: "Blindness",
        activityMatch: "Blindness",
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("0", 99, "ATL.sight.range"),
        ],
        statuses: ["Blinded"],
        midiChanges,
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      },
      {
        name: "Deafness",
        activityMatch: "Deafness",
        statuses: ["Deafened"],
        midiChanges,
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      },
    ];
  }

}
