import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * War Domain level 6. 2014: a Reaction spending Channel Divinity for +10 on a nearby attack
 * roll. 2024: expend a Channel Divinity use to cast Shield of Faith or Spiritual Weapon without
 * a spell slot; the spell then lasts 1 minute with no Concentration. Each spell is its own cast
 * activity so the duration and Concentration overrides apply per spell. The early end on a
 * recast, Incapacitated or death is not automated. DDB's slot-less copies of the two spells are
 * dropped by FEATURE_SPELLS_IGNORE; the always-prepared Domain Spells copies stay in the spellbook.
 */
export default class WarGodsBlessing extends DDBEnricherData {

  static SPELLS = ["Shield of Faith", "Spiritual Weapon"] as const;

  override get type(): IDDBActivityType | null {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  /**
   * A Channel Divinity fuelled cast of one of the feature's spells. Components still apply, so
   * only Concentration is dropped from the spell's properties.
   */
  castActivity(spell: string): IDDBActivityData {
    return {
      name: `Cast ${spell}`,
      addSpellUuid: spell,
      noSpellslot: true,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      data: {
        duration: {
          value: "1",
          units: "minute",
          concentration: false,
          override: true,
        },
        spell: {
          properties: ["concentration"],
          spellbook: true,
        },
      },
    };
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        name: "War God's Blessing",
        activationType: "reaction",
        targetType: "creature",
      };
    }
    const [shieldOfFaith] = WarGodsBlessing.SPELLS;
    return this.castActivity(shieldOfFaith);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    const [, ...remaining] = WarGodsBlessing.SPELLS;
    return remaining.map((spell) => ({
      init: {
        name: `Cast ${spell}`,
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
      },
      build: {
        generateSpell: true,
        generateConsumption: false,
      },
      overrides: this.castActivity(spell),
    }));
  }

}
