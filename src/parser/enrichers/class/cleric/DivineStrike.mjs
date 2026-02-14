/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DivineStrike extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.order.divine-strike",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": "@scale.order.divine-strike",
          },
        }],
      },
    ];
  }
}
