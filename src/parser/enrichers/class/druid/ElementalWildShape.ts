import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * 2014 Circle of the Moon: spending two Wild Shape uses at once turns the druid into an air, earth,
 * fire or water elemental. One profile per elemental, pinned to the 2014 stat block's DDB id;
 * resolveTransformProfileUuids links each from the monster compendium on import, munching it first
 * if absent. The rest of the transformation follows Wild Shape (preset, duration).
 */
export default class ElementalWildShape extends DDBEnricherData {

  static ELEMENTALS: Record<string, number> = {
    "Air Elemental": 16774,
    "Earth Elemental": 16853,
    "Fire Elemental": 16861,
    "Water Elemental": 17051,
  };

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Elemental Wild Shape",
      noTemplate: true,
      targetType: "self",
      rangeSelf: true,
      // Combat Wild Shape (2nd level) already makes Wild Shape a bonus action for a Moon druid
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      itemConsumeValue: "2",
      data: {
        duration: {
          value: "(floor(@classes.druid.levels / 2))",
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
        transform: {
          customize: false,
          identifier: "druid",
          preset: "wildshape",
          mode: "",
        },
        // "Name#ddbId" is read and cleaned by resolveTransformProfileUuids
        profiles: Object.entries(ElementalWildShape.ELEMENTALS).map(([name, ddbId]) => ({
          cr: "",
          name: `${name}#${ddbId}`,
          uuid: undefined,
          sizes: [],
          types: [],
          movement: [],
          level: {
            min: 10,
            max: null,
          },
        })),
      },
    };
  }

}
