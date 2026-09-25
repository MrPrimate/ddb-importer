import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Igniting the rope rolls its save at once, so lighting it is the save; roll it again by hand
 * for a creature that enters the fire or ends its turn inside. The first roll also catches
 * creatures within 5 feet of the wall, which the 10-foot line does not cover, so those are
 * targeted by hand.
 */
export default class InfernoRope extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ignite",
      targetType: "creature",
      activationType: "action",
      activationCondition: "Repeat for a creature that enters the fire or ends its turn inside",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["fire"] }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
        damage: { onSave: "none" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "wall", size: "10", width: "1", height: "15" },
        },
        range: { override: true, value: "5", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

}
