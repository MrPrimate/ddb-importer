import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { findSRDItemSummon, srdCreatureKey } from "../../companions/types/SRDItemSummonTable";
import { areaPlacer, areaTrigger } from "../data/AreaBuilders";

/**
 * Magic items that put a creature or an object on the map: figurines, bags of tricks, horns,
 * elemental gems and the rest of the items the dnd5e SRD packs ship with a summon activity. One
 * enricher serves them all, driven by `SRD_ITEM_SUMMONS`; the name hints that route an item here
 * are generated from that same table, so an item without an entry never reaches this.
 *
 * A summon either replaces the item's primary activity (the item does nothing else) or sits
 * beside it (Staff of the Python still attacks, Pipes of the Sewers still forces its save).
 *
 * An aura the creature gives off (the Goat of Terror) cannot live on the creature, which is a
 * stock SRD actor. It is placed from the item instead: the rider places the emanation on the
 * goat's token, and the save it forces is kept on the item to use by hand.
 */
export default class SRDSummonItem extends DDBEnricherData {

  get entry(): ISRDItemSummon | null {
    return findSRDItemSummon(this.ddbParser?.originalName ?? this.data?.name);
  }

  get profileKeys(): IDDBSummonProfileKey[] {
    return (this.entry?.profiles ?? []).map((profile) => ({
      count: (!this.is2014 && profile.count2024) || profile.count || "1",
      name: profile.creature ? srdCreatureKey(profile.creature, this.is2014) : profile.object ?? "",
    }));
  }

  get summons(): IDDBSummonsData {
    return {
      match: {
        proficiency: false,
        attacks: false,
        saves: false,
        // the called creature is friendly to the user: it takes their token disposition, unless
        // the item says it is not under their control
        disposition: !this.entry?.uncontrolled,
      },
      bonuses: {
        ac: "",
        hp: "",
        attackDamage: "",
        saveDamage: "",
        healing: "",
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return this.entry?.placement === "primary" ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : null;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.generateSummons ? DDBImporter.lib.DDBSummonsInterface.getSRDItemSummons : null;
  }

  override get generateSummons(): boolean {
    return (this.entry?.profiles.length ?? 0) > 0;
  }

  override get activity(): IDDBActivityData | null {
    const entry = this.entry;
    if (entry?.placement !== "primary") return null;
    return {
      name: entry.activityName,
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.profileKeys,
      summons: this.summons,
      ...this.chargeScaling,
      ...(entry.reuseDays ? { addItemConsume: true, itemConsumeValue: "@item.uses.max" } : {}),
      ...(entry.activationCondition ? { activationType: "special" as const, activationCondition: entry.activationCondition } : {}),
      ...(entry.duration ? { data: { duration: entry.duration } } : {}),
    };
  }

  override get override(): IDDBOverrideData | null {
    const days = this.entry?.reuseDays;
    if (!days) return null;
    return itemUses(this, String(days), [{ period: "day", type: "formula", formula: "1" }]);
  }

  /** One charge per creature, scaled by amount: the profile count reads the charges spent as @scaling. */
  get chargeScaling(): Partial<IDDBActivityData> {
    const max = this.entry?.chargesPerCreature?.max;
    if (!max) return {};
    return {
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addScalingFormula: "1",
      addConsumptionScalingMax: max,
    };
  }

  get auraActivities(): IDDBAdditionalActivity[] {
    const aura = this.entry?.aura;
    if (!aura) return [];
    const saveName = `${aura.name}: Save`;
    return [
      areaPlacer(`${aura.name}: Aura`, {
        template: { type: "radius", size: aura.size, count: "1" },
        affects: aura.affects,
        activationType: "special",
        activationCondition: aura.condition,
        duration: { units: "spec", special: "While the creature is ridden" },
      }),
      areaTrigger(saveName, {
        affects: aura.affects,
        condition: "A creature starts its turn in the aura",
        save: aura.save,
      }),
    ];
  }

  /**
   * The status DDB's text names belongs to the aura's save. Left in, the parsed effect is linked
   * to the summon as well and takes the save's place in the link before the aura's own arrives.
   */
  override get clearAutoEffects(): boolean {
    return Boolean(this.entry?.aura);
  }

  override get effects(): IDDBEffectHint[] {
    const aura = this.entry?.aura;
    if (!aura) return [];
    return [
      {
        name: aura.name,
        statuses: [aura.status] as IDDBEffectHint["statuses"],
        activityMatch: `${aura.name}: Save`,
        options: {
          transfer: false,
          durationSeconds: aura.durationSeconds,
          description: "Repeats the save at the end of each of its turns, ending the effect on a success.",
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    const entry = this.entry;
    if (entry?.placement !== "additional") return this.auraActivities.length > 0 ? this.auraActivities : null;
    return [
      {
        init: {
          name: entry.activityName,
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
          generateActivation: true,
          activationOverride: {
            type: entry.activationType ?? "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          noTemplate: true,
          ...(entry.blankProfile ? {} : { profileKeys: this.profileKeys, summons: this.summons }),
          data: {
            ...(entry.blankProfile ? { summon: { mode: "", prompt: true }, profiles: [{ name: "", count: "1" }] } : {}),
            ...(entry.duration ? { duration: entry.duration } : {}),
            // without override dnd5e takes a weapon's own reach as the activity range
            ...(entry.range ? { range: { override: true, value: String(entry.range.value), units: entry.range.units } } : {}),
          },
        },
      },
    ];
  }

}
