import DDBEnricherData from "../../data/DDBEnricherData";

export default class SummonManifestation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        range: {
          units: "ft",
          value: "120",
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
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, type: "necrotic" }),
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, type: "radiant" }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        options: {
          durationTurns: 1,
          description: "Blinded until the end of its next turn (failed save only).",
        },
        daeSpecialDurations: ["turnEnd"],
        statuses: ["Blinded"],
      },
    ];
  }

}
