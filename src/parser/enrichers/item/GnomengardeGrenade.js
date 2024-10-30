/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class GnomengardeGrenade extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        name: "Fire Damage",
        "flags.ddbimporter.noeffect": true,
        damage: {
          onSave: "half",
          parts: [DDBEnricherMixin.basicDamagePart({ number: 8, denomination: 6, type: "fire" })],
        },
      },
    };
  }

  get effect() {
    return {
      options: {
        transfer: false,
      },
      statuses: ["Stunned"],
    };
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
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ];
  }

}
