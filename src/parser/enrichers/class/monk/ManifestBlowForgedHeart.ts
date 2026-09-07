import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManifestBlowForgedHeart extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Forged Heart (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with an Unarmed Strike. The damage type matches the strike.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.monk.die; oncePerTurn; optin; item.name.includes('Unarmed')",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
