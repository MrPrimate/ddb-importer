/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class RadiantSoul extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage bonus",
      type: "damage",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with a radiant or fire",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          bonus: "@abilities.cha.mod",
          types: ["radiant", "fire"],
        }),
      ],
    };
  }

}
