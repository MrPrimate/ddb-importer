import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Misfortune Bringer rogue level 3. The Jinx Points pool is the separate "Jinx Points" action
 * document (rogue/JinxPoints); this feature keeps the rules text and points at it.
 */
export default class Misfortunist extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><i>Your Jinx Points are tracked on the Jinx Points feature. Misfortune activities consume points from it.</i></p>",
    };
  }

}
