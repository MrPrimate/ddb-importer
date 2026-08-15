import DDBEnricherData from "../../data/DDBEnricherData";

export default class AngelMask extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Angel Mask (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage when you damage a creature with an attack or spell, expending a use of Bardic Inspiration.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.bard.inspiration[radiant]; usesCount=Item.bardic-inspiration; oncePerTurn; optin",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
