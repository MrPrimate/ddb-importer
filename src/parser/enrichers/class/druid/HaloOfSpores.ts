import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Spores: the parsed reaction save (Con, scale-driven damage) stays the primary; the
 * damage is always necrotic.
 */
export default class HaloOfSpores extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Halo of Spores",
      func: ({ activity }: { activity: IActivityData }) => {
        for (const part of activity.damage?.parts ?? []) {
          part.types = ["necrotic"];
        }
      },
    };
  }

}
