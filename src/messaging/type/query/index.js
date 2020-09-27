import queryId from "./id.js";
import queryMonster from "./monster.js";
import querySpell from "./spell.js";
import querySpells from "./spells.js";
import querySourcebookPage from "./sourcebookPage.js";

const query = async (message) => {
  let response;

  // Legacy: Original webstore extension
  // if (typeof message === "string" && message === "id") {
  //   response = await queryId(message);
  //   return response;
  // }

  // New extension
  switch (message.type) {
    case "id":
      response = await queryId();
      break;
    case "monster":
      response = await queryMonster(message);
      break;
    case "spell":
    case "spellref":
      response = await querySpell(message);
      break;
    case "spells":
    case "spellsref":
      response = await querySpells(message);
      break;
    case "sourcebookPage":
      response = await querySourcebookPage(message);
      break;
    // no default
  }

  return response;
};

export default query;
