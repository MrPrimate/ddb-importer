/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EyeRays extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    const rayChoices = this.rayChoices;
    return {
      name: `Roll 1d${rayChoices.length}`,
      noTemplate: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: `1d${rayChoices.length}`,
          name: "Choose Ray",
        },
      },
    };
  }

  get rayText() {
    const text = this.ddbParser.html
      .replace(/<strong> \.<\/strong>/, "").trim()
      .replaceAll("<strong></strong>", "")
      .replaceAll("<em></em>", "")
      .replaceAll('<em> </em>', '')
      .replaceAll("<em><strong></strong></em>", "");
    if (this.is2014)
      return text;
    else
      return text.replaceAll("<br> <strong>", "</p><p><strong>");
  }

  get rayChoices() {
    const rayText = this.rayText;
    if (rayText.includes("<ol>") && rayText.includes("<li>")) {
      const titleType = rayText.includes("<li><strong>") ? "strong" : "em";
      return DDBImporter.EffectHelper.extractListItems(this.rayText, { titleType });
    } else {
      const titleType = rayText.includes("<p><em>") ? "em" : "strong";
      return DDBImporter.EffectHelper.extractParagraphItems(this.rayText, { titleType });
    }
  }

  static getId(name) {
    return utils.namedIDStub(name, {
      prefix: "EyeRay",
    });
  }

  static rayName(ray) {
    if (ray.title.startsWith(`${ray.number}`))
      return ray.title;
    else
      return `${ray.number}: ${ray.title}`;
  }

  get additionalActivities() {
    const rayChoices = this.rayChoices;

    // console.warn("ray choices", {
    //   rayChoices,
    //   this: this,
    //   rayText: this.rayText,
    // })
    const results = rayChoices.map((ray) => {
      const strippedHtml = utils.stripHtml(`${ray.full}`).trim();
      const descriptionParse = DDBImporter.lib.ParserLib.DDBDescriptions.featureBasics({ text: strippedHtml });

      const ddbMonsterDamage = new DDBImporter.lib.DDBMonsterDamage(ray.full, { ddbMonsterFeature: this.ddbParser });
      ddbMonsterDamage.generateDamage();
      ddbMonsterDamage.generateRegain();

      const result = {
        constructor: {
          name: EyeRays.rayName(ray),
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: ddbMonsterDamage.damageParts.length > 0,
          generateRange: true,
          damageParts: ddbMonsterDamage.damageParts.map((p) => p.part),
          generateTarget: true,
          saveOverride: descriptionParse.save,
        },
        overrides: {
          id: EyeRays.getId(ray.title),
        },
      };

      // console.warn("EyeRay", {
      //   name: ray.title,
      //   description: strippedHtml,
      //   ddbMonsterDamage,
      //   this: this,
      //   result,
      // });
      return result;
    });

    return results;
  }

  get clearAutoEffects() {
    return true;
  }

  effectExtras(name) {
    if (name.includes("Slowing")) {
      return [
        {
          name: "Slowed",
          activityMatch: name,
          options: {
            description: "Half speed, and limited reactions",
          },
          changes: [
            DDBEnricherData.ChangeHelper.customChange("/2", 20, "system.attributes.movement.all"),
          ],
        },
      ];
    } else if (name.includes("Petrification")) {
      return this.is2014
        ? [
          { name: "Status: Restrained", statuses: ["Restrained"], activityMatch: name },
          { name: "Status: Petrified", statuses: ["Petrified"], activityMatch: name },
        ]
        : [{ name: "Status: Restrained", statuses: ["Restrained"], activityMatch: name }];
    } else if (name.includes("Telekinetic") && this.is2014) {
      return [{ name: "Status: Restrained", statuses: ["Restrained"], activityMatch: name }];
    }
    return [];
  }

  get effects() {
    const results = [];

    this.rayChoices.forEach((ray) => {
      const name = EyeRays.rayName(ray);
      results.push(...this.effectExtras(name));
      const strippedHtml = utils.stripHtml(`${ray.full}`).trim();
      const overtimeGenerator = this.ddbParser._generateAutoEffects({ html: strippedHtml, addToMonster: false });
      if (overtimeGenerator.effect?.changes?.length > 0 || overtimeGenerator.effect?.statuses?.length > 0) {
        const effect = foundry.utils.deepClone(overtimeGenerator.effect);
        results.push({
          raw: effect,
          activityMatch: name,
        });
      }
    });
    return results;
  }

  get override() {
    if (this.is2014) return null;
    return {
      data: {
        system: {
          description: {
            value: this.ddbEnricher.data.system.description.value.replaceAll("<br> <strong>", "</p><p><strong>"),
          },
        },
      },
    };
  }

}
