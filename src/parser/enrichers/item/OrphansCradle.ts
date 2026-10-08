import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Orphan's Cradle: a +1 Morningstar with Reach in both forms. Untransformed it has Cleansing
 * Miasma and Vile Miasma; Transformed it deals an extra 2d6 Fire on a hit and gains Fanned Flames
 * and Withering Flames. The aura of Advantage against Charmed and Frightened stays in the
 * description.
 */
export default class OrphansCradle extends TrickWeapon {

  get weaponName(): string {
    return "Orphan's Cradle";
  }

  get transformedCopyName(): string {
    return "Orphan's Cradle (Transformed)";
  }

  override get magicBonus(): number {
    return 1;
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Morningstar",
      typeValue: "martialM",
      baseItem: "morningstar",
      number: 1,
      denomination: 8,
      damageType: "piercing",
      properties: ["rch"],
      mastery: "sap",
      range: { value: 10 },
      attackType: "melee",
    };
  }

  get transformed(): ITrickWeaponForm {
    return { ...this.untransformed, label: "Transformed" };
  }

  override get transformedChanges(): IActiveEffectChangeData[] {
    return [TrickWeapon.onHitDamage("2d6", "fire")];
  }

  override get transformedActivityRiders(): string[] {
    return [
      TrickWeapon.propertyActivityId("Fanned Flames"),
      TrickWeapon.propertyActivityId("Withering Flames"),
    ];
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Cleansing Miasma", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "Untransformed, Magic action; it can also end Charmed, Frightened or Poisoned. A creature benefits once per hour",
          },
          targetOverride: { affects: { count: "1", type: "creature", choice: false, special: "One Humanoid you can see" } },
          rangeOverride: { value: "10", units: "ft" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          data: {
            healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, types: ["temphp"] }),
          },
        },
      },
      itemProperty("Vile Miasma", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "16" },
        condition: "Untransformed: when you hit a Beast or an Undead (even one immune to Poisoned); it repeats the save at the end of each of its turns, and is immune for 24 hours once it succeeds or the effect ends",
      }),
      itemProperty("Fanned Flames", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "16" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["fire"] }),
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["poison"] }),
        ],
        onSave: "half",
        activationType: "action",
        condition: "Transformed; Beasts and Undead have Disadvantage. The cradle then reverts and can't transform for 1d4 rounds",
        template: { type: "cone", size: "20" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
      itemProperty("Withering Flames", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "16" },
        condition: "Transformed: when you hit a Beast or an Undead. On a failure it has Vulnerability to your choice of Acid, Cold, Fire, Lightning, Poison or Radiant until the start of its next turn; immune for 24 hours after",
        noeffect: true,
      }),
    ];
  }

  override get passiveEffects(): IDDBEffectHint[] {
    return [
      {
        name: "Vile Miasma: Poisoned",
        activityMatch: "Vile Miasma",
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Poisoned, even if immune to the condition. Repeats the save at the end of each of its turns.",
        },
      },
    ];
  }

}
