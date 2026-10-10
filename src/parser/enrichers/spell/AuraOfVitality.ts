import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Aura of Vitality: the cast creates the 30-foot aura and Heal Creature heals one creature inside it
 * for 2d6. The 2024 spell heals when the aura is created and at the start of each of the caster's
 * turns, so that heal is a Special activation; the 2014 spell heals with a Bonus Action instead.
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
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          generateHealing: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: this.is2014
            ? { type: "bonus", value: null, condition: "While the aura lasts, one creature inside it" }
            : { type: "special", value: null, condition: "Start of each of your turns while the aura persists, one creature inside it" },
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
