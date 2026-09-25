import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 14. The feature document is a container for the three DDB
 * actions: the once-per-long-rest Bolster temp HP, the free Extinguish on a controlled Undead,
 * and the reaction-plus-level-5-slot Extinguish on an Undead the wizard does not control. The
 * slot version keeps DDB's flat 1d6: its scaling prompt is the slot level, so it cannot also ask
 * for the hit dice count.
 */
export default class DeathsMaster extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Bolster Undead: Bonus Temp HP", type: "class" } },
      {
        action: { name: "Extinguish Undead", type: "class" },
        // DDB's action carries a placeholder 1d6; the book rolls d6s equal to half the Undead's
        // unexpended Hit Dice (round up), so the scaling prompt asks for the hit dice count
        overrides: {
          activationCondition: "When an Undead you control is reduced to 0 HP (scaling: its unexpended Hit Dice)",
          removeDamageParts: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "(ceil(@scaling / 2))d6", type: "necrotic", scalingMode: "none" }),
          ],
          addConsumptionScalingMax: "20",
        },
      },
      { action: { name: "Extinguish Undead: Spell Slot", type: "class" } },
    ];
  }

}
