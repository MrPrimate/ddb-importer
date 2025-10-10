/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FuryOfTheSmall extends DDBEnricherData {


  get useProfDamage() {
    const description = this.ddbParser.ddbDefinition.description ?? this.ddbParser.ddbDefinition.snippet ?? "";
    return description.toLowerCase().includes("once per turn");
  }

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Bonus Damage",
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            customFormula: this.useProfDamage ? "@prof" : "@details.level",
            types: DDBEnricherData.allDamageTypes(),
          })],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses": {
          "spent": 0,
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

  get effects() {
    const midiOptionalChanges = this.useProfDamage
      ? [{
        name: "furyOfTheSmall",
        data: {
          label: `${this.ddbParser.name} (Only use on targets larger than you)`,
          count: "turn",
          "damage.all": "(@prof)",
          countAlt: `ItemUses.${this.data.name}`,
        },
      }]
      : [{
        name: "furyOfTheSmall",
        data: {
          label: `${this.ddbParser.name} (Only use on targets larger than you)`,
          "damage.all": "(@details.level)",
          countAlt: `ItemUses.${this.data.name}`,
        },
      }];

    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        name: "Fury of the Small (Automation)",
        midiOptionalChanges,
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
      },
    ];
  }

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  get itemMacro() {
    return {
      type: "feat",
      name: "furyOfTheSmall.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "feat",
      name: "furyOfTheSmall.js",
      triggerPoints: ["preDamageRoll"],
    };
  }

}
