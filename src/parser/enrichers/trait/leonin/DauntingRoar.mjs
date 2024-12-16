/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DauntingRoar extends DDBEnricherData {

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  get activity() {
    return {
      rangeSelf: true,
      data: {
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "10",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Daunting Roar: Frightened",
        statuses: ["Frightened"],
      },
      {
        midiOnly: true,
        noCreate: true,
        data: {
          duration: {
            seconds: 12,
            turns: 2,
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        flags: {
          "midi-qol": {
            effectCondition: "!target.effects.some((e) => e.name.toLowerCase().includes('deafened'))",
            AoETargetType: "enemy",
            AoETargetTypeIncludeSelf: false,
          },
        },
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

}
