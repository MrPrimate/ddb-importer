import DDBEnricherData from "../../data/DDBEnricherData";

export default class Invisibility extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      rangeSelf: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    if (this.ddbEnricher.originalActivity?.type === "cast") {
      return [];
    }
    const permanent = ["special"].includes(foundry.utils.getProperty(this.data, "flags.monsterMunch.type") as string);
    const invisRegex = /The ([\w ]+?) is invisible\./ig;
    const strippedHtml = foundry.utils.getProperty(this, "ddbParser.strippedHtml") as string;
    const improvedEffect = ["Superior Invisibility"].includes(this.data.name)
     || invisRegex.test(strippedHtml);

    return [
      {
        options: {
          transfer: permanent,
        },
        name: "Invisibility",
        statuses: ["Invisible"],
        daeStackable: "noneName",
        daeSpecialDurations: improvedEffect
          ? []
          : ["1Attack" as const, "1Spell" as const, "1Action" as const],
        midiProperties: {
          concentration: true,
        },
      },
    ];
  }

}
