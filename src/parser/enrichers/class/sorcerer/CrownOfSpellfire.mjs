/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CrownOfSpellfire extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      activationCondition: "When you use Innate Sorcery",
      name: "Activate Crown of Spellfire",
      data: {
        enchant: {
          self: true,
        },
      },
    };
  }

  getSkeleton(hd) {
    return {
      constructor: {
        name: `Burning Life Force (d${hd})`,
        type: "utility",
      },
      build: {
        generateDamage: true,
      },
      overrides: {
        id: "ddbDamageReducti",
        targetType: "self",
        activationType: "special",
        activationCondition: "When you are hit by an attack roll",
        addItemConsume: true,
        data: {
          roll: {
            name: "Damage Reduction",
            formula: `(@scaling)d${hd}`,
          },
          consumption: {
            spellSlot: true,
            scaling: {
              allowed: true,
              max: "max(1, @abilities.cha.mod)",
            },
            targets: [
              {
                "type": "hitDice",
                "value": "1",
                "target": `d${hd}`,
                "scaling": {
                  "mode": "amount",
                  "formula": "",
                },
              },
            ],
          },
        },
      },
    };
  }

  get hdActivities() {
    const base = [this.getSkeleton(6)];

    const hitDiceSize = this.ddbParser.isMuncher
      ? []
      : this.ddbParser.ddbCharacter.source.ddb.character.classes
        .map((klass) => klass.definition.hitDice)
        .filter((hd) => hd && hd !== 6);

    for (const hd of hitDiceSize) {
      const clone = foundry.utils.duplicate(this.getSkeleton(hd));
      base.push(clone);
    }

    return base;
  }

  get additionalActivities() {
    const results = this.hdActivities;
    results.push(...[
      {
        constructor: {
          name: "Spell Avoidance",
          type: "utility",
        },
        build: {
        },
        overrides: {
          id: "ddbSpellAvoidanc",
          targetType: "self",
          activationType: "special",
          activationCondition: "When you are targeted by a spell that allows a saving throw",
        },
      },
      {
        constructor: {
          name: "Spend Sorcery Points to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            scaling: { allowed: false, max: "" },
            targets: [
              {
                type: "itemUses",
                target: "",
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "5",
                target: "sorcery-points",
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
    ]);
    return results;
  }

  get effects() {
    return [
      {
        name: "Crown of Spellfire",
        activityMatch: "Activate Crown of Spellfire",
        type: "enchant",
        data: {
          flags: {
            ddbimporter: {
              activityRiders: this.hdActivities.map((r) => r.overrides.id).concat(["ddbSpellAvoidanc"]),
            },
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 2, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 2, "system.attributes.movement.hover"),
          DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", 90, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("Disable Crown of Spellfire", 90, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("[]", 90, "activities[enchant].consumption.targets"),
        ],
      },
    ];

  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Infuse Spellfire",
      max: "1",
      period: "lr",
    });
    return {
      data: {
        system: {
          uses,
        },
      },
    };
  }

}
