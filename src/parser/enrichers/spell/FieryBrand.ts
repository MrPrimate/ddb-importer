import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Demon Hunter): a failed save curses the target; while it lasts you resist all
 * damage the cursed creature deals, and it repeats the save at the end of each of its turns.
 */
export default class FieryBrand extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fiery Brand: Cursed",
        options: {
          transfer: false,
          description: "The caster has Resistance to all damage you deal. Repeat the save at the end of each of your turns, ending the curse on a success.",
        },
      },
    ];
  }

}
