import DDBEnricherData from "../../data/DDBEnricherData";

export default class FavoredFoe extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        // the Favored Foe die scale is read against the Ranger's level, not the total level
        flags: this.classAdvancementRootFlags("Ranger"),
        "system.identifier": "favored-foe",
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Favored Foe (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional extra damage on the first hit against your marked favored enemy each turn. AC5e cannot check which creature is marked or track concentration on the mark.",
        },
        ac5eChanges: [
          // the die is the Ranger's own scale value: DDBClass renames DDB's Favored Foe scale to "die"
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.ranger.die; oncePerTurn; optin; hasAttack",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
