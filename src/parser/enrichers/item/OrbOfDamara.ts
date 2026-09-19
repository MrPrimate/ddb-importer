import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * The parser's primary save is the Dragon's Breath cone, which costs no charges (those pay for the
 * orb's spells). The Fear Aura is a 20-foot emanation toggled with a Magic action; its region
 * fires the Wisdom save against an enemy that starts its turn inside.
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
      regionPlacer("Fear Aura", {
        template: { type: "radius", size: "20" },
        affects: "enemy",
        activationCondition: "Enable the aura (it is suppressed while you are Incapacitated)",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Fear Aura Save",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Fear Aura Save", {
        affects: "enemy",
        condition: "An enemy starts its turn in the aura",
        save: { ability: ["wis"], dc: "18" },
      }),
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
          description: "Frightened until the start of its next turn. A creature that saves is immune to the aura for 24 hours.",
        },
      },
    ];
  }

}
