import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalBurst extends DDBEnricherData {
  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
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
