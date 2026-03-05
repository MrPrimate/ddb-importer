import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchCannonFlamethrower extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Ignites flammable objects.",
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.artillerist.eldritch-cannon",
              type: "fire",
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "" },
    };
  }
}
