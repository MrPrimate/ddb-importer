import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { itemProperty, itemText, unrestrictedDamageParts, weaponRange } from "./_ItemActivities";

/**
 * Thornpiercer: a rose hilt that grows a dagger, shortsword, rapier or whip, each record carrying
 * its form's property. The dagger's thrown blade bursts at its target, hit or miss: the target and
 * up to three other creatures of your choice within 10 feet of it make a Dexterity save. The parser
 * builds that save with a single target, so it is retargeted as a 10 foot radius on the target with
 * up to four chosen enemies. It is the item's only Dexterity save, which picks it out on the Dagger
 * record and on the multi-form parent's Dagger section; the other forms keep their parsed saves.
 *
 * The rapier's thorns deal an extra 10 piercing when you roll a 20 on the attack, which DDB
 * restricts to "on attack roll of 20"; the parser makes natural-20 damage the attack's critical
 * bonus.
 *
 * The shortsword's and whip's saves and the rapier's natural-20 save are parsed as actions; they
 * are retimed to the hits that trigger them, the rapier's carrying its Hit Point maximum reduction.
 *
 * The whip grapples on a failed Strength save, and the grappled creature takes 1d4 piercing from
 * the thorns at the start of each of its turns until freed. DDB restricts that die to "if failed
 * Grappled save", which the parser builds as a second attack, and the multi-form parent rolls it
 * as the Whip save's damage; it is a Thorns damage activity instead. The parser's saves and escape
 * check stay beside it.
 */
export default class Thornpiercer extends DDBEnricherData {

  static THORNS = "Thorns";

  /** The whip record, or the multi-form parent describing every form. */
  get hasWhipThorns(): boolean {
    return (/The Grappled target takes 1d4 Piercing damage from the Whip.s thorns/i).test(itemText(this));
  }

  override get keepParsedActivities(): boolean {
    return true;
  }

  // every form's extra 1d4 piercing on a hit, set on the attack directly: the whip's Thorns rolls
  // the same die, which would otherwise read as already rolling it. The multi-form parent has no
  // weapon attack (its first activity is the Dagger save), so it is left alone.
  override get activity(): IDDBActivityData | null {
    if ((this.ddbParser as DDBItem | undefined)?.parsingType !== "weapon") return null;
    const parts = unrestrictedDamageParts(this);
    if (parts.length === 0) return null;
    return { primaryOnly: true, data: { damage: { includeBase: true, parts } } };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.hasWhipThorns) return [];
    return [
      itemProperty(Thornpiercer.THORNS, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["piercing"] })],
        condition: "At the start of each of the grappled creature's turns, until it is freed",
        range: weaponRange(this),
        noeffect: true,
      }),
    ];
  }

  /**
   * On the multi-form parent the grapple belongs to the Whip save, but the auto Grappled status
   * links to every form's save; keep it on the Whip's only.
   */
  static keepGrappleOnWhip(activities: Record<string, I5eActivity>, effects: I5eEffectData[]): void {
    const grappled = new Set(effects.filter((effect) => [...(effect.statuses ?? [])].includes("grappled")).map((effect) => effect._id));
    if (grappled.size === 0) return;
    for (const activity of Object.values(activities)) {
      if (activity.type !== "save" || ["Whip", "Save"].includes(activity.name ?? "")) continue;
      activity.effects = (activity.effects ?? []).filter((link) => !grappled.has(link._id));
    }
  }

  /** Drops the "if failed Grappled save" "Restriction:" attack and the parent Whip save's damage. */
  static dropGrappleThornAttack(activities: Record<string, I5eActivity>): void {
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "attack" && (/^Restriction: if failed Grappled save/i).test(activity.name ?? "")) {
        delete activities[id];
      } else if (activity.type === "save" && activity.name === "Whip" && activity.damage) {
        activity.damage.parts = [];
      }
    }
  }

  /** The trigger, reach and damage of each form's on-hit save, keyed by its ability. */
  static FORM_SAVES: Record<string, { condition: string; range: string; damage?: I5eDamagePart[]; onSave?: string }> = {
    con: {
      condition: "The first creature you hit with the shortsword on each of your turns",
      range: "5",
    },
    str: {
      condition: "When you hit a Medium or smaller creature with the whip and attempt to grapple it",
      range: "10",
    },
  };

  /**
   * The rapier's natural-20 save: its Hit Point maximum drops by the damage the attack dealt, or
   * half on a success. dnd5e 5.2 has no "maximum" damage type (any other type comes off current Hit
   * Points), so the save carries no damage and the reduction is applied by hand.
   */
  static get RAPIER_SAVE(): { condition: string; range: string; damage: I5eDamagePart[]; onSave: string } {
    return {
      condition: "When you roll a 20 on an attack with the rapier against a Large or smaller creature: its Hit Point maximum is reduced by the attack's damage, half on a success, until it finishes a Short or Long Rest",
      range: "5",
      damage: [],
      onSave: "half",
    };
  }

  /** Retimes a parsed save to its trigger, with fresh objects (see the override). */
  static retimeSave(activity: I5eActivity, { condition, range, damage, onSave }: { condition: string; range: string; damage?: I5eDamagePart[]; onSave?: string }): void {
    if (activity.type !== "save") return;
    activity.activation = { type: "special", value: null, condition } as I5eActivity["activation"];
    activity.range = { override: true, value: range, units: "ft", special: "" } as I5eActivity["range"];
    activity.target = {
      override: true,
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: false,
    } as I5eActivity["target"];
    if (damage) {
      activity.damage = { ...(activity.damage ?? {}), onSave: onSave ?? "none", parts: damage } as I5eSaveActivity["damage"];
    }
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const activities = (enricher.data.system as { activities?: Record<string, I5eActivity> }).activities ?? {};
        Thornpiercer.dropGrappleThornAttack(activities);
        Thornpiercer.keepGrappleOnWhip(activities, enricher.data.effects ?? []);
        for (const activity of Object.values(activities)) {
          if (activity.type !== "save") continue;
          const abilities = Array.from(activity.save?.ability ?? []);
          if (abilities.includes("dex")) {
            // fresh objects: the parser builds an item's activities around shared activation, range
            // and target objects, so merging in place would retarget the weapon attack as well
            activity.activation = { type: "special", value: null, condition: "When the thrown blade reaches its target, hit or miss" } as I5eActivity["activation"];
            activity.range = { override: true, value: "60", units: "ft", special: "" } as I5eActivity["range"];
            activity.target = {
              override: true,
              template: { count: "1", contiguous: false, type: "radius", size: "10", width: "", height: "", units: "ft" },
              affects: { count: "4", type: "enemy", choice: true, special: "The target and up to three other creatures within 10 feet of it" },
              prompt: true,
            } as I5eActivity["target"];
          } else if (abilities.includes("con")) {
            // the multi-form parent names each form's save; on a form's own record the shortsword's
            // save rolls its 1d6 poison and the rapier's rolls nothing of its own
            const shortsword = activity.name === "Shortsword"
              || (activity.name !== "Rapier" && (activity.damage?.parts ?? []).length > 0);
            Thornpiercer.retimeSave(activity, shortsword ? Thornpiercer.FORM_SAVES.con : Thornpiercer.RAPIER_SAVE);
          } else if (abilities.includes("str")) {
            Thornpiercer.retimeSave(activity, Thornpiercer.FORM_SAVES.str);
          }
        }
      },
    };
  }

}
