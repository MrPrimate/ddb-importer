import DDBEnricherData from "../data/DDBEnricherData";

interface ICrossbowBase {
  name: string;
  systemType: string;
  baseItem: string;
  uuid2014: string;
  uuid2024: string;
}

// DDB source 225 (Visionary Production and Design Inc.) entered its crossbow
// variants with a weapon type of "Ammunition", which also blanked the category,
// attack type, damage, range and properties on those definitions. They import as
// consumable ammunition without this. The bows, blowguns and melee variants from
// the same source are typed correctly.
const CROSSBOWS: ICrossbowBase[] = [
  {
    name: "Hand Crossbow",
    systemType: "martialR",
    baseItem: "handcrossbow",
    uuid2014: "Compendium.dnd5e.items.Item.qaSro7kFhxD6INbZ",
    uuid2024: "Compendium.dnd5e.equipment24.Item.phbwepHandCrossb",
  },
  {
    name: "Heavy Crossbow",
    systemType: "martialR",
    baseItem: "heavycrossbow",
    uuid2014: "Compendium.dnd5e.items.Item.RmP0mYRn2J7K26rX",
    uuid2024: "Compendium.dnd5e.equipment24.Item.phbwepHeavyCross",
  },
  {
    name: "Light Crossbow",
    systemType: "simpleR",
    baseItem: "lightcrossbow",
    uuid2014: "Compendium.dnd5e.items.Item.ddWvQRLmnnIS0eLF",
    uuid2024: "Compendium.dnd5e.equipment24.Item.phbwepLightCross",
  },
];

export default class MistypedCrossbow extends DDBEnricherData {

  get #base(): ICrossbowBase {
    const name = this.ddbParser?.originalName ?? this.name;
    return CROSSBOWS.find((crossbow) => name.includes(crossbow.name)) ?? CROSSBOWS[2];
  }

  override get documentStub(): IDDBDocumentStub {
    const base = this.#base;
    return {
      documentType: "weapon",
      parsingType: "weapon",
      // the SRD copy brings its own attack activity; drop it and let the parser
      // build one, so the DDB magic bonus and properties are applied as usual
      replaceDefaultActivity: true,
      systemType: {
        value: base.systemType,
        baseItem: base.baseItem,
      },
      copySRD: {
        name: base.name,
        type: "weapon",
        uuid: this.is2014 ? base.uuid2014 : base.uuid2024,
      },
    };
  }

}
