/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SacredWeapon extends DDBEnricherData {

  get activity() {
    return {
      type: "enchant",
      activationType: "special",
      noTemplate: true,
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [{
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
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Sacred Weapon Light Toggle"],
      },
    };
  }

  get effects() {
    const lightAnimation = '{"type": "sunburst", "speed": 2,"intensity": 4}';
    const atlEffect = {
      atlOnly: true,
      atlChanges: [
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '#ffffff'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '0.25'),
        DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
      ],
      options: {
        durationSeconds: 60,
      },
    };
    if (this.is2014) {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          descriptionSuffix: `<br><p>[[/ddbifunc functionName="sacredWeaponLight" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`,
          changes: [
            {
              key: "attack.bonus",
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: "@abilities.cha.mod",
              priority: 20,
            },
          ],
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 60,
          },
        },
        atlEffect,
      ];
    } else {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          descriptionSuffix: `<br><p>[[/ddbifunc functionName="sacredWeaponLight2024" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`,
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("@abilities.cha.mod", 20, "attack.bonus"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "damage.base.types"),
          ],
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 600,
          },
        },
        atlEffect,
      ];
    }
  }
}
