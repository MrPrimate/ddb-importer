import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodyBladesCriticalDamage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Scoring a Critical Hit with a blood dagger",
      noTemplate: true,
      data: {
        damage: {
          onSave: "none",
          parts: [
            // one d8 per Hit Die or Sangromancy Die spent creating the daggers (max 2)
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "necrotic" }),
          ],
        },
      },
    };
  }

}
