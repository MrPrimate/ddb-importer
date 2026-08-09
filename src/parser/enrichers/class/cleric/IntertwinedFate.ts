import DDBEnricherData from "../../data/DDBEnricherData";

export default class IntertwinedFate extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "creature",
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              type: "force",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
        consumption: {
          targets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: {},
            },
          ],
          scaling: {
            allowed: true,
            max: "",
          },
          spellSlot: true,
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
