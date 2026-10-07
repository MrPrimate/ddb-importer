import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 2. A Bonus Action and a spell slot store a prepared spell and grant Aegis
 * (Resistance to the chosen damage type) or Enspell (weapon and Unarmed Strike damage may use the
 * chosen type) for an hour. DDB models the benefit as toggled options, so one capture only holds
 * the damage type picked there; the enricher builds both benefits for every damage type and the
 * user picks the effect when applying it. Sigil Surge (level 11) adds 1d6 of the chosen type to
 * Enspell, and its Aegis temporary Hit Points live on the Sigil Surge activity. Store Spell and
 * Release Spell keep the stored spell (see macroActivity).
 */
export default class MysticMark extends DDBEnricherData {

  static BENEFITS = ["Aegis", "Enspell"];

  static label(type: string): string {
    return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  }

  static WEAPON_OR_UNARMED_FILTER(): IEffectChangeFilter {
    return {
      o: "OR",
      v: [
        DDBEnricherData.ChangeHelper.WEAPON_ATTACK_FILTER,
        DDBEnricherData.ChangeHelper.UNARMED_FILTER,
      ],
    };
  }

  static benefitActivity(benefit: string): IDDBActivityData {
    return {
      name: `Mystic Mark: ${benefit}`,
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
      activationCondition: "Expend a spell slot of the stored spell's level or higher",
      data: {
        duration: { value: "1", units: "hour" },
      },
    };
  }

  get hasSigilSurge(): boolean {
    return this.hasClassFeature({ featureName: "Sigil Surge", className: "Magus" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return MysticMark.benefitActivity("Aegis");
  }

  /**
   * The stored spell lives in the ddb.generic.mysticMark macro: "store" records a prepared Magus
   * spell and the slot level the Aegis or Enspell activity spent, "release" casts it at that level
   * without a slot and removes the mark's effects.
   */
  static macroActivity(name: string, action: "store" | "release", activation: I5eActivityActivation): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateRange: true,
        generateTarget: true,
        generateDDBMacro: true,
        activationOverride: activation,
        consumptionOverride: { targets: [], scaling: { allowed: false, max: "" } },
        targetOverride: { affects: { type: "self" } },
        rangeOverride: { units: "self" },
        ddbMacroOverride: {
          name,
          function: "ddb.generic.mysticMark",
          visible: false,
          parameters: JSON.stringify({ action, flag: "mystic-mark", classIdentifier: "magus" }),
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Mystic Mark: Enspell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
        },
        overrides: MysticMark.benefitActivity("Enspell"),
      },
      MysticMark.macroActivity("Store Spell", "store", {
        type: "special",
        value: null,
        condition: "After using Mystic Mark: Aegis or Enspell, record the stored spell and the slot level spent",
      }),
      MysticMark.macroActivity("Release Spell", "release", {
        type: "bonus",
        value: 1,
        condition: "While your Mystic Mark has Aegis or Enspell; casts the stored spell and ends the mark",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const types = DDBEnricherData.allDamageTypes();
    const aegis: IDDBEffectHint[] = types.map((type) => ({
      name: `Aegis (${MysticMark.label(type)})`,
      activityMatch: "Mystic Mark: Aegis",
      options: {
        durationSeconds: 3600,
        description: this.hasSigilSurge
          ? "At the start of each of your turns, gain Temporary Hit Points equal to the expended spell slot level plus your Intelligence modifier (Sigil Surge)."
          : undefined,
      },
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange(type),
      ],
    }));
    const enspell: IDDBEffectHint[] = types.map((type) => ({
      name: `Enspell (${MysticMark.label(type)})`,
      activityMatch: "Mystic Mark: Enspell",
      options: {
        durationSeconds: 3600,
        description: `Weapon and Unarmed Strike damage can be ${MysticMark.label(type)} instead of its normal type.`,
      },
      changes: this.hasSigilSurge
        ? [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", `1d6[${type}]`, {
            conditions: [MysticMark.WEAPON_OR_UNARMED_FILTER()],
          }),
        ]
        : [],
    }));
    return [...aegis, ...enspell];
  }

}
