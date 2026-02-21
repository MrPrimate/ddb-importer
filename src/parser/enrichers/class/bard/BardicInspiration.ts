import DDBEnricherData from "../../data/DDBEnricherData";

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
          formula: "@scale.bard.inspiration",
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
    const diceString = "@scale.bard.inspiration";
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
    if (!this.ddbParser.isMuncher && this.hasSubclass("College of Valor")) {
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
        // "system.uses": this._getGeneratedUses({
        //   type: "class",
        //   name: "Bardic Inspiration",
        // }),
        "mid-qol": {
          effectActivation: false,
        },
      },
    };
  }

}
