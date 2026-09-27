import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Marrow Transplant: a 4d6 necrotic ranged spell attack, and a second creature regains Hit Points
 * equal to the damage dealt. DDB ships the 1d6 per slot level upcast on the healing modifier only,
 * so the parsed attack never scales; both parts are pinned here. The healing stays its own roll,
 * as nothing in core dnd5e can carry the damage total across to it.
 */
export default class MarrowTransplant extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    if (this.ddbEnricher?._originalActivity?.type === "heal") {
      return {
        data: {
          healing: DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 6,
            type: "healing",
            scalingMode: "whole",
            scalingNumber: 1,
          }),
        },
      };
    }

    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              type: "necrotic",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

}
