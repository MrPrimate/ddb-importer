import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "When you score a Critical Hit while you are Bloodied, you can roll one additional damage die
 * when determining the extra damage the target takes." dnd5e's `meleeCriticalDamageDice` flag does
 * exactly that for melee weapon attacks, which covers a monk's Unarmed Strikes and weapons: the
 * extra die is the weapon's own damage die, and it is added once. A damage rule bonus would not
 * do: its dice are part of the roll, so a critical doubles them. The change applies only while the
 * monk is Bloodied (dnd5e's Bloodied status).
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
          description: "One additional damage die on a melee Critical Hit while you are Bloodied. Needs the Bloodied status (dnd5e's Bloodied setting) on the monk.",
        },
        changes: [
          {
            ...DDBEnricherData.ChangeHelper.addChange("1", 20, "flags.dnd5e.meleeCriticalDamageDice"),
            conditions: DDBEnricherData.ChangeHelper.conditions(DDBEnricherData.ChangeHelper.statusFilter("bloodied")),
          },
        ],
      },
    ];
  }

}
