import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Base for Fizban's hoard items, which DDB ships as one record per stage ("Scaled Ornament
 * (Wakened)") plus an unsuffixed record. Each stage record carries its own cumulative text and
 * modifiers, so the effects the parser builds already follow the stage; the subclasses add the
 * activities the stage has reached. The parser's generic activity and item uses describe the
 * once-per-dawn text badly, so both are replaced.
 */
export default abstract class HoardItem extends DDBEnricherData {

  static STAGES = ["slumbering", "stirring", "wakened", "ascendant"];

  /** The record name DDB gives this stage, e.g. "Dragon Vessel (Stirring)". */
  get recordName(): string {
    return this.ddbParser?.originalName ?? this.name;
  }

  /**
   * 0 Slumbering, 1 Stirring, 2 Wakened, 3 Ascendant. The unsuffixed record carries every stage's
   * text and modifiers, so it reads as Ascendant.
   */
  get stage(): number {
    const match = (/\((Slumbering|Stirring|Wakened|Ascendant)\)\s*$/i).exec(this.recordName);
    return match ? HoardItem.STAGES.indexOf(match[1].toLowerCase()) : 3;
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

  /** Gives an activity its own use, recovered at dawn ("can't be used again until the next dawn"). */
  static oncePerDawn(activity: IDDBAdditionalActivity): IDDBAdditionalActivity {
    const uses: I5eSystemLimitedUses = { spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] };
    return {
      ...activity,
      overrides: {
        ...activity.overrides,
        noConsumeTargets: false,
        addActivityConsume: true,
        data: { ...activity.overrides?.data, uses },
      },
    };
  }

}
