import DDBEnricherData from "../data/DDBEnricherData";

export default class SpiritualWeapon extends DDBEnricherData {
  get type() {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getSpiritualWeapons;
  }

  get generateSummons() {
    return !this.is2014;
  }

  get activity() {
    return this.is2014
      ? {
        data: {
          name: "Summon",
          target: {
            override: true,
            template: {
              size: "2.5",
              type: "radius",
            },
          },
        },
      }
      : {
        noTemplate: true,
        profileKeys: [
          { count: 1, name: "SpiritualWeaponShortSword" },
          { count: 1, name: "ArcaneSwordAstralBlue" },
        ],
        summons: {
          "match": {
            "proficiency": false,
            "attacks": true,
            "saves": false,
          },
        },
      };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateAttack: true,
          onsave: false,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              bonus: "@mod",
              type: "force",
              scalingMode: this.is2014 ? "half" : "whole",
              scalingNumber: 1,
            }),
          ],
          activationOverride: { type: "bonus", condition: "" },
        },
      },
    ];
  }
}
