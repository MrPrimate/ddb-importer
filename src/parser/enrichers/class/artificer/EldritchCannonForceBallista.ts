import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchCannonForceBallista extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "On hit pushed 5 ft away.",
        },
        range: {
          value: 120,
          units: "ft",
        },
        target: {},
        attack: {
          ability: "int",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.artillerist.eldritch-cannon",
              type: "force",
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      uses: { spent: null, max: "" },
    };
  }
}
