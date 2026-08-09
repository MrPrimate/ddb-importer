import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchCannonFlamethrower extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
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

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "" },
    };
  }
}
