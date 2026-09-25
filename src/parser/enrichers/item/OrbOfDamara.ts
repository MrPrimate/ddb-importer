import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The parser's primary save is the Dragon's Breath cone, which costs no charges (those pay for the
 * orb's spells). The Fear Aura is a 20-foot emanation toggled with a Magic action; its Wisdom
 * save is rolled by hand against an enemy that starts its turn inside.
 */
export default class OrbOfDamara extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dragon's Breath",
      targetType: "creature",
      activationType: "action",
      noConsumeTargets: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 6,
          denomination: 6,
          types: ["acid", "cold", "fire", "lightning", "poison"],
        }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "18" } },
        damage: { onSave: "half" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "cone", size: "15", units: "ft" },
        },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Fear Aura", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: false,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Enable the aura (it is suppressed while you are Incapacitated)",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "radius", size: "20" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Fear Aura Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "18" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "An enemy starts its turn in the aura",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
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
        name: "Frightened (Fear Aura)",
        activityMatch: "Fear Aura Save",
        statuses: ["Frightened"],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Frightened until the start of its next turn. A creature that saves is immune to the aura for 24 hours.",
        },
      },
    ];
  }

}
