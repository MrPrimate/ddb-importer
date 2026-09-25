import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Drinking the potion rolls nothing: the drinker gains a 20-foot emanation of silence for 10
 * minutes, carried as an Active Auras / Aura Effects hint on the drinker's own Silenced effect, as
 * the Silence spell does here; without either module only the drinker is silenced. The ink spit is
 * only available at heightened potency, so it is a separate save that spends nothing.
 */
export default class SilenceOfTheDrowned extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      noTemplate: true,
      removeDamageParts: true,
      data: {
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "10", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Spit Ink", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
          activationOverride: { type: "bonus", value: null, condition: "Heightened Potency, while the potion lasts" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "30", units: "ft" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Silence of the Drowned",
        activityMatch: "Drink",
        daeStackable: "noneNameOnly",
        statuses: ["Deafened"],
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("thunder"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 50, "flags.midi-qol.fail.spell.vocal"),
        ],
        options: {
          transfer: false,
          durationSeconds: 600,
          description: "No sound can be created within or pass through the 20-foot emanation around the drinker. Creatures inside are Deafened, immune to Thunder damage, and cannot cast spells with a Verbal component.",
        },
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: "20",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "20",
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
      {
        name: "Blinded by Ink",
        activityMatch: "Spit Ink",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Blinded until the start of the spitter's next turn. A creature that saves is immune to the ink for 24 hours.",
        },
      },
    ];
  }

}
