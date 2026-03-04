import DDBEnricherData from "../data/DDBEnricherData";

export default class TollTheDead extends DDBEnricherData {
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save (D12 Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 12,
              type: "necrotic",
              bonus: this.ddbParser.cantripBoost ? "+@mod" : "",
            }),
          ],
          generateSave: true,
        },
      },
    ];
  }
}
