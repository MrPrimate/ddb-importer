/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class SacredWeapon extends DDBEnricherMixin {

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

  get effect() {
    if (this.is2014) {
      return {
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
      };
    } else {
      return {
        type: "enchant",
        name: "Sacred Weapon",
        magicalBonus: {
          makeMagical: true,
        },
        descriptionSuffix: `<br><p>[[/ddbifunc functionName="sacredWeaponLight2024" functionType="feat"]]{Toggle Sacred Weapon Light}</div></p>`,
        changes: [
          DDBEnricherMixin.generateOverrideChange("@abilities.cha.mod", 20, "attack.bonus"),
          DDBEnricherMixin.generateUnsignedAddChange("radiant", 20, "damage.base.types"),
        ],
        options: {
          name: "Sacred Weapon",
          description: `The weapon shines with Sacred Energy.`,
          durationSeconds: 600,
        },
      };
    }
  }
}
