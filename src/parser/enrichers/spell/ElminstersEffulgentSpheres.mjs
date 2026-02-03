/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ElminstersEffulgentSpheres extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      name: "Cast",
      targetSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-@item.uses.max",
      data: {
        sort: 1,
        enchant: {
          self: true,
        },
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
        },
        overrides: {
          activationType: "reaction",
          overrideActivation: true,
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          addItemConsume: true,
          id: "AbsorbEnergySphe",
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
          addItemConsume: true,
          id: "EnergyBlastSpher",
          data: {
            sort: 3,
          },
        },
      },
    ];
  }

  get effects() {
    const absorb = [
      { type: "Acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
      { type: "Cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
      { type: "Fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
      { type: "Lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
      { type: "Thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
    ].map((element) => {
      return {
        name: `Absorb Energy Sphere: ${element.type}`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element.type.toLowerCase(), 1, "system.traits.dr.value"),
        ],
        img: element.img,
        activityMatch: "Absorb Energy",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnStartSource"],
      };
    });

    const enchant = {
      name: "Elminster's Effulgent Spheres",
      type: "enchant",
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("@item.level", 20, "system.uses.max"),
        DDBEnricherData.ChangeHelper.overrideChange("charges", 20, "system.uses.per"),
        DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", 90, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("Disable Effulgent Spheres", 90, "activities[enchant].name"),
        DDBEnricherData.ChangeHelper.overrideChange("[]", 90, "activities[enchant].consumption.targets"),
      ],
      activitiesMatch: ["Cast"],
      data: {
        flags: {
          ddbimporter: {
            activityRiders: ["AbsorbEnergySphe", "EnergyBlastSpher"],
            effectRiders: [],
          },
        },
      },
    };
    absorb.push(enchant);
    return absorb;
  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@item.level",
          },
        },
      },
    };
  }

}
