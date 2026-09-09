import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverBestialTransformation extends DDBEnricherData {

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Bestial Transformation"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Polymorph (Self)",
      activationType: "action",
      targetType: "self",
      addSpellUuid: "Polymorph",
      data: {
        spell: {
          spellbook: false,
        },
        description: {
          chatFlavor: "Constitution is your spellcasting ability, and you can only become a beast of CR half your level or lower.",
        },
      },
    };
  }

}
