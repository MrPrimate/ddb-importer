import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A Magic action: a 20-foot sphere within 120 feet, Dexterity save against the monk's DC,
 * three Martial Arts dice of the chosen type and half on a success. The sphere's template is
 * read from the text; the range and save are not.
 */
export default class ElementalBurst extends DDBEnricherData {
  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "action",
      targetType: "creature",
      data: {
        range: { value: "120", units: "ft" },
        save: {
          ability: ["dex"],
          dc: { calculation: "wis", formula: "" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.elements.elemental-burst",
              types: ["acid", "cold", "fire", "lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }
}
