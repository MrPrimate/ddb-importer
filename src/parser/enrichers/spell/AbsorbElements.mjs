/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AbsorbElements extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Absorb Elements Effect",
      data: {
        "description.chatFlavor": "Uses the damage type of the triggered attack: Acid, Cold, Fire, Lightning, or Poison.",
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Elemental Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning", "thunder"],
            }),
          ],
          noeffect: true,
        },
      },
    ];
  }

  get effects() {
    return ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        name: `Absorb ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.toLowerCase(), 1, "system.traits.dr.value"),
        ],
        activityMatch: "Absorb Elements Effect",
      };
    });
  }

}
