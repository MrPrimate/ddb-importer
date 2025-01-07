/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FireShield extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Chill Shield",
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Warm Shield",
        },
      },
      {
        constructor: {
          name: "On Hit Damage",
          type: "damage",
        },
        build: {
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "A creature within 5 feet of you hits you with a melee attack roll",
          data: {
            damage: {
              parts: [DDBEnricherData.basicDamagePart({
                number: 2,
                denomination: 8,
                types: ["fire", "cold"],
              })],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      { name: "Chill Shield", damageType: "fire" },
      { name: "Warm Shield", damageType: "cold" },
    ].map((data) => {
      return {
        name: data.name,
        activityMatch: data.name,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(data.damageType, 0, "system.traits.dr.value"),
        ],
        options: {
          durationSeconds: 600,
        },
        onUseMacroChanges: [
          { macroPass: "isDamaged", macroType: "spell", macroName: "fireShield.js", document: this.data },
        ],
        data: {
          flags: {
            dae: {
              selfTargetAlways: true,
            },
          },
        },
      };
    });
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "fireShield.js",
    };
  }

}
