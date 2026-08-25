import DDBEnricherData from "../../data/DDBEnricherData";
import _StormAura from "./_StormAura";

export default class StormAuraTundra extends _StormAura {

  override get element(): string {
    return "cold";
  }

  override get tundra(): string {
    return "Tundra";
  }


  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      rangeSelf: true,
      data: {
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.path-of-the-storm-herald.storm-aura-tundra",
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const results = super.effects;
    results.push(
      {
        midiOnly: true,
        onUseMacroChanges: [
          {
            macroPass: "postActiveEffects",
            macroType: "feat",
            macroName: "stormAuraTundra.js",
            document: this.data,
          },
        ],
      } as IDDBEffectHint,
    );
    return results;
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "stormAuraTundra.js",
    };
  }
}
