/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EldritchCannonFlamethrower extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Ignites flammable objects.",
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              type: "fire",
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses": { value: null, max: "" },
      },
    };
  }
}
