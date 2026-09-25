import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Eldritch Spear: an enchant rider on a cantrip that extends its range, 300 feet flat in 2014
 * and 30 feet per warlock level in 2024 (any warlock cantrip with a range of 10+ feet). The
 * character importer's enchantment step applies it to Eldritch Blast; other cantrips can take it
 * from the feature's enchant activity. DDB only carries a range modifier for the 2014 printing,
 * and the Eldritch Blast spell enricher no longer bakes it in, so the range lives here alone.
 */
export default class EldritchInvocationsEldritchSpear extends DDBEnricherData {

  static ACTIVITY_ID = "ddbEldSpearEnch1";

  static EFFECT_ID = "ddbEldSpearEfx01";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Increase Range",
      id: EldritchInvocationsEldritchSpear.ACTIVITY_ID,
      activationType: "special",
      activationCondition: "Applied to Eldritch Blast on import; apply to other warlock cantrips by hand",
      data: {
        restrictions: {
          type: "spell",
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const rangeChange = this.is2014
      ? DDBEnricherData.ChangeHelper.overrideChange("300", 20, "system.range.value")
      : DDBEnricherData.ChangeHelper.addChange("@classes.warlock.levels * 30", 20, "system.range.value");
    return [
      {
        type: "enchant",
        name: "Eldritch Spear",
        activityMatch: "Increase Range",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} [Eldritch Spear]", 20, "name"),
          rangeChange,
        ],
        options: {
          description: this.is2014
            ? "Eldritch Spear: this cantrip has a range of 300 feet."
            : "Eldritch Spear: this cantrip's range is increased by 30 feet per warlock level.",
        },
        data: {
          _id: EldritchInvocationsEldritchSpear.EFFECT_ID,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemName: "Eldritch Blast",
          effectId: EldritchInvocationsEldritchSpear.EFFECT_ID,
          activityId: EldritchInvocationsEldritchSpear.ACTIVITY_ID,
        },
      };

    return {
      data: {
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
