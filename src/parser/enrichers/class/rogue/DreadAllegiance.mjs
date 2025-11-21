/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DreadAllegiance extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    const results = [
      {
        constructor: {
          name: "Choose Bane",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        constructor: {
          name: "Choose Bhaal",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        constructor: {
          name: "Choose Myrkul",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateUtility: true,
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        constructor: {
          name: "Minor Illusion (Bane)",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Minor Illusion",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        constructor: {
          name: "Blade Ward (Bhaal)",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Blade Ward",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        constructor: {
          name: "Chill Touch (Myrkul)",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          noConsumeTargets: true,
          addSpellUuid: "Chill Touch",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },

    ];

    return results;
  }

  get effects() {
    return [
      {
        name: "Dread Allegiance to Bane (Psychic)",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 1, "system.traits.dr.value"),
        ],
        activityNameMatch: "Choose Bane",
      },
      {
        name: "Dread Allegiance to Bhaal (Poison)",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("poison", 1, "system.traits.dr.value"),
        ],
        activityNameMatch: "Choose Bhaal",
      },
      {
        name: "Dread Allegiance to Myrkul (Necrotic)",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 1, "system.traits.dr.value"),
        ],
        activityNameMatch: "Choose Myrkul",
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbDreadAllegiance">
<p><strong>Implementation Details</strong></p>
<p>Make a daily choice and apply the appropriate effect.</p>
</section>`,
    };
  }

}
