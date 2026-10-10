import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The character level a fabled item record is for: "(Lv. 13)", "(13th Level)", or "(Base)" for the
 * minor property alone. DDB ships one record per level plus an unsuffixed record describing every
 * level, which reads as level 20.
 */
export function fabledLevel(recordName: string): number {
  if ((/\(Base\)\s*$/i).test(recordName)) return 1;
  const match = (/\((?:Lv\. (\d+)|(\d+)(?:st|nd|rd|th) Level)\)\s*$/i).exec(recordName);
  return match ? Number(match[1] ?? match[2]) : 20;
}

/**
 * Base for a fabled wondrous item (Skinchanger Arm Ring, Shadow Grimoire): each level record gets
 * the activities its level has reached. The parser's generic activity and item uses describe the
 * levelled text badly, so both are replaced.
 */
export default abstract class FabledItem extends DDBEnricherData {

  /** The record name DDB gives this level, e.g. "Skinchanger Arm Ring (Lv. 13)". */
  get recordName(): string {
    return this.ddbParser?.originalName ?? this.name;
  }

  get level(): number {
    return fabledLevel(this.recordName);
  }

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get override(): IDDBOverrideData {
    return { uses: { spent: 0, max: "", recovery: [] } };
  }

}
