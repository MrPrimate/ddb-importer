/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class BreathWeapon2024 extends DDBEnricherMixin {

  get type() {
    if (this.is2014) return null;
    return "save";
  }

  get damageType() {
    return this.ddbParser.originalName.split(")")[0].split("(")[1].trim().toLowerCase();
  }

  get activity() {
    if (this.is2014) return {};
    return {
      name: "Cone",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherMixin.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: this.damageType })],
        },
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cone",
            size: "15",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    if (this.is2014) return [];
    return [
      {
        constructor: {
          name: "Line",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBEnricherMixin.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: this.damageType })],
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "line",
              size: "30",
              units: "ft",
            },
          },
        },
      },
    ];
  }

}
