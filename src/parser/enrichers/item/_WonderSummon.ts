import DDBEnricherData from "../data/DDBEnricherData";
import { findWonder, wonderKey } from "../../companions/types/_wonders";

/**
 * Heroes of Faerun Mechanical Wonders: winding one with its key for a minute wakes it as a creature
 * with its own stat block, an ally that obeys you, for as long as its Wind-Up Operation trait says.
 * The stat blocks are book monsters the proxy serves only to Patreon supporters, so for them the
 * winding is a summon; everyone else gets it as a plain activity.
 */
export default abstract class _WonderSummon extends DDBEnricherData {

  get #wonder(): ReturnType<typeof findWonder> {
    return findWonder(this.ddbParser?.originalName ?? this.data?.name);
  }

  // the stored tier, read through the module api (the Patreon helper is not a leaf module)
  get #summonsWonder(): boolean {
    const patreon = globalThis.DDBImporter?.patreon;
    if (!patreon || !this.#wonder) return false;
    return patreon.calculateAccessMatrix(patreon.getPatreonTier()).all;
  }

  override get type(): IDDBActivityType | null {
    return this.#summonsWonder ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.#summonsWonder ? DDBImporter.lib.DDBSummonsInterface.getWonderSummons : null;
  }

  override get generateSummons(): boolean {
    return this.#summonsWonder;
  }

  override get activity(): IDDBActivityData {
    const wonder = this.#wonder;
    const base: IDDBActivityData = {
      name: "Wind Up",
      activationType: "minute",
      activationValue: 1,
      noTemplate: true,
      data: {
        range: { override: true, units: "touch" },
        ...(wonder ? { duration: { ...wonder.duration, override: true } } : {}),
      },
    };
    if (!this.#summonsWonder || !wonder) return base;
    return {
      ...base,
      profileKeys: [{ count: "1", name: wonderKey(wonder.name) }],
      summons: {
        // the wonder is an ally to you and your allies
        match: { proficiency: false, attacks: false, saves: false, disposition: true },
        bonuses: { ac: "", hp: "", attackDamage: "", saveDamage: "", healing: "" },
      },
    };
  }

}
