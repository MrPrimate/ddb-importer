import DDBEnricherData from "../../data/DDBEnricherData";

export default class HellfireClawGrapple extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Your grapple check succeeds while raging; repeats at the end of each of the grappled creature's turns",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.infernal.hellfire-claw",
              types: ["fire"],
            }),
          ],
        },
      },
    };
  }

}
