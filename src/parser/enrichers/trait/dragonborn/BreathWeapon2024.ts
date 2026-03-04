import DDBEnricherData from "../../data/DDBEnricherData";

export default class BreathWeapon2024 extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get damageType() {
    return this.ddbParser.originalName.split(")")[0].split("(")[1].trim().toLowerCase();
  }

  get activity() {
    if (this.is2014) return {
      rangeSelf: true,
    };
    return {
      name: "Cone",
      rangeSelf: true,
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({
            customFormula: "@scale.dragonborn.breath-weapon",
            type: this.damageType,
          })],
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: {
          name: "Line",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.dragonborn.breath-weapon", type: this.damageType })],
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
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

  // get override() {
  //   console.warn(this);
  //   const uses = this._getUsesWithSpent({
  //     type: "race",
  //     name: this.data.name,
  //   });
  //   return {
  //     data: {
  //       system: {
  //         uses,
  //       },
  //     },
  //   };
  // }

}
