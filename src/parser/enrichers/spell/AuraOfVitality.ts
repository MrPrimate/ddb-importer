import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Aura of Vitality: the cast creates the 30-foot aura; each turn a bonus action heals one creature inside it for 2d6.
 */
export default class AuraOfVitality extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Heal Creature",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          generateHealing: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "While the aura lasts, one creature inside it",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 2,
            denomination: 6,
            types: ["healing"],
          }),
          rangeOverride: { units: "ft", value: 30 },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

}
