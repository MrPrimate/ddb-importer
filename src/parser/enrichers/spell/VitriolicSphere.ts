import DDBEnricherData from "../data/DDBEnricherData";

export default class VitriolicSphere extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Save",
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 10,
              denomination: 4,
              type: "acid",
              scalingMode: "whole",
              scalingNumber: 2,
            }),
          ],
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "20",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Secondary Acid Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "special", condition: "End of next turn" },
          durationOverride: { units: "inst", concentration: false },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 5,
              denomination: 4,
              type: "acid",
            }),
          ],
        },
      },
    ];
  }
}
