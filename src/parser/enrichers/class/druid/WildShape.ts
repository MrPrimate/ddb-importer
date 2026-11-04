import DDBEnricherData from "../../data/DDBEnricherData";

export default class WildShape extends DDBEnricherData {

  /**
   * The CR cap for a Wild Shape profile: the floor, raised to a third of the druid level for
   * Circle of the Moon. dnd5e 6.1 migrates Moon's `moon` identifier to `circle-moon` on actors
   * imported earlier, so the formula names both (a missing one resolves to 0).
   */
  moonCR(floor: string): string {
    const levels = this.subclassIdentifiers("Circle of the Moon").map((id) => `@subclasses.${id}.levels / 3`);
    return `max(${floor}, ${levels.join(", ")})`;
  }
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
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
          mode: "cr",
        },
        profiles: [
          {
            cr: this.moonCR("1/4"),
            name: "Wildshape",
            uuid: undefined,
            sizes: [],
            types: ["beast"],
            movement: ["fly"],
            level: {
              min: 2,
              max: 3,
            },
          },
          {
            cr: this.moonCR("1/2"),
            name: "Wildshape",
            uuid: undefined,
            sizes: [],
            types: ["beast"],
            movement: ["fly"],
            level: {
              min: 4,
              max: 7,
            },
          },
          {
            cr: this.moonCR("1"),
            name: "Wildshape",
            uuid: undefined,
            sizes: [],
            types: ["beast"],
            movement: [],
            level: {
              min: 8,
              max: null,
            },
          },
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Wild Shape",
      max: "@scale.druid.wild-shape-uses",
      period: this.is2014 ? "sr" : "lr",
    });

    if (this.is2024) {
      uses.recovery ??= [];
      uses.recovery.push({
        period: "sr",
        type: "formula",
        formula: "1",
      });
    }

    return {
      uses,
    };
  }
}
