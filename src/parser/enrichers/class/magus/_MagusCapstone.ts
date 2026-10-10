import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The level 20 Magus subclass capstones share one shape: a Spell Surge option that spends the
 * Spell Surge use to cast one of two level 6 spells, and a once per Long Rest refresh of the
 * subclass's level 14 feature when a Short Rest ends. Subclasses name the spells, the refreshed
 * feature and the DDB actions; the refresh is the first activity, the casts follow it.
 */
export default abstract class MagusCapstone extends DDBEnricherData {

  /** The DDB action holding the once per Long Rest refresh, e.g. "Master of the Arcane: Vexing Vortices". */
  abstract get restoreActionName(): string;

  /** The feature whose use comes back, e.g. "Arcane Vortex". */
  abstract get restoredFeatureName(): string;

  /** The two level 6 spells the Spell Surge use can cast instead of the surge spell. */
  abstract get surgeSpells(): string[];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.restoreActionName.split(":").pop()?.trim() ?? this.restoreActionName,
      activationType: "special",
      activationCondition: "When you finish a Short Rest",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: this.restoredFeatureName,
          value: "-1",
          scaling: { mode: "", formula: "" },
        },
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.surgeSpells.map((spell) => ({
      init: {
        name: `Spell Surge: ${spell}`,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: {
        addSpellUuid: spell,
        addItemConsume: true,
        itemConsumeTargetName: "Spell Surge",
        noSpellslot: true,
        data: {
          spell: {
            spellbook: true,
          },
        },
      },
    }));
  }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.restoreActionName,
        max: "1",
        period: "lr",
      }),
    };
  }

}
