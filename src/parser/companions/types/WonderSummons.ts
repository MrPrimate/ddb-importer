import { getPatreonMonsterSummons } from "./PatreonMonsterSummons";
import { findWonder, wonderKey } from "./_wonders";

/**
 * Heroes of Faerun Mechanical Wonders: the wonder's stat block is a book monster, which the proxy
 * only serves by id to Patreon supporters, so the summons are built only for them.
 */
export async function getWonderSummons({ ddbParser }: ICompanionData): Promise<ICompanionResult> {
  const wonder = findWonder(ddbParser.originalName);
  if (!wonder) return {};
  return getPatreonMonsterSummons(
    [{ key: wonderKey(wonder.name), name: wonder.name, ddbId: wonder.ddbId }],
    "Mechanical Wonders",
  );
}
