import AuraOf from "../../generic/AuraOf";

/**
 * Oath of Glory's aura. The paladin's own +10 Speed comes from DDB's speed modifier, so the aura
 * reaches allies only. The 2024 aura is the Aura of Protection's area; the 2014 aura reaches 5 feet,
 * 10 feet from 18th level, which DDB ships no scale for, so it is worked out from the paladin's
 * level. Otherwise the aura is built like the other paladin auras.
 */
export default class AuraOfAlacrity extends AuraOf {

  get auraSize(): string {
    return this.is2014
      ? "min(10, 5 + (5 * floor(@classes.paladin.levels / 18)))"
      : super.auraSize;
  }

}
