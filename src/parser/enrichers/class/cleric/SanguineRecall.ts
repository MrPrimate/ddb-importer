import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Domain: once per long rest, recover spell slots totalling up to half your Cleric level
 * (rounded up, none above 5th) and take 1d8 Necrotic per slot level recovered, which can't be
 * reduced. The scaling step adds a level; the slots themselves are restored by hand.
 */
export default class SanguineRecall extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Recover Spell Slots",
      targetType: "self",
      rangeSelf: true,
      activationType: "action",
      addItemConsume: true,
      data: {
        consumption: { scaling: { allowed: true, max: "ceil(@classes.cleric.levels / 2)" } },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["necrotic"], scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
    };
  }

}
