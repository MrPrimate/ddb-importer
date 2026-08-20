import utils from "../lib/Utils";
import logger from "../lib/Logger";

// numbered title/content chunks pulled out of ol/p HTML lists
// (used for monster ray/option style features)
export interface IExtractedHtmlItem {
  number: number;
  title: string;
  content: string;
  full: string;
}

/**
 * Pure text/data helpers shared by DDBEffectHelper and the enricher effect
 * generators. This module must stay a leaf: no parser, enricher, or barrel
 * imports. That keeps the enrichers/effects import graph free of the
 * Foundry-runtime half of DDBEffectHelper (and of the monster parser)
 *
 * DDBEffectHelper re-exposes these as statics for the public macro API.
 */
export default class DDBEffectHelperText {

  static extractListItems(text: string, { type = "ol", titleType = "em" } = {}): IExtractedHtmlItem[] {
    const results: IExtractedHtmlItem[] = [];
    const parsedDoc = utils.htmlToDoc(text);
    const list = parsedDoc.body.querySelector(type);
    if (list) {
      const listItems = list.querySelectorAll("li");
      listItems.forEach((item, index) => {
        const title = item.querySelector(titleType);
        const content = title?.nextSibling;
        if (!title || !content) return;
        results.push({
          number: index + 1,
          title: title.textContent?.replace(/\.$/, "").trim() ?? "",
          content: (content as HTMLElement).innerHTML ?? (content as Text).wholeText ?? content.textContent ?? "",
          full: item.innerHTML,
        });
      });
    }
    if (results.length > 0) return results;
    return DDBEffectHelperText.extractParagraphItems(text, { titleType });
  }

  static extractParagraphItems(text: string, { type = "p", titleType = "em" } = {}): IExtractedHtmlItem[] {
    const results: IExtractedHtmlItem[] = [];
    const parsedDoc = utils.htmlToDoc(text);

    const listItems = parsedDoc.querySelectorAll(type);
    let i = 1;
    for (const item of listItems) {
      const title = item.querySelector(titleType);

      if (!title) continue;
      const content = title.nextSibling;
      if (!content) continue;
      results.push({
        number: i,
        title: title.textContent?.replace(/\.$/, "").trim() ?? "",
        content: (content as HTMLElement).innerHTML?.trim() ?? (content as Text).wholeText?.trim() ?? content.textContent?.trim() ?? "",
        full: item.innerHTML,
      });
      i++;
    }

    return results;
  }

  static getMonsterFeatureDamage(damageText: string, featureDoc: TAll5eItemDocuments | null = null): IDDBMonsterActionDataDamagePart[] {
    const preParsed = featureDoc
      ? foundry.utils.getProperty(featureDoc, "flags.monsterMunch.actionData.damageParts") as IDDBMonsterActionDataDamagePart[] | undefined
      : undefined;
    if (preParsed && preParsed.length > 0) return preParsed;
    // Re-parsing the text via DDBMonsterFeature is not possible here: it
    // requires a ddbMonster
    logger.warn("Unable to parse monster feature damage without pre-parsed damage parts", { damageText, featureDoc });
    return [];
  }

  static getOvertimeDamage(text: string, featureDoc: TAll5eItemDocuments | null = null): IDDBMonsterActionDataDamagePart[] | undefined {
    if (text.includes("taking") && (text.includes("on a failed save") || text.includes("damage on a failure"))) {
      const damageText = text.split("taking")[1];
      return DDBEffectHelperText.getMonsterFeatureDamage(damageText, featureDoc);
    }
    return undefined;
  }

}
