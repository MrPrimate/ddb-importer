import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The clematis toxin family: seven weapons plus the ammunition and the generic
 * "Clematis-tainted Weapon" catalogue entry. On a hit the target makes a DC 16
 * Constitution save for 1d8 poison damage, half on a success, and a failure
 * also paralyses it until the end of its next turn.
 *
 * DDB carries the poison die as a restricted damage modifier, so the weapons
 * already get a "Restricted Attack" rider activity holding the 1d8 - those get
 * a damage-free save so the paralysis is not paid for twice. The ammunition and
 * catalogue entries have no such rider, so their save carries the damage.
 */
export default class ClematisTaintedWeapon extends DDBEnricherData {

  get hasRestrictedDamageRider(): boolean {
    return this.data.type === "weapon";
  }

  get saveData(): Partial<I5eActivity> {
    return {
      save: {
        ability: ["con"],
        dc: {
          calculation: "",
          formula: "16",
        },
      },
    } as Partial<I5eActivity>;
  }

  override get activity(): IDDBActivityData {
    if (this.hasRestrictedDamageRider) return {};
    return {
      name: "Poison Save",
      targetType: "creature",
      data: {
        ...this.saveData,
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["poison"] }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.hasRestrictedDamageRider) return [];
    return [
      {
        init: {
          name: "Poison Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "special",
            condition: "On a hit; the Restricted Attack activity rolls the poison damage",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: "16",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Paralyzed (Clematis Toxin)",
        activityMatch: "Poison Save",
        statuses: ["Paralyzed"],
        daeSpecialDurations: ["turnEnd"],
        options: {
          description: "Paralyzed until the end of its next turn, unless it is immune to the Poisoned condition. Once paralysed this way a creature is immune to the weapon's paralysing effect for 24 hours.",
        },
      },
    ];
  }

}
