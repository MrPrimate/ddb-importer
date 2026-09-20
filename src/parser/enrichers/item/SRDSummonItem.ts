import DDBEnricherData from "../data/DDBEnricherData";
import { findSRDItemSummon, srdCreatureKey } from "../../companions/types/SRDItemSummonTable";

/**
 * Magic items that put a creature or an object on the map: figurines, bags of tricks, horns,
 * elemental gems and the rest of the items the dnd5e SRD packs ship with a summon activity. One
 * enricher serves them all, driven by `SRD_ITEM_SUMMONS`; the name hints that route an item here
 * are generated from that same table, so an item without an entry never reaches this.
 *
 * A summon either replaces the item's primary activity (the item does nothing else) or sits
 * beside it (Staff of the Python still attacks, Pipes of the Sewers still forces its save).
 */
export default class SRDSummonItem extends DDBEnricherData {

  get entry(): ISRDItemSummon | null {
    return findSRDItemSummon(this.ddbParser?.originalName ?? this.data?.name);
  }

  get profileKeys(): IDDBSummonProfileKey[] {
    return (this.entry?.profiles ?? []).map((profile) => ({
      count: profile.count ?? "1",
      name: profile.creature ? srdCreatureKey(profile.creature, this.is2014) : profile.object ?? "",
    }));
  }

  get summons(): IDDBSummonsData {
    return {
      match: {
        proficiency: false,
        attacks: false,
        saves: false,
        // the called creature is friendly to the user: it takes their token disposition
        disposition: true,
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
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] | null {
    const entry = this.entry;
    if (entry?.placement !== "additional") return null;
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
          ...(entry.blankProfile
            ? { data: { summon: { mode: "", prompt: true }, profiles: [{ name: "", count: "1" }] } }
            : { profileKeys: this.profileKeys, summons: this.summons }),
        },
      },
    ];
  }

}
