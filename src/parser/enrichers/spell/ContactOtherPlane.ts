import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Contact Other Plane: the DC 15 Intelligence save against the entity, with 6d6 psychic damage and insanity until a long rest on a failure.
 */
export default class ContactOtherPlane extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Contact Entity",
      targetType: "self",
      data: {
        save: {
          ability: ["int"],
          dc: { calculation: "custom", formula: "15" },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 6,
              denomination: 6,
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Contact Other Plane: Insanity",
        options: {
          description: "On a failed save you can't cast spells or take actions until you finish a Long Rest, unless cured by Greater Restoration.",
        },
      },
    ];
  }

}
