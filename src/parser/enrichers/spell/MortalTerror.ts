import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. The save only frightens; the Psychic die is extra damage whenever the caster
 * damages the frightened target, and Prone follows a failed Dexterity save after the target
 * willingly moves more than half its Speed. DDB rolls the die on the save and the parser linked
 * Prone to it, so both move to their own activities.
 */
export default class MortalTerror extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Frighten",
      removeDamageParts: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Terror Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          partialDamageParts: [0],
          activationOverride: { type: "special", value: null, condition: "You deal damage to the frightened target with an attack or spell" },
          durationOverride: { units: "inst", concentration: false },
        },
        overrides: {
          noeffect: true,
        },
      },
      {
        init: {
          name: "Hasty Movement",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: { type: "special", value: null, condition: "The frightened target willingly moves more than half its Speed in a turn" },
          durationOverride: { units: "inst", concentration: false },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mortal Terror: Frightened",
        activityMatch: "Frighten",
        statuses: ["frightened"],
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageSkillChange("prc"),
        ],
        options: {
          description: "Disadvantage on Wisdom (Perception) checks to notice anything other than the caster. If it cannot see the caster on its turn, it can use its action to repeat the save.",
        },
      },
      {
        name: "Prone",
        activityMatch: "Hasty Movement",
        statuses: ["prone"],
        options: {
          durationSeconds: null,
        },
      },
    ];
  }

}
