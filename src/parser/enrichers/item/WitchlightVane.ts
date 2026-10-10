import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Witchlight Vane: in the hands of the creature attuned to it, a +3 mace that deals an extra 1d8
 * radiant on a hit. DDB carries no damage modifier for that die, so it is set on the attack.
 */
export default class WitchlightVane extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant"] })],
        },
      },
    };
  }

}
