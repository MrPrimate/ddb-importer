import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

/**
 * Flipping the coin is a d6: even grants the Boon of Empyreus, odd the Boon of Beleth. Each boon is
 * its own activity so the right one is used once the flip is known. Beleth's boon is a 10-foot
 * emanation for 1 minute whose region fires the Wisdom save against an enemy that ends its turn
 * inside.
 */
export default class CoinOfWarAndFear extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Flip the Coin",
      targetType: "self",
      activationType: "action",
      noConsumeTargets: true,
      removeDamageParts: true,
      noTemplate: true,
      noeffect: true,
      data: {
        roll: { prompt: false, visible: false, name: "Even: Empyreus, Odd: Beleth", formula: "1d6" },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Boon of Empyreus", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: null, condition: "The coin shows Empyreus (even)" },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
      regionPlacer("Boon of Beleth", {
        template: { type: "radius", size: "10" },
        affects: "enemy",
        activationType: "special",
        activationCondition: "The coin shows Beleth (odd)",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnEnd"],
            activityName: "Boon of Beleth Save",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Boon of Beleth Save", {
        affects: "enemy",
        condition: "An enemy ends its turn in the aura",
        save: { ability: ["wis"], dc: "14" },
      }),
      regionTrigger("Boon of Beleth: Psychic Damage", {
        condition: "While the aura lasts, you hit a Frightened creature with a weapon attack",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["psychic"] }),
        ],
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Boon of Empyreus",
        activityMatch: "Boon of Empyreus",
        changes: [DDBEnricherData.ChangeHelper.addChange("2", 20, "system.attributes.ac.bonus")],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "+2 to Armor Class, and add 1d4 to the first attack roll you make on each of your turns. Receiving this boon again before the next dawn deals 3d6 Radiant damage to you instead.",
        },
      },
      {
        name: "Frightened (Boon of Beleth)",
        activityMatch: "Boon of Beleth Save",
        statuses: ["Frightened"],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Frightened until the end of its next turn.",
        },
      },
    ];
  }

}
