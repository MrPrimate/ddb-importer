import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Soda Pop (OTFY): the can bursts for 8d4 Force (+1d4 per slot level above 3) on a Dexterity save
 * for half. The parser also reads the "+1d4" from shaking the can as a second base part; each shake
 * (up to 14d4, plus the upcast dice) is added as a situational bonus when the can pops.
 */
export default class SodaPop extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 8,
              denomination: 4,
              types: ["force"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

}
