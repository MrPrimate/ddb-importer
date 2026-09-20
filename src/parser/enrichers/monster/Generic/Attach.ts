import _MonsterDetachCheck from "./_MonsterDetachCheck";
export default class Attach extends _MonsterDetachCheck {
  protected override get checkName(): string {
    return "Detach Check";
  }
}
