import _MonsterTemporaryHP from "./_MonsterTemporaryHP";

export default class Fortify extends _MonsterTemporaryHP {
  protected override get selfTarget(): boolean {
    return true;
  }
}
