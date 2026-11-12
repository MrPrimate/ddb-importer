import Generic from "../Generic";

/**
 * Totems (World of Warcraft Shaman, replacing Primal Knowledge): DDB's actions build Plant Totem and
 * one activity per totem. Each totem's pulse (a 30 ft Emanation at the end of the shaman's turns)
 * lasts until the end of the shaman's next turn; the effects link to the totem activities.
 */
export default class Totems extends Generic {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Earthbind Totem",
        activityMatch: "Earthbind Totem",
        options: { transfer: false, expiry: "sourceEnd" },
        changes: [Generic.ChangeHelper.movementBonusChange("-10", 20)],
      },
      {
        name: "Primal Knowledge Totem",
        activityMatch: "Primal Knowledge Totem",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "You can make Acrobatics, Intimidation, Perception, Stealth or Survival checks as Strength checks.",
        },
      },
      {
        name: "Tremor Totem",
        activityMatch: "Tremor Totem",
        options: { transfer: false, expiry: "sourceEnd" },
        changes: [
          Generic.ChangeHelper.conditionImmunityChange("charmed"),
          Generic.ChangeHelper.conditionImmunityChange("frightened"),
        ],
      },
      {
        name: "Wind Rush Totem",
        activityMatch: "Wind Rush Totem",
        options: { transfer: false, expiry: "sourceEnd" },
        changes: [Generic.ChangeHelper.movementBonusChange("10", 20)],
      },
    ];
  }

}
