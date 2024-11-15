/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GnomengardeGrenade extends DDBEnricherData {

  get activity() {
    return {
      noeffect: true,
      data: {
        name: "Fire Damage",
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, type: "fire" })],
        },
      },
    };
  }

  get effects() {
    return [{
      options: {
        transfer: false,
      },
      statuses: ["Stunned"],
    }];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Thunder Damage",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          onSave: "half",
          damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ];
  }

}
