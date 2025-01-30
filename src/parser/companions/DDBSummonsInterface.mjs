import { get2024ArcaneHands } from "./types/ArcaneHand2024.mjs";
import { getArcaneEyes } from "./types/ArcaneEye.mjs";
import { getArcaneHands } from "./types/ArcaneHand.mjs";
import { getArcaneSwords } from "./types/ArcaneSword.mjs";
import { getBubblingCauldrons } from "./types/BubblingCauldron.mjs";
import { getConjureAnimals } from "./types/ConjureAnimals.mjs";
import { getDancingLights } from "./types/DancingLights.mjs";
import { getEldritchCannonStub } from "./types/EldritchCannon.mjs";
import { getHoundOfIllOmen } from "./types/HoundOfIllOmen.mjs";
import { getMageHands } from "./types/MageHand.mjs";
import { getUnseenServant } from "./types/UnseenServant.mjs";

export default class DDBSummonsInterface {

  static getArcaneEyes = getArcaneEyes;

  static getArcaneHands = getArcaneHands;

  static getArcaneHands2024 = get2024ArcaneHands;

  static getArcaneSwords = getArcaneSwords;

  static getBubblingCauldrons = getBubblingCauldrons;

  static getConjureAnimals2024 = getConjureAnimals;

  static getDancingLights = getDancingLights;

  static getEldritchCannonStub = getEldritchCannonStub;

  static getHoundOfIllOmen = getHoundOfIllOmen;

  static getMageHands = getMageHands;

  static getUnseenServant = getUnseenServant;

}
