import {
  CompendiumHelper,
} from "../../lib/_module.mjs";

export class SRDExtractor {

  static MONSTER_MAP = {
    "Arcane Hand": "iHj5Tkm6HRgXuaWP",
    "Arcane Sword": "Tac7eq0AXJco0nml",
    "Dire Wolf": "EYiQZ3rFL25fEJY5",
    "Unseen Servant": "BTQz2q4JJVQn8W5W",
  };

  static async getCompendiumDocument({ pack = null, id = null, name = null }) {
    const compendium = pack ?? game.packs.get("dnd5e.monsters");
    if (!compendium) return undefined;
    if (!id) id = SRDExtractor.MONSTER_MAP[name];
    if (!id) return undefined;
    const doc = await compendium.getDocument(id);
    return doc;
  }

  static async getDDBCompendiumDocument({ pack = null, id = null, name = null, srdFallback = false }) {
    const compendium = pack ?? CompendiumHelper.getCompendiumType("monster", false);
    if (!compendium) return undefined;
    await compendium.getIndex();
    if (id) {
      const doc = await compendium.getDocument(id);
      if (doc) return doc;
    }
    if (name) {
      const indexMatch = compendium.index.find((a) => a.name === name);
      if (indexMatch) {
        const doc = await fromUuid(indexMatch.uuid);
        return doc;
      }
    }
    if (srdFallback) {
      return SRDExtractor.getCompendiumDocument({ pack, id, name });
    }
    return undefined;

  }


  static async getSRDActors() {
    const results = {};
    const pack = game.packs.get("dnd5e.monsters");
    if (!pack) return results;
    const dddCompendium = CompendiumHelper.getCompendiumType("monster", false);

    // eslint-disable-next-line no-use-before-define
    const arcaneHand = await SRDExtractor.getCompendiumDocument({ pack, name: "Arcane Hand" });
    if (arcaneHand) {
      foundry.utils.mergeObject(results, DDBImporter.lib.DDBSummonsInterface.getArcaneHands(arcaneHand.toObject()));
    }

    // eslint-disable-next-line no-use-before-define
    const arcaneSword = await SRDExtractor.getCompendiumDocument({ pack, name: "Arcane Sword" });
    if (arcaneHand) {
      foundry.utils.mergeObject(results, DDBImporter.lib.DDBSummonsInterface.getArcaneSwords(arcaneSword));
    }

    // eslint-disable-next-line no-use-before-define
    const unseenServant = await SRDExtractor.getCompendiumDocument({ pack, name: "Unseen Servant" });
    if (unseenServant) {
      foundry.utils.mergeObject(results, DDBImporter.lib.DDBSummonsInterface.getUnseenServant(unseenServant.toObject()));
    }

    // eslint-disable-next-line no-use-before-define
    let direWolf = await SRDExtractor.getDDBCompendiumDocument({ pack: dddCompendium, name: "Dire Wolf" });
    let direWolfVersion = 2;

    if (!direWolf) {
      // eslint-disable-next-line no-use-before-define
      direWolf = await SRDExtractor.getCompendiumDocument({ pack, name: "Dire Wolf" });
      direWolfVersion = 1;
    }
    if (direWolf) {
      foundry.utils.mergeObject(results, DDBImporter.lib.DDBSummonsInterface.getHoundOfIllOmen(direWolf, direWolfVersion));
    }

    return results;
  }
}
