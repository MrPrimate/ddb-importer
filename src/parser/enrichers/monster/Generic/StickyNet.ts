import _MonsterDetachCheck from "./_MonsterDetachCheck";
export default class StickyNet extends _MonsterDetachCheck {
  protected override get checkName(): string {
    return "Free from Net";
  }
}
