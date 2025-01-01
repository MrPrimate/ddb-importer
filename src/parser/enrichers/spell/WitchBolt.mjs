/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WitchBolt extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
      splitDamage: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Ongoing Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            value: "1",
            type: this.is2014 ? "action" : "bonus",
          },
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "",
              size: this.is2014 ? "30" : "60",
              units: "ft",
            },
            affects: {},
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 12,
              type: "lightning",
              scalingMode: "none",
              scalingNumber: null,
            }),
          ],
        },
      },
    ];
  }

  get effects() {
    return [{
      activityMatch: "Cast",
    }];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "witchBolt.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "witchBolt.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
