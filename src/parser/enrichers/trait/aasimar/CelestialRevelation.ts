import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Unleash Celestial Energy",
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
          noTemplate: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Inner Radiance Save",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
      {
        init: {
          name: "Necrotic Shroud Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          targetType: "enemy",
          data: {
            ability: ["cha"],
            dc: {
              calculation: "cha",
              formula: "",
            },
          },
        },
      },
    ];
  }

  // get activity() {
  //   return {
  //     noTemplate: true,
  //     data: {
  //       damage: {
  //         parts: [
  //           DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["radiant", "necrotic"] }),
  //         ],
  //       },
  //     },
  //   };
  // }

  get effects() {
    return [
      {
        name: "Heavenly Wings",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Necrotic Shroud: Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

  get override() {
    return {
      ddbMacroDescription: true,
    };
  }

  get ddbMacroDescriptionData() {
    return {
      name: "innerRadiance",
      label: "Toggle Inner Radiance Light", // optional
      type: "feat",
    };
  }

}
