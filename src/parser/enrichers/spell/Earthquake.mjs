/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Earthquake extends DDBEnricherData {
  get override() {
    return {
      data: {
        target: {
          affects: {
            choice: false,
            count: "1",
            type: "space",
            special: "",
          },
          template: {
            units: "ft",
            contiguous: false,
            type: "circle",
            size: "100",
            count: "",
          },
        },
      },
    };
  }

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Cast",
      data: {
        img: "icons/magic/sonic/explosion-shock-sound-wave.webp",
        target: {
          template: {
            count: 1,
            type: "circle",
            size: 100,
            units: "ft",
          },
          affects: {
            count: 1,
            type: "space",
          },
          override: true,
          prompt: true,
        },
        damage: {
          parts: [],
        },
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        activitiesMatch: ["Cast", "Damage from Collapsed Structure"],
        name: "Earthquake: Prone",
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          id: "ddbEarthquakePla",
          noSpellslot: true,
          name: "Place Fissure Templates (End of Turn)",
          data: {
            img: "icons/magic/earth/lava-stone-fire-eye.webp",
            description: {
              chatFlavor:
                "Place [[1d6]] Fissure ([[10 * 1d10]] Feet deep) fissure templates, creatures who fail save fall in.",
            },
            target: {
              template: {
                count: 6,
                contiguous: false,
                type: "line",
                size: 200,
                units: "ft",
              },
              affects: {
                count: 6,
                type: "space",
                choice: false,
              },
              override: true,
              prompt: true,
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          id: "ddbEarthquakeCol",
          noSpellslot: true,
          name: "Damage from Collapsed Structure",
          data: {
            img: "icons/environment/settlement/building-rubble.webp",
            save: {
              abilities: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: this.is2014 ? 5 : 12,
                  denomination: 6,
                  type: "bludgeoning",
                }),
              ],
            },
          },
        },
      },
      {
        duplicate: true,
        overrides: {
          id: "ddbEarthquakeEsc",
          noSpellslot: true,
          name: "Escape from Collapsed Building",
          data: {
            img: "icons/environment/traps/net.webp",
            save: {
              abilities: ["ath"],
              dc: {
                calculation: "",
                formula: "20",
              },
            },
          },
        },
      },
    ];
  }
}
