import _MonsterDetachCheck from "./_MonsterDetachCheck";
export default class StickyShield extends _MonsterDetachCheck {
  protected override get checkName(): string {
    return "Free Weapon Check";
  }

  override async cleanup(): Promise<void> {
    if ((/escape DC/i).test(this.text)) {
      const escape = this.activities.find((a) => a.name === "Escape Check");
      if (escape) {
        escape.activation = {
          type: "action",
          value: 1,
          condition:
            "The grappled creature attempts to escape. Freeing the weapon uses the separate Free Weapon Check.",
        };
        escape.consumption = { targets: [], spellSlot: false };
      }
    }
  }
}
