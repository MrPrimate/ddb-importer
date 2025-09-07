/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DelayedBlastFireball extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Create Bead",
      addItemConsume: true,
      itemConsumeValue: "@item.uses.value",
      targetType: "space",
      data: {
        img: "systems/dnd5e/icons/svg/damage/force.svg",
        target: {
          override: true,
          template: {
            contiguous: false,
            type: "sphere",
            size: "1",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Touch Bead",
          type: "save",
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
          overrideTarget: true,
          data: {
            img: "systems/dnd5e/icons/svg/trait-skills.svg",
            range: {
              override: true,
              unit: "any",
            },
            save: {
              ability: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Increase Turn Counter",
          type: "utility",
        },
        build: {
          generateDuration: true,
          generateActivation: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "-1",
          targetType: "",
          noTemplate: true,
          overrideTarget: true,
          data: {
            img: "systems/dnd5e/icons/svg/scale-value.svg",
            duration: {
              override: true,
              units: "inst",
            },
          },
        },
      },
      {
        constructor: {
          name: "Explosion",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateSave: true,
          generateActivation: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          activationOverride: {
            type: "special",
          },
        },
        overrides: {
          data: {
            img: "icons/magic/fire/projectile-fireball-smoke-strong-orange.webp",
            data: {
              damage: {
                parts: [
                  DDBEnricherData.basicDamagePart({
                    number: "12",
                    denomination: "6",
                    bonus: "(@item.uses.value)d6",
                    types: ["fire"],
                  }),
                ],
              },
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbFormOfTheBeast">
<p><strong>Implementation Details</strong></p>
    <p>The uses value of this spell tracks the rounds that have passed since the casting.</p>
    <p>The <strong>Increase Turn Counter</strong> activity will increase that value by 1.</p>
    <p>The <strong>Explosion</strong> activity calculates the total damage based on the  uses.</p>
</section>`,
      data: {
        "system.uses": { spent: null, max: "10" },
      },
    };
  }

}
