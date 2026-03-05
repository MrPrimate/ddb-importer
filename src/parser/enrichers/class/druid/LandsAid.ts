import DDBEnricherData from "../../data/DDBEnricherData";

export default class LandsAid extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Save vs Thorn Damage",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.land.lands-aid",
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.land.lands-aid",
            types: ["healing"],
          }),
          targetOverride: {
            affects: {
              type: "ally",
              count: "1",
            },
            template: {
              count: "",
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Healing"],
    };
  }

}
