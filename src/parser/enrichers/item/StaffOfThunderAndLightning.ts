import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Staff of Thunder and Lightning: the five properties as their own saves and damage rolls, each
 * with its own once-per-dawn use, with the Stunned and Deafened riders.
 *
 * The parser gives the staff one shared once-per-dawn use from DDB's text; each property recovers
 * separately, so the item uses are cleared. Thunder and Lightning differs between the rulesets:
 * 2014 fires Lightning Strike and Thunderclap together as an action, 2024 adds Lightning and
 * Thunder to a hit as a Bonus Action.
 */
export default class StaffOfThunderAndLightning extends DDBEnricherData {

  static ON_HIT = "When you hit with a melee attack using the staff";

  static dawnUse(): I5eSystemLimitedUses {
    return {
      spent: 0,
      max: "1",
      recovery: [{ period: "dawn", type: "recoverAll" }],
    };
  }

  static lightningStrikeBuild(activationCondition: string): IDDBActivityBuild {
    return {
      generateSave: true,
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      generateRange: true,
      generateDamage: true,
      saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "17" } },
      activationOverride: { type: "action", value: 1, condition: activationCondition },
      damageParts: [DDBEnricherData.basicDamagePart({ number: 9, denomination: 6, types: ["lightning"] })],
      onSave: "half",
      targetOverride: {
        template: { type: "line", size: "120", width: "5", units: "ft", count: "" },
        affects: { count: "", type: "creature", choice: false, special: "" },
      },
    };
  }

  static thunderclapBuild(activationCondition: string): IDDBActivityBuild {
    return {
      generateSave: true,
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      generateRange: true,
      generateDamage: true,
      saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
      activationOverride: { type: "action", value: 1, condition: activationCondition },
      damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["thunder"] })],
      onSave: "half",
      targetOverride: {
        template: { type: "radius", size: "60", width: "", units: "ft", count: "" },
        affects: { count: "", type: "creature", choice: false, special: "Not including you" },
      },
    };
  }

  get thunderAndLightning(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [
        {
          init: {
            name: "Thunder and Lightning (Lightning Strike)",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            ...StaffOfThunderAndLightning.lightningStrikeBuild("Used together with Thunder and Lightning (Thunderclap)"),
            generateUses: true,
            usesOverride: StaffOfThunderAndLightning.dawnUse(),
          },
          overrides: {
            noConsumeTargets: true,
            addActivityConsume: true,
            rangeSelf: true,
          },
        },
        {
          // dnd5e cannot spend one activity's use from another, so this half tracks its own
          // once-per-dawn use; used alongside the Lightning Strike half, both reset at dawn
          init: {
            name: "Thunder and Lightning (Thunderclap)",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            ...StaffOfThunderAndLightning.thunderclapBuild("Used together with Thunder and Lightning (Lightning Strike)"),
            generateUses: true,
            usesOverride: StaffOfThunderAndLightning.dawnUse(),
          },
          overrides: {
            noConsumeTargets: true,
            addActivityConsume: true,
            rangeSelf: true,
          },
        },
      ];
    }
    return [
      {
        init: {
          name: "Thunder and Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          generateUses: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Immediately after you hit with a melee attack using the staff",
          },
          // the Lightning damage is not part of the save, only the Stunned rider is
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["lightning"] })],
          onSave: "full",
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "The creature you hit" },
          },
          usesOverride: StaffOfThunderAndLightning.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeType: "ft",
          rangeValue: 5,
        },
      },
    ];
  }

  // the staff's own attack spends nothing; the parser links it to the daily use the text describes
  override get activity(): IDDBActivityData {
    return { noConsumeTargets: true };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thunder",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "special", value: null, condition: StaffOfThunderAndLightning.ON_HIT },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "The creature you hit" },
          },
          usesOverride: StaffOfThunderAndLightning.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeType: "ft",
          rangeValue: 5,
        },
      },
      {
        init: {
          name: "Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          activationOverride: { type: "special", value: null, condition: StaffOfThunderAndLightning.ON_HIT },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["lightning"] })],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "The creature you hit" },
          },
          usesOverride: StaffOfThunderAndLightning.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeType: "ft",
          rangeValue: 5,
        },
      },
      ...this.thunderAndLightning,
      {
        init: {
          name: "Lightning Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          ...StaffOfThunderAndLightning.lightningStrikeBuild(""),
          generateUses: true,
          usesOverride: StaffOfThunderAndLightning.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Thunderclap",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          ...StaffOfThunderAndLightning.thunderclapBuild(""),
          generateUses: true,
          usesOverride: StaffOfThunderAndLightning.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stunned",
        activitiesMatch: this.is2014 ? ["Thunder"] : ["Thunder", "Thunder and Lightning"],
        statuses: ["Stunned"],
        options: {
          transfer: false,
          // "until the end of your next turn": the wielder's turn, not the target's; without DAE
          // the expiry helper falls back to core turnEnd plus a six-second counted duration
          expiry: "sourceEnd",
        },
      },
      {
        name: "Deafened",
        activitiesMatch: this.is2014 ? ["Thunderclap", "Thunder and Lightning (Thunderclap)"] : ["Thunderclap"],
        statuses: ["Deafened"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainActivityUseSpent: true,
      uses: {
        spent: 0,
        max: "",
        recovery: [],
      },
    };
  }

}
