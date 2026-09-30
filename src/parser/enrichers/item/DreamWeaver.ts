import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024. The tapestry's benefits need it hung and you within 30 feet of it. Dream Wisdom rolls
 * the d20 recorded at the end of a Long Rest (the replacement itself is left to the player).
 * Mind Wall (Advantage on Intelligence, Wisdom and Charisma saves while Unconscious) is a
 * disabled transfer effect to switch on while in range and Unconscious.
 */
export default class DreamWeaver extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dream Wisdom",
      targetType: "self",
      activationType: "special",
      activationCondition: "At the end of a Long Rest after studying the tapestry for 1 hour; replaces one D20 Test before the next Long Rest",
      noTemplate: true,
      data: {
        range: { units: "self" },
        duration: { units: "inst" },
        roll: {
          prompt: false,
          visible: true,
          name: "Dream Wisdom",
          formula: "1d20",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mind Wall",
        options: {
          transfer: true,
          disabled: true,
          description: "While the tapestry is hung, you are within 30 feet of it and you are Unconscious: Advantage on Intelligence, Wisdom and Charisma saves.",
        },
        // dnd5e 5.x cannot gate a roll mode on a status, so the effect is also switched on only while Unconscious
        changes: ["int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
        ),
      },
    ];
  }

}
