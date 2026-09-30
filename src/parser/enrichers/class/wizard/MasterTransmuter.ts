import Generic from "../Generic";

/**
 * Transmuter (AU 2024 and 2014 School of Transmutation): the DDB action that consumes the stone
 * is kept, with the level 7+ slot that keeps the stone from crumbling as slot bookkeeping. The
 * Restore Life option is a Raise Dead cast and Panacea a heal whose amount (half the target's
 * maximum HP, which no activity formula can read) is entered at the scaling prompt. DDB builds
 * the options as choice children, so each child carries only its own option's activity; the
 * unchosen parent carries both. The stone is remade on a Long Rest, which restores the use.
 * Extends Generic so the DDB action matching still builds the consume activity.
 */
export default class MasterTransmuter extends Generic {

  /**
   * The chosen option's label: the choice child's own, or the parent's single pick (the parent
   * keeps its activities over a same-named child copy when the two merge).
   */
  get option(): string | null {
    // only a choice child's parser carries the choice it is building
    const current = (foundry.utils.getProperty(this.ddbParser, "_currentChoice") ?? null) as IDDBChoiceResult | null;
    const chosen = current ?? (this.ddbParser._chosen?.length === 1 ? this.ddbParser._chosen[0] : null);
    return chosen?.label ?? null;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the 2014 DDB action shares the feature's name, so the enricher also runs on the action
    // copy; the extra activities must only be added once, on the feature
    if (this.isAction) return [];
    const option = this.option;
    // explicit ids: which activities a child carries varies, and generated ids follow position
    const results: IDDBAdditionalActivity[] = [];
    if (!option || option.includes("Restore Life")) {
      results.push({
        id: "addResLifRaiDea1",
        init: {
          name: "Restore Life (Raise Dead)",
          type: Generic.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateCast: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: false,
          activationOverride: { type: "action", value: 1, condition: "Consume the Transmuter's Stone; no spell slot or material components" },
        },
        overrides: {
          addSpellUuid: "Raise Dead",
          noSpellslot: true,
          noConsumeTargets: true,
        },
      });
    }
    if (!option || option.includes("Panacea")) {
      results.push({
        id: "addPanacea2IIIII",
        init: {
          name: "Panacea",
          type: Generic.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: 1, condition: "Consume the Transmuter's Stone (scaling: half the target's HP maximum)" },
          healingPart: Generic.basicDamagePart({ customFormula: "@scaling", types: ["healing"], scalingMode: "none" }),
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          addConsumptionScalingMax: "",
          data: {
            range: { units: "touch" },
          },
        },
      });
    }
    results.push({
      id: "addPresStLe7Sl2I",
      init: {
        name: "Preserve Stone (Level 7+ Slot)",
        type: Generic.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateTarget: true,
        activationOverride: { type: "none", value: null, condition: "Expend a level 7+ spell slot as part of the Magic action to keep the stone" },
      },
      overrides: {
        targetType: "self",
        noConsumeTargets: true,
        addConsumptionScalingMax: "9",
        additionalConsumptionTargets: [
          { type: "spellSlots", value: "1", target: "7", scaling: { mode: "level", formula: "" } },
        ],
      },
    });
    return results;
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
