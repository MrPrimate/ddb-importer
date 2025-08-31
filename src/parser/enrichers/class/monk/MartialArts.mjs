/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MartialArts extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    const empowered = this.hasClassFeature({ featureName: "Empowered Strike", className: "Monk" });

    return {
      name: "Martial Arts Strike",
      targetType: "creature",
      id: "ddbMartialArtsSt",
      noeffect: true,
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.martial-arts.die + @mod",
              types: empowered ? ["bludgeoning", "force"] : ["bludgeoning"],
            }),
          ],
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
        name: "Martial Arts",
        type: "enchant",
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["ddbMartialArtsSt"],
            },
          },
        },
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Martial Arts: Simple Weapons",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ['simpleM'],
            },
          },
        },
      },
      {
        constructor: {
          name: "Martial Arts: Light Martial Weapons",
          type: "enchant",
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ['martialM'],
              properties: ['lgt'],
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `
<section class="secret" id="secret-ddbMartialArts">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer will automatically adjust the Unarmed Strike and appropriate weapons during import. These enchantment activities are provided if you need to adjust another weapon in play.</p>
</section>`,
    };
  }

}
