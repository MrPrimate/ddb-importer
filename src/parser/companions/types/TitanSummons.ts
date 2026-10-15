import { getPatreonMonsterSummons } from "./PatreonMonsterSummons";
import { TITANS, titanKey } from "./_titans";

/**
 * Scroll of Titan Summoning: the titans are Monster Manual stat blocks, which the proxy only
 * serves by id to Patreon supporters, so the summons are built only for them.
 */
export async function getTitanSummons(_data: ICompanionData): Promise<ICompanionResult> {
  const titans = TITANS.map((titan) => ({ key: titanKey(titan.name), name: titan.name, ddbId: titan.ddbId }));
  return getPatreonMonsterSummons(titans, "Scroll of Titan Summoning");
}
