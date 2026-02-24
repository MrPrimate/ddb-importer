import DDBEnricherData from "../data/DDBEnricherData";

export default class TollTheDead extends DDBEnricherData {
  get additionalActivities() {
    return [
      {
        init: {
          name: "Save (D12 Damage)",
          type: "save",
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
