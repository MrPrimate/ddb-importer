import _MonsterArmorClass from "./_MonsterArmorClass";

export default class Counterattack extends _MonsterArmorClass {
  protected override get selfTarget(): boolean {
    return true;
  }
}
