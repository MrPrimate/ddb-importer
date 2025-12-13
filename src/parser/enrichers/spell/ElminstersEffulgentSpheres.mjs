/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ElminstersEffulgentSpheres extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      targetSelf: true,
      data: {
        sort: 1,
      },
    };
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Absorb Energy",
          type: "utility",
        },
        build: {
          generateAttack: false,
          onsave: false,
          noeffect: true,
        },
        overrides: {
          activationType: "reaction",
          overrideActivation: true,
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          data: {
            img: "systems/dnd5e/icons/svg/rosa-shield.svg",
            sort: 2,
            midiProperties: { chooseEffects: true },
          },
        },
      },
      {
        constructor: {
          name: "Energy Blast",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          noeffect: true,
          rangeOverride: {
            value: 120,
            units: "ft",
          },
          targetOverride: {
            affects: {
              type: "enemy",
              count: "1",
            },
          },
        },
        overrides: {
          img: "systems/dnd5e/icons/svg/damage/force.svg",
          overrideActivation: true,
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          activationType: "bonus",
          data: {
            sort: 3,
          },
        },
      },
    ];
  }

  get effects() {
    const absorb = ["Acid", "Cold", "Fire", "Lightning", "Thunder"].map((element) => {
      return {
        name: `Absorb Energy Sphere: ${element}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.toLowerCase(), 1, "system.traits.dr.value"),
        ],
        activityMatch: "Absorb Energy",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
      };
    });
    return absorb;
  }

}
