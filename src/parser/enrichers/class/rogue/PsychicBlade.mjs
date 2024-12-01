/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsychicBlade extends DDBEnricherData {

  get additionalActivities() {
    if (!this.isAction) return [];
    if (!this.isClass("Rogue")) return [];
    return [
      {
        constructor: {
          name: "Bonus Action Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          includeBase: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "cha",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              type: "psychic",
              Bonus: "@mod",
            }),
          ],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
      },
    ];
  }

  get override() {
    if (!this.isClass("Rogue")) return null;

    if (!this.isAction) {
      return {
        descriptionSuffix: `<section class="secret" id="secret-ddbPsychicBlades">
This features attacks have been created as the "Psychic Blade" weapon and can be found in the inventory.
</secret>`,
      };
    }

    return {
      data: {
        name: "Psychic Blade",
        system: {
          damage: {
            base: DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "psychic",
            }),
          },
          mastery: "vex",
          range: {
            long: 120,
          },
          "type.value": "simpleM",
          properties: ["fin", "thr"].concat(this.data.system.properties ?? []),
        },
      },
    };
  }
}
