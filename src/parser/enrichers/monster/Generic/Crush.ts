import _MonsterDetachCheck from "./_MonsterDetachCheck";
export default class Crush extends _MonsterDetachCheck {
  protected override get checkName(): string {
    return "Detach Check";
  }
}
