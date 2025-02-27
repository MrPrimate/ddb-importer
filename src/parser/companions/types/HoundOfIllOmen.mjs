import CompendiumHelper from "../../../lib/CompendiumHelper.mjs";
import { SRDExtractor } from "../SRDExtractor.mjs";


export async function getHoundOfIllOmen() {

  const results = {};
  const pack = game.packs.get("dnd5e.monsters");
  if (!pack) return results;
  const dddCompendium = CompendiumHelper.getCompendiumType("monster", false);


  let direWolf = await SRDExtractor.getDDBCompendiumDocument({ pack: dddCompendium, name: "Dire Wolf" });
  let direWolfVersion = 2;

  if (!direWolf) {
    // eslint-disable-next-line no-use-before-define
    direWolf = await SRDExtractor.getCompendiumDocument({ pack, name: "Dire Wolf" });
    direWolfVersion = 1;
  }

  if (!direWolf) return results;
  results["HoundOfIllOmen"] = {
    name: "Hound of Ill Omen",
    version: `${direWolfVersion}`,
    required: null,
    isJB2A: false,
    needsJB2A: false,
    needsJB2APatreon: false,
    folderName: "Shadow Sorcerer",
    data: foundry.utils.mergeObject(direWolf.toObject(), {
      "name": "Hound of Ill Omen",
      "prototypeToken": {
        name: "Hound of Ill Omen",
        width: 1,
        height: 1,
      },
      "prototypeToken.name": "Hound of Ill Omen",
      "system.traits.size": "med",
    }),
  };

  return results;

}
