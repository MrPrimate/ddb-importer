import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Grass Whistle Blade: on a melee hit the wielder can forgo the damage and spend a charge on a
 * lullaby. A failed Wisdom save incapacitates the target until the end of its next turn, when it
 * saves again: a second failure puts it to sleep for a minute, a success deals 3d8 psychic
 * instead. dnd5e save damage lands on a failure, so the psychic damage is its own activity.
 */
export default class GrassWhistleBlade extends DDBEnricherData {

  static LULLABY = "Lullaby";

  static SECOND_SAVE = "Lullaby: Second Save";

  static PSYCHIC = "Lullaby: Psychic Damage";

  get lullabySave(): IDDBActivityBuild["saveOverride"] {
    return { ability: ["wis"], dc: { calculation: "", formula: "16" } };
  }

  /** The lullaby follows a melee hit, not the dagger's thrown range. */
  get melee(): IDDBActivityBuild["rangeOverride"] {
    return { override: true, value: "5", units: "ft" };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  // the parser's generic save rider rolled the psychic damage on a failed first save
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const creature: IDDBActivityBuild["targetOverride"] = {
      override: true,
      affects: { count: "1", type: "creature" },
      template: {},
    };
    return [
      {
        init: {
          name: GrassWhistleBlade.LULLABY,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          rangeOverride: this.melee,
          saveOverride: this.lullabySave,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you hit a creature with a melee attack roll, forgoing the attack's damage",
          },
          targetOverride: creature,
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "1",
          noTemplate: true,
        },
      },
      {
        init: {
          name: GrassWhistleBlade.SECOND_SAVE,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          rangeOverride: this.melee,
          saveOverride: this.lullabySave,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the end of the lulled target's next turn",
          },
          targetOverride: creature,
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
        },
      },
      {
        init: {
          name: GrassWhistleBlade.PSYCHIC,
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          rangeOverride: this.melee,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, types: ["psychic"] })],
          activationOverride: {
            type: "special",
            value: null,
            condition: "If the target succeeds on the second save",
          },
          targetOverride: creature,
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lullaby: Incapacitated",
        activityMatch: GrassWhistleBlade.LULLABY,
        statuses: ["Incapacitated"],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Incapacitated until the end of its next turn, when it repeats the Wisdom save.",
        },
      },
      {
        name: "Lullaby: Asleep",
        activityMatch: GrassWhistleBlade.SECOND_SAVE,
        statuses: ["Unconscious"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Asleep for 1 minute. Ends if it takes damage or someone within 5 feet takes an action to shake it awake.",
        },
      },
    ];
  }

}
