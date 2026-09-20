import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Thaumaturgy: the booming voice option gives advantage on Charisma (Intimidation) checks for a minute.
 */
export default class Thaumaturgy extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Booming Voice",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.skills.itm.roll.mode"),
        ],
        options: {
          durationSeconds: 60,
          description: "Your voice booms up to three times as loud as normal; advantage on Charisma (Intimidation) checks.",
        },
      },
    ];
  }

}
