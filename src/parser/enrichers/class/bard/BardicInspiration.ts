import DDBEnricherData from "../../data/DDBEnricherData";

export default class BardicInspiration extends DDBEnricherData {

  static FEATURE_IDENTIFIER = "bardic-inspiration";

  override get activity(): IDDBActivityData {
    return {
      name: "Inspire",
      targetType: "creature",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: `@scale.${this.classIdentifier("Bard")}.inspiration`,
          name: "Inspiration Roll",
        },
        // 2014 inspiration lasts 10 minutes, 2024 lasts 1 hour
        duration: this.is2014
          ? { value: "10", units: "minute" }
          : { value: "1", units: "hour" },
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    };
  }

  /**
   * 2024 Superior Inspiration (Bard 18) refills Bardic Inspiration to two when rolling initiative.
   * The cost reads this item's remaining uses, so the activity lives here rather than on Superior
   * Inspiration (as in the dnd5e SRD): `min(0, uses - 2)` is a negative cost of the shortfall.
   */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: {
          name: "Regain Inspiration",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
          activationOverride: {
            type: "encounter",
            value: null,
            condition: "When you roll Initiative with fewer than two uses of Bardic Inspiration",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "min(0, @item.uses.value - 2)",
          targetType: "self",
          data: {
            visibility: { identifier: this.classIdentifier("Bard"), level: { min: 18, max: null } },
          },
        },
      },
    ];
  }

  /**
   * Font of Inspiration (5th level, both printings) moves the recovery from a Long Rest to a Short
   * Rest. DDB only gives the rest at the import level, so the period comes from a usage scale on
   * the feature, as the dnd5e SRD does.
   */
  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      DDBEnricherData.AdvancementBuilder.buildRecoveryScale({
        name: "Recovery",
        identifier: "recovery",
        periods: { 1: "lr", 5: "sr" },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        ...foundry.utils.deepClone(this.data?.system?.uses ?? {}),
        recovery: [{ period: `@scale.${BardicInspiration.FEATURE_IDENTIFIER}.recovery` as TLimitedUsePeriod, type: "recoverAll" }],
      },
      data: {
        "flags": { ...this.classAdvancementRootFlags("Bard") },
        "system": { identifier: BardicInspiration.FEATURE_IDENTIFIER },
        "mid-qol": {
          effectActivation: false,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const diceString = `@scale.${this.classIdentifier("Bard")}.inspiration`;
    const midiOptionalChange: IDDBMidiOptionalChange = {
      name: "bardicInspiration",
      priority: 20,
      data: {
        label: "Use Bardic Inspiration?",
        "attack.all": diceString,
        "save.all": diceString,
        "check.all": diceString,
        "skill.all": diceString,
      },
    };
    if (!this.ddbParser.isMuncher && this.hasSubclass("College of Valor")) {
      midiOptionalChange.data["damage.all"] = diceString;
      midiOptionalChange.data["ac.all"] = diceString;
    }
    return [
      {
        options: {
          durationSeconds: this.is2014 ? 600 : 3600,
          transfer: false,
        },
        daeStackable: "noneName",
        midiOptionalChanges: [
          midiOptionalChange,
        ],
        data: {
          "flags": {
            dae: {
              specialDuration: [],
            },
          },
        },
      },
    ];
  }

}
