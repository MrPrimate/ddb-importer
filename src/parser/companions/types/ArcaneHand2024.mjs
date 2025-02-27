import { logger, utils } from "../../../lib/_module.mjs";

export async function getArcaneHands2024({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getArcaneHands2024", {
    ddbParser,
    document,
    raw,
    text,
  });

  const hands2024 = await DDBImporter.lib.DDBSummonsInterface.getArcaneHands2014({
    ddbParser,
    document,
    raw,
    text,
    name: "Bigby's Hand",
    postfix: "2024",
  });

  const dom = utils.htmlToDocumentFragment(text);

  const descriptionUpdates = {};
  dom.querySelectorAll("p").forEach((node) => {
    const pDom = utils.htmlToDocumentFragment(node.outerHTML);
    const query = pDom.querySelector("strong");
    if (!query) return;
    let name = query.textContent.trim().replace(/\./g, '');
    descriptionUpdates[name] = {
      description: node.innerHTML.replace(query.outerHTML, "").trim(),
    };
  });

  Object.keys(hands2024).forEach((key) => {
    hands2024[key].data.system.details.cr = null;
    hands2024[key].data.items.forEach((item) => {
      const update = descriptionUpdates[item.name];
      if (update) {
        item.system.description.value = update.description;
      }
      switch (item.name) {
        case "Clenched Fist": {
          item.system.damage.base.custom.formula = "(2 * @flags.dnd5e.summon.level - 8)d8";
          break;
        }
        case "Grasping Hand": {
          item.system.description.value += `
<h3>Grapple Escape Tests</h3>
<p>[[/check ability=str skill=ath dc=8+@prof+@flags.dnd5e.summon.mod]]{Strength (Athletics)} [[/check ability=dex skill=acr dc=8+@prof+@flags.dnd5e.summon.mod]]{Dexterity (Acrobatics)}</p>`;
          for (const key of Object.keys(item.system.activities)) {
            const activity = item.system.activities[key];
            if (activity.type !== "damage") continue;
            activity.damage.parts[0].custom.formula = "(2 * @flags.dnd5e.summon.level - 6)d6 + @flags.dnd5e.summon.mod";
            item.system.activities[key] = activity;
          }
          break;
        }
        case "Forceful Hand":
        case "Interposing Hand":
        default: {
          // no adjustments
          break;
        }
      }
    });
  });

  return hands2024;
}
