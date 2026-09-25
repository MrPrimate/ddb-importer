import DDBEnricherData from "../../data/DDBEnricherData";
import { emanation } from "../../data/RegionBuilders";
import _Illrigger from "./_Illrigger";

/**
 * The explosion deals the same damage as the seals burned on the interdicted creature, so the
 * damage part is one seal's worth of either type; roll it once per seal burned.
 */
export default class UnleashHell extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unleash Hell",
      activationType: "reaction",
      activationCondition: "When you burn one or more seals on an interdicted creature. Damage is per seal burned.",
      targetType: "creature",
      targetChoice: true,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        target: {
          ...emanation("5"),
          affects: {
            type: "creature",
            special: "Creatures of your choice within 5 feet of the interdicted creature",
          },
        },
        save: {
          ability: ["dex"],
          dc: _Illrigger.INTERDICT_DC,
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.illrigger.seal-damage",
              types: ["fire", "necrotic"],
            }),
          ],
        },
      },
    };
  }

}
