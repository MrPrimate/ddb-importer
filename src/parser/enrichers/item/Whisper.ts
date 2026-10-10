import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, weaponRange } from "./_ItemActivities";

/**
 * Whisper, a staged artifact dagger (Dormant, Awakened, Exalted; the unsuffixed record carries the
 * exalted text). Exalted, a ranged attack with it can carry the wielder along as shadow: a
 * teleport to within 5 feet of the target on a hit, or to where the dagger lands on a miss, so the
 * reach is the dagger's long throwing range. The parsed attack and critical-hit fright save stay.
 */
export default class Whisper extends DDBEnricherData {

  static SHADOW = "Shadow Merge";

  /** The stage: 0 dormant, 1 awakened, 2 exalted (the unsuffixed record reads as exalted). */
  get stage(): number {
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(this.ddbParser?.originalName ?? this.name);
    return match ? ["dormant", "awakened", "exalted"].indexOf(match[1].toLowerCase()) : 2;
  }

  override get keepParsedActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.stage < 2) return [];
    return [
      itemActivity(Whisper.SHADOW, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "special",
          value: null,
          condition: "As part of a ranged attack with the dagger: on a hit, appear in an unoccupied space within 5 feet of the target; on a miss, where the dagger lands (typically within 1d6 x 5 feet of the target)",
        },
        rangeOverride: weaponRange(this),
      }),
    ];
  }

}
