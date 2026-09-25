import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

export default class BeastOfBurden extends _MonsterFeatureSupport {
  override get effects(): IDDBEffectHint[] {
    if (!(/(?:one size larger|Large animal).+carrying capacity/i).test(this.text)) return [];
    return [
      {
        name: "Beast of Burden",
        changes: [_MonsterFeatureSupport.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.powerfulBuild")],
        options: { transfer: true },
      },
    ];
  }
}
