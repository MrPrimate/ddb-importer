import DDBEnricherData from "../../data/DDBEnricherData";

export default class BardicInspiration extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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
        // 2014 inspiration lasts 10 minutes, 2024 lasts 1 hour
        duration: this.is2014
          ? { value: "10", units: "minute" }
          : { value: "1", units: "hour" },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const diceString = "@scale.bard.inspiration";
    const midiOptionalChange: IDDBMidiOptionalChange = {
      name: "bardicInspiration",
      priority: 20,
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
          durationSeconds: this.is2014 ? 600 : 3600,
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

  override get override(): IDDBOverrideData {
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
