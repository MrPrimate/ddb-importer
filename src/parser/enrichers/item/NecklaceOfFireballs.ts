import DDBEnricherData from "../data/DDBEnricherData";
import { shippedItemSpellNames } from "./_ItemActivities";

/**
 * Necklace of Fireballs: a thrown bead detonates as a level 3 Fireball with a fixed save DC 15, and
 * more beads thrown at once raise it. The 2024 item casts Fireball from DDB's item spells, so that
 * cast takes the DC, the 60 ft throw and one bead per extra level; its own roll is the bead count.
 * A 2014 record without that cast has its Dexterity save as its own activity instead.
 */
export default class NecklaceOfFireballs extends DDBEnricherData {

  get #castsFireball(): boolean {
    return !this.is2014 || shippedItemSpellNames(this).includes("Fireball");
  }

  override get type(): IDDBActivityType | null {
    return this.#castsFireball ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    if (this.#castsFireball) {
      return {
        name: "Determine Number of Beads",
        noConsumeTargets: true,
        noTemplate: true,
        activationType: "special",
        data: {
          roll: { prompt: false, visible: true, formula: "1d6 + 3", name: "Beads" },
        },
      };
    }
    return {
      name: "Throw Bead",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: { value: "60", units: "ft" },
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["fire"] })],
        },
        target: {
          template: { count: "1", type: "sphere", size: "20", units: "ft" },
          affects: { type: "creature" },
        },
      },
    };
  }

  override async customFunction({ name, activity }: ICustomFunctionOptions) {
    if (name !== "Fireball" || !activity) return;
    const update = {
      name: "Throw Bead",
      range: { override: true, units: "ft", value: "60" },
      spell: {
        challenge: { save: 15, override: true },
        level: 3,
      },
      consumption: {
        // "increase the damage of the Fireball by 1d6 for each bead after the first (maximum 12d6)"
        scaling: { allowed: true, max: "min(5, @item.uses.value)" },
        targets: [{ type: "itemUses", target: "", value: "1", scaling: { mode: "amount", formula: "" } }],
      },
    } as Partial<I5eCastActivity>;
    activity.data = foundry.utils.mergeObject(activity.data as I5eCastActivity, update) as I5eCastActivity;
  }

}
