/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BardicInspiration extends DDBEnricherData {

  get activity() {
    return {
      name: "Inspire",
      targetType: "creature",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.bardic-inspiration",
          name: "Inspiration Roll",
        },
        duration: {
          value: "10",
          units: "minutes",
        },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    };
  }

  get effects() {
    const diceString = "@scale.bard.bardic-inspiration";
    const midiChanges = [
      DDBEnricherData.ChangeHelper.customChange(
        diceString,
        20,
        "flags.midi-qol.optional.bardicInspiration.attack.all",
      ),
      DDBEnricherData.ChangeHelper.customChange(
        diceString,
        20,
        "flags.midi-qol.optional.bardicInspiration.save.all",
      ),
      DDBEnricherData.ChangeHelper.customChange(
        diceString,
        20,
        "flags.midi-qol.optional.bardicInspiration.check.all",
      ),
      DDBEnricherData.ChangeHelper.customChange(
        diceString,
        20,
        "flags.midi-qol.optional.bardicInspiration.skill.all",
      ),
      DDBEnricherData.ChangeHelper.customChange(
        "Bardic Inspiration",
        20,
        "flags.midi-qol.optional.bardicInspiration.label",
      ),
    ];
    if (this.hasSubclass("College of Valor")) {
      midiChanges.push(
        DDBEnricherData.ChangeHelper.customChange(
          diceString,
          20,
          "flags.midi-qol.optional.bardicInspiration.damage.all",
        ),
        DDBEnricherData.ChangeHelper.customChange(
          diceString,
          20,
          "flags.midi-qol.optional.bardicInspiration.ac.all",
        ),
      );
    }
    return [
      {
        options: {
          durationSeconds: 600,
          transfer: false,
        },
        daeStackable: "noneName",
        midiChanges,
        data: {
          "flags": {
            dae: {
              specialDuration: [],
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "mid-qol": {
          effectActivation: false,
        },
      },
    };
  }

}
