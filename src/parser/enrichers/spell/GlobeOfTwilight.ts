import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The globe treats the two sides differently: creatures
 * the caster designates are concealed (Advantage on Stealth), everyone else is dazzled
 * (Disadvantage on Perception) and saves against being blinded on entering or starting a turn
 * there. The cast targets allies and carries the concealment, which is removed by hand from a
 * creature that leaves, while the save is a free roll made by hand against enemies.
 */
export default class GlobeOfTwilight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      targetType: "ally",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature that is not concealed enters the globe for the first time or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
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
        name: "Globe of Twilight: Concealed",
        activityMatch: "Cast",
        changes: [DDBEnricherData.ChangeHelper.advantageSkillChange("ste")],
        // held only while inside the globe and removed by hand on leaving, so it carries no expiry of its own
        options: {
          transfer: false,
          expiry: null,
          description: "Advantage on Dexterity (Stealth) checks while in the globe, and may attempt to hide at any time. Remove when the creature leaves.",
        },
      },
      {
        name: "Blinded",
        activityMatch: "Ongoing Save",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Blinded until the end of its turn. Dazzled creatures also have Disadvantage on Perception checks inside the globe.",
        },
      },
    ];
  }

}
