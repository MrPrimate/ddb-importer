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
          units: "minute",
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
    const midiOptionalChange = {
      name: "bardicInspiration",
      priortiy: 20,
      data: {
        label: "Use Bardic Inspiration?",
        "attack.all": diceString,
        "save.all": diceString,
        "check.all": diceString,
        "skill.all": diceString,
      },
    };
    if (this.hasSubclass("College of Valor")) {
      midiOptionalChange.data["damage.all"] = diceString;
      midiOptionalChange.data["ac.all"] = diceString;
    }
    return [
      {
        options: {
          durationSeconds: 600,
          transfer: false,
        },
        daeStackable: "noneName",
        midiOptionalChanges: [
          midiOptionalChange,
        ],
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
