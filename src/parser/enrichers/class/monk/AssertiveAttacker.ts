import DDBEnricherData from "../../data/DDBEnricherData";

export default class AssertiveAttacker extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Assertive Attacker",
        options: {
          transfer: true,
          description: "While you are Bloodied, you add your Wisdom modifier to the damage you deal with Unarmed Strikes and Monk weapons. Needs the Bloodied status (dnd5e's Bloodied setting) on the monk.",
        },
        changes: [
          // the rule reads the monk's own bloodied status and the weapon being rolled, so the
          // effect stays on instead of being a toggle that also caught every melee weapon
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@abilities.wis.mod", {
            conditions: [
              DDBEnricherData.ChangeHelper.statusFilter("bloodied"),
              DDBEnricherData.ChangeHelper.MONK_WEAPON_FILTER,
            ],
          }),
        ],
      },
    ];
  }

}
