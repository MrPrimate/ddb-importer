import DDBEnricherData from "../../data/DDBEnricherData";

export default class LandsAid extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
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

  get additionalActivities() {
    return [
      {
        init: {
          name: "Healing",
          type: "heal",
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
              value: 1,
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

  get override() {
    return {
      ignoredConsumptionActivities: ["Healing"],
    };
  }

}
