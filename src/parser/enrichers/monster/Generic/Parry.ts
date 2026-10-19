import _MonsterArmorClass from "./_MonsterArmorClass";

/**
 * Parry: a reaction adding N to its AC against the melee attack that would hit it. dnd5e cannot turn
 * the rolled hit into a miss, so the bonus lasts until the start of its next turn, and with DAE ends
 * as soon as it is attacked.
 */
export default class Parry extends _MonsterArmorClass {
  protected override get selfTarget(): boolean {
    return true;
  }

  protected override get defaultExpiry(): T5eEffectExpiry {
    return "sourceStart";
  }

  protected override get daeSpecialDurations(): TDAEOnlySpecialDuration[] {
    return ["isAttacked"];
  }
}
