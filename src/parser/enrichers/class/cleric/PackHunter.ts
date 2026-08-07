import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hunt Domain. The reaction is an attack rider, so the "Kill" half is a damage
 * activity rather than the default use activity.
 */
export default class PackHunter extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Kill",
      activationType: "reaction",
      targetType: "creature",
      allowCritical: true,
      removeDamageParts: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
