import logger from "../../../lib/Logger";
import { SUMMONS_ACTOR_STUB } from "./_data";

interface ISRDObject {
  name: string;
  img: string;
  size: TActorSizes;
  /** token footprint in grid squares */
  width: number;
  height: number;
}

/**
 * Objects a spell or magic item puts on the map: a disk, a chest, a boat, a flying carpet. They
 * have no statistics of their own, so each is a bare token-bearing actor keyed by its entry here.
 * Anything the object does (the Dancing Sword's attack, the whip's restraint) stays on the item
 * that created it.
 */
export const SRD_OBJECTS: Record<string, ISRDObject> = {
  SRDObjectFloatingDisk: { name: "Floating Disk", img: "icons/magic/symbols/chevron-elipse-circle-blue.webp", size: "sm", width: 1, height: 1 },
  SRDObjectSecretChest: { name: "Secret Chest", img: "icons/containers/chest/chest-elm-steel-brown.webp", size: "sm", width: 1, height: 1 },
  SRDObjectFloatingWhip: { name: "Floating Whip", img: "icons/weapons/misc/whip-leather.webp", size: "tiny", width: 0.5, height: 0.5 },
  SRDObjectRowboat: { name: "Rowboat", img: "icons/environment/vehicles/boat-fishing-masted.webp", size: "lg", width: 1, height: 2 },
  SRDObjectKeelboat: { name: "Keelboat", img: "icons/environment/settlement/ship.webp", size: "grg", width: 2, height: 5 },
  SRDObjectCarpetOfFlying3x5: { name: "Carpet of Flying (3 by 5 ft.)", img: "icons/commodities/cloth/cloth-bolt-embroidered-pink.webp", size: "med", width: 1, height: 1 },
  SRDObjectCarpetOfFlying4x6: { name: "Carpet of Flying (4 by 6 ft.)", img: "icons/commodities/cloth/cloth-bolt-embroidered-pink.webp", size: "med", width: 1, height: 1 },
  SRDObjectCarpetOfFlying5x7: { name: "Carpet of Flying (5 by 7 ft.)", img: "icons/commodities/cloth/cloth-bolt-embroidered-pink.webp", size: "lg", width: 1, height: 1 },
  SRDObjectCarpetOfFlying6x9: { name: "Carpet of Flying (6 by 9 ft.)", img: "icons/commodities/cloth/cloth-bolt-embroidered-pink.webp", size: "lg", width: 1, height: 2 },
  SRDObjectIllusoryCreature: { name: "Illusory Creature", img: "icons/magic/defensive/illusion-evasion-echo-purple.webp", size: "med", width: 1, height: 1 },
  SRDObjectDancingSword: { name: "Dancing Sword", img: "icons/weapons/swords/greatsword-blue.webp", size: "sm", width: 1, height: 1 },
};

/** Build the bare token actors for the given object keys. */
export async function getSRDObjects(keys: string[]): Promise<ICompanionResult> {
  const result: ICompanionResult = {};
  for (const key of keys) {
    const data = SRD_OBJECTS[key];
    if (!data) continue;
    result[key] = {
      name: data.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "SRD Objects",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
        name: data.name,
        img: data.img,
        prototypeToken: {
          name: data.name,
          width: data.width,
          height: data.height,
          texture: { src: data.img },
        },
        system: {
          traits: { size: data.size },
        },
      }) as unknown as I5eMonsterData,
    };
  }
  logger.verbose("SRD object summons result", result);
  return result;
}
