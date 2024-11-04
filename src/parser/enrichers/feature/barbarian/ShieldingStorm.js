/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class ShieldingStorm extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Shielding Storm: Desert",
      activationType: "special",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Shielding Storm: Sea",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateAttack: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Shielding Storm: Tundra",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateAttack: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ];
  }


  get effects() {
    return [
      {
        name: "Shielding Storm: Desert",
        options: {
        },
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Shielding Storm: Desert",
            },
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("fire", 20, "system.traits.dr.value"),
        ],
      },
      {
        name: "Shielding Storm: Sea",
        options: {
        },
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Shielding Storm: Sea",
            },
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("lightning", 20, "system.traits.dr.value"),
        ],
      },
      {
        name: "Shielding Storm: Tundra",
        options: {
        },
        data: {
          flags: {
            ddbimporter: {
              activityMatch: "Shielding Storm: Tundra",
            },
            ActiveAuras: {
              aura: "Allies",
              radius: "10",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("cold", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

}
