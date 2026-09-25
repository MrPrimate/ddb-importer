import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneEloquence extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Smooth Talker",
        options: {
          transfer: true,
          description: "Add 1d4 to Charisma (Deception, Intimidation or Persuasion) checks.",
        },
        changes: ["dec", "itm", "per"].map((skill) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, `system.skills.${skill}.bonuses.check`),
        ),
      },
    ];
  }

}
