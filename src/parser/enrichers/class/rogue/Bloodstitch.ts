import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bloodstitch extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "Stolen Power",
      itemConsumeValue: "3",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        range: {
          units: "self",
        },
        target: {
          affects: {
            count: "",
            type: "creature",
            choice: true,
            special: "",
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, type: "necrotic" }),
          ],
        },
      },
    };
  }

}
