/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HolyStarOfMystra extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast Spell",
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          geneateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateConsumption: true,
          noeffect: true,
        },
        overrides: {
          addItemConsume: true,
          activationType: "bonus",
          targetType: "enemy",
          noeffect: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 10,
                  bonus: "@mod",
                  types: ["radiant", "force"],
                }),
              ],
            },
            range: {
              override: true,
              units: "ft",
              value: "120",
            },
          },
        },
      },
    ];
  }

  get effects() {
    const results = [
      { type: "Acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
      { type: "Cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
      { type: "Fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
      { type: "Lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
      { type: "Thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
    ].map((element) => {
      return {
        name: `Elemental Immunity: ${element.type}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.type.toLowerCase(), 1, "system.traits.di.value"),
        ],
        img: element.img,
        activityMatch: "Cast Spell",
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      };
    });
    results.push(
      {
        name: "Mote of Light",
        activityMatch: "Cast Spell",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '10'),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'),
        ],
        statuses: ["coverHalf"],
      },
    );
    return results;
  }


}
