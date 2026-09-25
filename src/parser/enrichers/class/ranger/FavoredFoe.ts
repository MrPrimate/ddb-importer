import DDBEnricherData from "../../data/DDBEnricherData";

export default class FavoredFoe extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "system.identifier": "favored-foe",
      },
    };
  }

  override get additionalAdvancements(): I5eAdvancement[] {
    // the damage die scales with ranger level (1d4, 1d6 at 6th, 1d8 at 14th);
    // the feature-held scale value surfaces as @scale.favored-foe.die
    return [
      DDBEnricherData.AdvancementBuilder.buildDiceScale({
        name: "Favored Foe Damage",
        identifier: "die",
        hint: "The extra damage dealt to a marked favored enemy.",
        scale: {
          1: { number: 1, faces: 4 },
          6: { number: 1, faces: 6 },
          14: { number: 1, faces: 8 },
        },
      }),
    ];
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
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.favored-foe.die; oncePerTurn; optin; hasAttack",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
