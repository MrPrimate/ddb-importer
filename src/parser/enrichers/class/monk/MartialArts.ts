import DDBEnricherData from "../../data/DDBEnricherData";

export default class MartialArts extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // get activity() {
  //   const empowered = this.hasClassFeature({ featureName: "Empowered Strike", className: "Monk" });

  //   return {
  //     name: "Martial Arts Strike",
  //     targetType: "creature",
  //     id: "ddbMartialArtsSt",
  //     noeffect: true,
  //     data: {
  //       range: {
  //         value: 5,
  //         units: "ft",
  //       },
  //       attack: {
  //         ability: "dex",
  //         type: {
  //           value: "melee",
  //           classification: "unarmed",
  //         },
  //       },
  //       damage: {
  //         parts: [
  //           DDBEnricherData.basicDamagePart({
  //             customFormula: "@scale.monk.die.die + @mod",
  //             types: empowered ? ["bludgeoning", "force"] : ["bludgeoning"],
  //           }),
  //         ],
  //       },
  //     },
  //   };
  // }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Martial Arts",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("fin", 10, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 10, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("@scale.monk.die.die + @mod", 10, "system.damage.base.custom.formula"),
        ],
        // data: {
        //   flags: {
        //     ddbimporter: {
        //       activityRiders: ["ddbMartialArtsSt"],
        //     },
        //   },
        // },
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Martial Arts: Simple Weapons",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
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
              categories: ["simpleM"],
            },
          },
        },
      },
      {
        init: {
          name: "Martial Arts: Light Martial Weapons",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
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
              categories: ["martialM"],
              properties: ["lgt"],
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbMartialArts">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer will automatically adjust the Unarmed Strike and appropriate weapons during import. These enchantment activities are provided if you need to adjust another weapon in play.</p>
</section>`,
    };
  }

}
