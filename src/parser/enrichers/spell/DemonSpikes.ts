import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Demon Hunter): +2 AC for 1 minute, and a creature within 5 feet that hits the
 * caster with a melee attack takes 10 Piercing damage. The parse reads the 10 as a damage activity
 * with no parts, so the cast becomes a self buff and the retaliation its own damage activity.
 */
export default class DemonSpikes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "self",
      rangeSelf: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spikes",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "A creature within 5 feet hits you with a melee attack roll",
          },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "10", types: ["piercing"] }),
          ],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Demon Spikes",
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
