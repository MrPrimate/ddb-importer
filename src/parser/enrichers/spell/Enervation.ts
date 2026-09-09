import DDBEnricherData from "../data/DDBEnricherData";

/** 2014: 4d8 then 4d8 per bonus action; AU 2024: 6d8 then 2d8. Both heal the caster for half. */
export default class Enervation extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Initial Save",
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 4 : 6,
              denomination: 8,
              type: "necrotic",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Action Drain",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 4 : 2,
              denomination: 8,
              type: "necrotic",
              scalingMode: "none",
            }),
          ],
        },
        overrides: {
          targetType: "creature",
          activationType: "bonus",
          noTemplate: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><em>Whenever this spell deals damage you regain half the Necrotic damage dealt as Hit Points.</em></p>",
    };
  }

}
