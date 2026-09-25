import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Freedom of Movement: difficult terrain costs no extra movement and magic cannot reduce speed or cause the Paralyzed or Restrained condition.
 */
export default class FreedomOfMovement extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unrestricted Movement",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("paralyzed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("restrained"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("all", 20, "system.attributes.movement.ignoredDifficultTerrain"),
        ],
        options: {
          description: "Difficult terrain costs no extra movement; magic can't reduce your speed or make you Paralyzed or Restrained; you can spend 5 feet of movement to escape nonmagical restraints or a grapple; being underwater imposes no penalties.",
        },
      },
    ];
  }

}
