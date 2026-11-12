import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Druid): Tree of Life form: Large, Speed 10 ft, +2 AC, Paralyzed / Restrained immunity; the 10 Temporary Hit Points are the parsed heal.
 */
export default class TreeOfLife extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tree of Life",
        options: {
          durationSeconds: 60,
          description: "Difficult Terrain costs you no extra movement. Spells you cast with a slot that restore Hit Points restore an extra 1d8.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.overrideChange("lg", 30, "system.traits.size"),
          ...DDBEnricherData.ChangeHelper.speedCapChanges("10"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("paralyzed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("restrained"),
        ],
      },
    ];
  }

}
