/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SacredWeapon extends DDBEnricherData {

  get activity() {
    return {
      type: "enchant",
      activationType: "special",
      noTemplate: true,
      targetType: "self",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get additionalActivities() {
    return DDBEnricherData.AutoEffects.effectModules().atlInstalled
      ? []
      : [{
        id: "SacredWeaponLigh",
        constructor: {
          name: "Sacred Weapon Light Toggle",
          type: "ddbmacro",
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDDBMacro: true,
          noeffect: true,
          ddbMacroOverride: {
            name: "Sacred Weapon Light Toggle",
            function: "ddb.feat.sacredWeaponLight",
            visible: false,
            parameters: "",
          },
        },
      }];
  }

  get override() {
    return {
      // ddbMacroDescription: !DDBEnricherData.AutoEffects.effectModules().atlInstalled,
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Sacred Weapon Light Toggle"],
      },
    };
  }

  get ddbMacroDescriptionData() {
    if (this.is2014) {
      return {
        name: "sacredWeaponLight",
        label: "Toggle Inner Radiance Light", // optional
        type: "feat",
      };
    } else {
      return {
        name: "sacredWeaponLight2024",
        label: "Toggle Sacred Weapon Light", // optional
        type: "feat",
      };
    }

  }

  get effects() {
    const lightAnimation = '{"type": "sunburst", "speed": 2,"intensity": 4}';
    const atlChanges = [
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, (this.is2014 ? '5' : '40')),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, (this.is2014 ? '0' : '20')),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '#ffffff'),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '0.25'),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
    ];

    const descriptionChanges = DDBEnricherData.AutoEffects.effectModules().atlInstalled
      ? []
      : [
        DDBEnricherData.ChangeHelper.addChange(this.ddbEnricher.ddbMacroDescription, 20, "system.description.value"),
      ];

    if (this.is2014) {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("@abilities.cha.mod", 20, "attack.bonus"),
          ].concat(descriptionChanges),
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 60,
          },
          data: {
            flags: {
              ddbimporter: {
                activityRiders: DDBEnricherData.AutoEffects.effectModules().atlInstalled ? [] : ["SacredWeaponLigh"],
              },
            },
          },
          atlChanges,
        },
      ];
    } else {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("@abilities.cha.mod", 20, "attack.bonus"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
          ].concat(descriptionChanges),
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 600,
          },
          data: {
            flags: {
              ddbimporter: {
                activityRiders: DDBEnricherData.AutoEffects.effectModules().atlInstalled ? [] : ["SacredWeaponLigh"],
              },
            },
          },
          atlChanges,
        },
      ];
    }
  }
}
