/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ForceBlade extends DDBEnricherData {
  get activity() {
    return {
      data: {
        attack: {
          critical: {
            threshold: 18,
          },
        },
        damage: {
          critical: {
            bonus: "8d12",
          },
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 12,
              types: ["force"],
            }),
          ],
        },
      },
    };
  }
}
