import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The tide's 100-foot circle is difficult terrain for the duration. Its saves are made as the
 * spell is cast and at the end of each of the caster's turns, which a region cannot see, so the
 * parsed save stays as it is and only the terrain is added.
 */
export default class EbonTide extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

}
