/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WitchBolt extends DDBEnricherMixin {

  get activity() {
    return {
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
            DDBEnricherMixin.basicDamagePart({
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
    return [{}];
  }

}
