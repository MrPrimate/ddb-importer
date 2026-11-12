import DDBEnricherData from "../../data/DDBEnricherData";

export default class CircleForms extends DDBEnricherData {

  /**
   * The CR cap for a Circle Forms profile: the floor, raised to a third of the circle's levels.
   * Names both identifier forms because dnd5e 6.1 migrates Circle of the Moon's `moon` to
   * `circle-moon` on actors imported earlier (a missing one resolves to 0).
   */
  circleCR(floor: string): string {
    const levels = this.subclassIdentifiers(this.ddbParser.subKlass ?? "Circle of the Moon")
      .map((id) => `@subclasses.${id}.levels / 3`);
    return `max(${floor}, ${levels.join(", ")})`;
  }
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        duration: {
          value: `(floor(@classes.${this.classIdentifier("Druid")}.levels / 2))`,
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
        // the wildshape preset supplies the Moon druid's 13 + Wisdom minimum AC and temp HP
        transform: {
          customize: false,
          identifier: this.classIdentifier("Druid"),
          preset: "wildshape",
          mode: "cr",
        },
        profiles: [
          {
            cr: this.circleCR("1/4"),
            name: "Circle Form",
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
            cr: this.circleCR("1/2"),
            name: "Circle Form",
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
            cr: this.circleCR("1"),
            name: "Circle Form",
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

}
