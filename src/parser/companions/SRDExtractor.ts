import {
  CompendiumHelper,
} from "../../lib/_module";

export class SRDExtractor {

  static MONSTER_MAP: Record<string, Record<string, string>> = {
    "dnd5e.monsters": {
      "Arcane Hand": "iHj5Tkm6HRgXuaWP",
      "Arcane Sword": "Tac7eq0AXJco0nml",
      "Dire Wolf": "EYiQZ3rFL25fEJY5",
      "Unseen Servant": "BTQz2q4JJVQn8W5W",
    },
    "dnd5e.actors24": {
      "Arcane Hand": "phbsplBigbysHand",
    },
  };

  static async getCompendiumDocument({ pack = null, id = null, name = null }: {
    pack?: CompendiumCollection.Any | null;
    id?: string | null;
    name?: string | null;
  }) {
    const compendium = pack ?? game.packs.get("dnd5e.monsters");
    if (!compendium) return undefined;
    if (!id && name) id = SRDExtractor.MONSTER_MAP[compendium.metadata.id]?.[name];
    if (!id) return undefined;
    const doc = await compendium.getDocument(id);
    return doc;
  }

  static async getDDBCompendiumDocument({ pack = null, id = null, name = null, srdFallback = false }: {
    pack?: CompendiumCollection.Any | null;
    id?: string | null;
    name?: string | null;
    srdFallback?: boolean;
  }) {
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

}
