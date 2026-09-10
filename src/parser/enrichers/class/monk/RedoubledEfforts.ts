import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "When you score a Critical Hit while you are Bloodied, you can roll one additional damage die
 * when determining the extra damage the target takes." The extra die is the Martial Arts die: a
 * monk's crits are Unarmed Strikes and Monk weapons, whose die the Martial Arts die replaces when
 * larger, and the rolled weapon's own die is not reachable as a formula term without risking an
 * unrollable "1d" on custom-damage weapons.
 */
export default class RedoubledEfforts extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Redoubled Efforts",
        options: {
          transfer: true,
          description: "One additional Martial Arts die of damage on a Critical Hit while you are Bloodied. Needs the Bloodied status (dnd5e's Bloodied setting) on the monk.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "@scale.monk.die.die", {
            conditions: [
              DDBEnricherData.ChangeHelper.statusFilter("bloodied"),
              { k: "roll.isCritical", o: "exact", v: true },
            ],
          }),
        ],
      },
    ];
  }

}
