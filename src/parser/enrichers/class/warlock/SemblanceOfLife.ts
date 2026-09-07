import { CompendiumHelper, logger } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

const SPIRIT_SPELLS = ["Summon Celestial", "Summon Fiend", "Summon Undead"];
const SHAPESHIFT_ACTION = "Shapeshift Vestige Companion";

/**
 * Vestige Patron level 14. A direct-mode transform of the (targeted) vestige token into one of the
 * Celestial/Fiendish/Undead Spirit forms. The profiles are filled in cleanup() from the summon
 * profiles of the compendium Summon Celestial/Fiend/Undead spells, so those spells need to have
 * been munched with companions. DDB's per-form actions (Temp HP, Radiant Mace...) ride along via
 * mergeChoiceActivities, and this pins the once-per-long-rest use.
 *
 * The form should use the `semblance-spirit-level` scale value (DDBSubClass._warlockFixes) as its
 * spell level, but the compendium companion actor holds the base stat block and its `@item.level`
 * bonuses live on the summon activity, so the transform cannot apply that scaling.
 */
export default class SemblanceOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      name: SHAPESHIFT_ACTION,
      activationType: "action",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 90,
      addItemConsume: true,
      data: {
        duration: { value: "1", units: "hour" },
        transform: {
          customize: true,
          mode: "",
          preset: "polymorph",
        },
        settings: {
          effects: ["origin", "otherOrigin", "spell"],
          keep: ["hp", "feats", "bio"],
          tempFormula: "@source.attributes.hp.max",
          preset: "polymorph",
          transformTokens: true,
        },
        profiles: [],
      },
    };
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get mergeChoiceActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: { spent: null, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    };
  }

  /**
   * The summon profiles of the named spells in the spell compendium, preferring this feature's
   * ruleset and falling back to the other (both printings carry the same spirit forms).
   */
  async _spiritProfiles(compendiumName: string): Promise<{ profiles: I5eSummonProfile[]; missing: string[] }> {
    const profiles: I5eSummonProfile[] = [];
    const rules = this.is2024 ? ["2024", "2014"] : ["2014", "2024"];
    let missing = [...SPIRIT_SPELLS];

    for (const rule of rules) {
      if (missing.length === 0) break;
      const docs = await CompendiumHelper.retrieveMatchingCompendiumItems(missing, compendiumName, {
        "system.source.rules": rule,
      });
      for (const doc of docs) {
        const system = "system" in doc ? doc.system : null;
        const activities = (system && "activities" in system ? system.activities : {}) as Record<string, I5eActivity>;
        const summon = Object.values(activities ?? {}).find((a): a is I5eSummonActivity => a.type === "summon");
        const found = (summon?.profiles ?? []).filter((p) => p.uuid);
        if (found.length === 0) continue;
        missing = missing.filter((name) => name !== doc.name);
        for (const profile of found) {
          profiles.push({
            _id: foundry.utils.randomID(),
            name: profile.name ?? "",
            uuid: profile.uuid,
            cr: "",
            level: { min: null, max: null },
            sizes: [],
            types: [],
            movement: [],
          });
        }
      }
    }

    return { profiles, missing };
  }

  override async cleanup(): Promise<void> {
    const activities = this.data?.system?.activities as Record<string, I5eActivity> | undefined;
    if (!activities) return;

    const transform = Object.values(activities).find((a): a is I5eTransformActivity => a.type === "transform");
    if (!transform) return;

    // DDB's own action for the feature is the transform, drop its utility copy
    for (const [id, activity] of Object.entries(activities)) {
      if (activity.type === "utility" && activity.name === SHAPESHIFT_ACTION) delete activities[id];
    }

    // no configured spell compendium (e.g. the audit harness): the forms cannot be linked
    const pack = CompendiumHelper.getCompendiumType("spell", false);
    if (!pack) return;

    const { profiles, missing } = await this._spiritProfiles(pack.metadata.id);
    transform.profiles = profiles;

    if (missing.length > 0) {
      logger.warn(`Semblance of Life: no summon profiles found for ${missing.join(", ")}; munch those spells with companions and re-import to link the spirit forms`);
    }
  }
}
