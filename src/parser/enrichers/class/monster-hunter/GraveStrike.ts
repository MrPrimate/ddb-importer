import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraveStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  // the DC is the damage dealt by the critical hit (max 30), which no formula can see, so the
  // save ships with a custom DC for the player to fill in when they use it
  override get activity(): IDDBActivityData {
    return {
      name: "Grave Strike",
      activationType: "special",
      activationCondition: "When you score a Critical Hit against a creature type in your Monster Grimoire. The DC equals the damage taken, up to 30",
      targetType: "creature",
      targetCount: 1,
      addItemConsume: true,
      noeffect: true,
      data: {
        range: {
          units: "spec",
        },
        save: {
          ability: ["con"],
          dc: {
            calculation: "custom",
            formula: "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
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
          DDBEnricherData.ChangeHelper.ac5eChange("bonus=18", 20, "flags.automated-conditions-5e.attack.criticalThreshold"),
        ],
      },
    ];
  }

}
