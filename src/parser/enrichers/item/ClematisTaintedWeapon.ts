import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";

/**
 * The clematis toxin family: seven weapons plus the ammunition and the generic
 * "Clematis-tainted Weapon" catalogue entry. On a hit the target makes a DC 16
 * Constitution save for 1d8 poison damage, half on a success, and a failure
 * also paralyses it until the end of its next turn.
 *
 * DDB carries the poison die as a restricted damage modifier, which the item parser
 * turns into a "Restricted Attack" rider activity holding the 1d8 on a weapon. Those
 * get a damage-free save so the poison is not rolled twice. An item without that
 * rider (ammunition that imports as a consumable, or a copy missing the modifier)
 * gets the damage on its save instead.
 */
export default class ClematisTaintedWeapon extends DDBEnricherData {

  /** DDB's poison damage modifier; carrying a restriction, it becomes the Restricted Attack rider. */
  get poisonModifier(): IDDBModifier | undefined {
    const definition = (this.ddbParser as DDBItem | null)?.ddbDefinition;
    return definition?.grantedModifiers?.find((mod) => mod.type === "damage" && mod.subType === "poison");
  }

  /** The item parser built a Restricted Attack activity holding the poison die. */
  get hasRestrictedDamageRider(): boolean {
    return this.data.type === "weapon" && Boolean(this.poisonModifier?.restriction);
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
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Paralyzed until the end of its next turn, unless it is immune to the Poisoned condition. Once paralysed this way a creature is immune to the weapon's paralysing effect for 24 hours.",
        },
      },
    ];
  }

}
