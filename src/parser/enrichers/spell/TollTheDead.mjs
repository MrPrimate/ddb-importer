/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class TollTheDead extends DDBEnricherMixin {
  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save (D12 Damage)",
          type: "save",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherMixin.basicDamagePart({
              number: 1,
              denomination: 12,
              type: "necrotic",
            }),
          ],
          generateSave: true,
        },
      },
    ];
  }
}
