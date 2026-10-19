import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class EyeRays extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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
      .replaceAll("<em> </em>", "")
      .replaceAll("<em><strong></strong></em>", "");
    if (this.is2014)
      return text;
    else
      return text.replaceAll("<br> <strong>", "</p><p><strong>");
  }

  get rayChoices() {
    const rayText = this.rayText;
    const items: { number: number; title: string; content: string; full: string }[] = [];
    if (rayText.includes("<ol>") && rayText.includes("<li>")) {
      const titleType = rayText.includes("<li><strong>") ? "strong" : "em";
      items.push(...DDBImporter.EffectHelper.extractListItems(rayText, { titleType }));
    } else {
      const titleType = rayText.includes("<p><em>") ? "em" : "strong";
      items.push(...DDBImporter.EffectHelper.extractParagraphItems(rayText, { titleType }));
    }
    // an untitled paragraph is the feature's own lead-in text, not a ray; a nested number title,
    // "<strong><em><strong>1:</strong></em></strong> <strong>Charm Ray.</strong>" (Xanathar in
    // Beadle & Grimm's), reads "1:Charm Ray"
    return items
      .filter((ray) => ray.title !== "")
      .map((ray, index) => ({ ...ray, number: index + 1, title: ray.title.replace(/^(\d+):\s*/, "$1: ") }));
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    const rayChoices = this.rayChoices;

    // console.warn("ray choices", {
    //   rayChoices,
    //   this: this,
    //   rayText: this.rayText,
    // })
    const results = rayChoices.map((ray) => {
      const name = EyeRays.rayName(ray);
      const strippedHtml = utils.stripHtml(`${ray.full}`).trim();
      const rayDescription = DDBImporter.lib.ParserLib.DDBDescriptions
        .matchActivitySection(ray.full, name)?.section ?? ray.full;
      const descriptionParse = DDBImporter.lib.ParserLib.DDBDescriptions.featureBasics({ text: strippedHtml });

      const ddbMonsterDamage = new DDBImporter.lib.DDBMonsterDamage(ray.full, { ddbMonsterFeature: this.ddbParser });
      ddbMonsterDamage.generateDamage();
      ddbMonsterDamage.generateRegain();

      const result = {
        init: {
          name,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
          // a ray hits one target; without this the Disintegration Ray's "10-foot cube of it"
          // (the portion of an object destroyed) would read as an area on that ray
          noTemplate: true,
          // dnd5e 5.x drops activity descriptions on create, but the parse scopes each ray's
          // conditions to its own save by this text
          data: {
            description: {
              value: rayDescription,
            },
          },
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
      // both printings restrain first and petrify on the second failed save
      return [
        { name: "Status: Restrained", statuses: ["Restrained"], activityMatch: name },
        { name: "Status: Petrified", statuses: ["Petrified"], activityMatch: name },
      ];
    } else if (name.includes("Telekinetic") && this.is2014) {
      return [{ name: "Status: Restrained", statuses: ["Restrained"], activityMatch: name }];
    }
    return [];
  }

  get effects(): IDDBEffectHint[] {
    const results = [];

    this.rayChoices.forEach((ray) => {
      const name = EyeRays.rayName(ray);
      const extras = this.effectExtras(name);
      results.push(...extras);
      const strippedHtml = utils.stripHtml(`${ray.full}`).trim();
      const overtimeGenerator = this.ddbParser._generateAutoEffects?.({ html: strippedHtml, addToMonster: false });
      // a ray's own effect already carrying the parsed condition is not built twice
      const covered = new Set(extras.flatMap((extra) => ("statuses" in extra ? extra.statuses ?? [] : []).map((status: string) => status.toLowerCase())));
      const parsedStatuses: string[] = overtimeGenerator?.effect?.statuses ?? [];
      const duplicate = parsedStatuses.length > 0 && (overtimeGenerator?.effect?.changes?.length ?? 0) === 0
        && parsedStatuses.every((status) => covered.has(status.toLowerCase()) || status === "incapacitated");
      if (overtimeGenerator && !duplicate && (overtimeGenerator.effect?.changes?.length > 0 || overtimeGenerator.effect?.statuses?.length > 0)) {
        const effect = foundry.utils.deepClone(overtimeGenerator.effect);
        results.push({
          raw: effect,
          activityMatch: name,
        });
      }
    });
    return results;
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;
    const description = this.ddbEnricher.data?.system?.description?.value;
    if (description === undefined) return null;
    return {
      data: {
        system: {
          description: {
            value: description.replaceAll("<br> <strong>", "</p><p><strong>"),
          },
        },
      },
    };
  }

}
