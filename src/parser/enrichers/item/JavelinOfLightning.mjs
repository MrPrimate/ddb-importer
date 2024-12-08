/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class JavelinOfLightning extends DDBEnricherData {
  get override() {
    const override = {
      "flags.ddbimporter.retainUseSpent": true,
      data: {
        system: {
          uses: {
            spent: null,
            max: "",
            recovery: [],
            autoDestroy: false,
            autoUse: true,
          },
        },
      },
    };

    if (this.is2014) return override;

    override.data.system.damage = {
      base: DDBEnricherData.basicDamagePart({
        number: 1,
        denomination: 6,
        types: ["piercing", "lightning"],
      }),
    };
    return override;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Lightning Bolt",
          type: "save",
        },
        build: {
          onSave: "half",
          includeBaseDamage: false,
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          saveOverride: {
            ability: ["dex"],
            dc: {
              calculation: "",
              formula: "13",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 6,
              types: ["lightning"],
            }),
          ],
          usesOverride: {
            value: "1",
            max: "1",
            autoUse: true,
            autoDestroy: true,
            recovery: [
              {
                period: "dawn",
                type: "recoverAll",
              },
            ],
          },
        },
        overrides: {
          addActivityConsume: true,
          data: {
            img: "icons/magic/lightning/bolt-forked-large-blue-yellow.webp",
            range: {
              override: true,
              value: "",
              units: "self",
            },
            target: {
              override: true,
              affects: {
                count: "",
                type: "creature",
              },
              template: {
                contiguous: false,
                type: "line",
                size: "120",
                units: "ft",
                width: "5",
              },
            },
          },
        },
      },
    ];
  }

  get addAutoAdditionalActivities() {
    return false;
  }
}
