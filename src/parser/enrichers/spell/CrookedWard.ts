import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The ward only touches five creature types: while one is
 * inside it has Disadvantage on ability checks and attack rolls, and it saves against fear when it
 * enters or starts its turn there. Both arms are free activities used by hand: one rolls the save,
 * the other applies the agony, which is removed by hand when the creature leaves.
 */
export default class CrookedWard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the ward does to a creature belongs to the free activities, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "An Aberration, Fey, Fiend, Monstrosity or Undead enters the ward for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Ward Agony", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "An Aberration, Fey, Fiend, Monstrosity or Undead is in the ward",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crooked Ward: Agony",
        activityMatch: "Ward Agony",
        changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(ability),
        ),
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        // held only while inside the ward and removed by hand on leaving, so it carries no expiry of its own
        options: {
          transfer: false,
          expiry: null,
          description: "Disadvantage on ability checks and attack rolls while in the ward. Remove when the creature leaves.",
        },
      },
      {
        name: "Frightened",
        activityMatch: "Ongoing Save",
        statuses: ["Frightened"],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Frightened until the start of its next turn.",
        },
      },
    ];
  }

}
