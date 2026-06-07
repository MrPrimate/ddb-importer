import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraveTouched extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [4, 6, 8, 10, 12]
      .map((die) => {
        return {
          init: {
            name: `Damage (d${die})`,
            type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
          },
          build: {
            generateDamage: true,
            generateHealing: false,
            generateRange: false,
            damageParts: [
              DDBEnricherData.basicDamagePart({
                number: 1,
                denomination: die,
                type: "necrotic",
              }),
            ],
          },
          overrides: {
            addActivityConsume: true,
            data: {
              uses: {
                max: "1",
                spent: 0,
                recovery: [{ period: "turnStart", type: "recoverAll", formula: undefined }],
              },
            },
          },
        } as IDDBAdditionalActivity;
      });
  }

}
