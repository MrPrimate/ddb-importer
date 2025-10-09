/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlessedStrikes extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationOverride: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1d8",
              types: ["radiant"],
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
        optional: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": "@scale.cleric.divine-strike",
          },
        }],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 1,
          "recovery": [
            {
              "period": "turnStart",
              "type": "recoverAll",
            },
          ],
          "max": "1",
        },
      },
    };
  }
}
