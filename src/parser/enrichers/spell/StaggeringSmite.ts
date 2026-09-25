import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Staggering Smite: the 4d6 psychic damage is unconditional on the hit; the Wisdom save only decides the Stunned condition. DDB folds the damage into the save roll.
 */
export default class StaggeringSmite extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Stun Save",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Smite Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you hit a creature with a melee attack roll",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              types: ["psychic"],
            }),
          ],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

}
