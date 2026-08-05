import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraveStrike extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        // only applies against creature types recorded in the Monster
        // Grimoire, which an effect cannot detect - ships disabled so the
        // player toggles it when fighting studied creatures
        name: "Grave Strike",
        options: {
          transfer: true,
          disabled: true,
          description: "Attack rolls with weapons and Unarmed Strikes against creature types in your Monster Grimoire score a Critical Hit on an 18-20.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange("bonus=18", 20, "flags.automated-conditions-5e.attack.criticalThreshold"),
        ],
      },
    ];
  }

}
