import DDBEnricherData from "../../data/DDBEnricherData";

export default class EventHorizon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "action",
      activationCondition: "Hostile creatures starting their turn within 30 ft; lasts 1 minute (concentration)",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        range: {
          units: "self",
        },
        target: {
          template: {
            type: "radius",
            size: "30",
            units: "ft",
            count: "",
            contiguous: false,
            width: "",
            height: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, type: "force" }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Event Horizon: Held",
        options: {
          durationRounds: 1,
          description: "Speed 0 until the start of its next turn (on a success, every foot of movement costs 2 extra feet this turn).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0", 50, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
