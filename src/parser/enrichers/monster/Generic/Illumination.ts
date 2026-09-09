import DDBEnricherData from "../../data/DDBEnricherData";

export default class Illumination extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {

    // The myrmidon sheds bright light in a 20-foot radius and dim light in a 40-foot radius
    // The councilor magically sheds bright light in a 15-foot radius and dim light for an additional 15 feet
    // The walker sheds bright light in a 20-foot radius and dim light for an additional 20 feet.
    // The hybrid sheds bright light in a 10-foot radius and dim light for an additional 10 feet
    // The myrmidon sheds bright light in a 20-foot radius and dim light in a 40-foot radius.
    // The soldier magically sheds bright light in a 10-foot radius and dim light for an additional 10 feet.
    // The star angler’s lure sheds bright light in a 30- foot radius and dim light for an additional 30 feet
    // The lightning hulk sheds bright light in a 20-foot radius and dim light for an additional 20 feet.
    // The golem magically sheds bright light in a 30-foot radius and dim light for an additional 30 feet.
    // Maegera sheds bright light in a 120-foot radius and dim light for an additional 120 feet
    // Trenzia sheds either dim light in a 15-foot radius, or bright light in a 15-foot radius and dim light for an additional 15 feet.
    // The swarm sheds dim light from its brains in a 5-foot radius, increases the illumination to bright light in a 5- to 20-foot radius and dim light for an additional number of feet equal to the chosen radius, or extinguishes the light.
    // The sphere is bright light, sheds dim light for an additional 30 feet, and moves with the faerie
    // The faerie sheds dim light in a 15-foot radius.
    const basicRegex = /sheds bright light in a (?<bright>\d+)-\s?foot radius and dim light (in a|for an additional) (?<dim>\d+)-?\s?(foot radius|feet)/i;
    const basicMatch = basicRegex.exec(this.ddbParser.strippedHtml ?? "");

    const justDimRegex = /sheds dim light in a (?<dim>\d+)-\s?foot radius/i;
    const justDimMatch = justDimRegex.exec(this.ddbParser.strippedHtml ?? "");

    // console.warn("Illumination", {
    //   this: this,
    //   match,
    //   atlACtove: DDBEnricherData.AutoEffects.effectModules().atlInstalled,
    // });

    const match = basicMatch ?? justDimMatch;
    const groups = match?.groups ?? {};
    if (match && DDBEnricherData.AutoEffects.effectModules().atlInstalled) {
      const effect: IDDBEffectHint = {
        options: {
          transfer: true,
        },
        name: `Illumination`,
        atlOnly: true,
        atlChanges: [],
      };
      if (groups.bright) {
        effect.atlChanges?.push(
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, groups.bright),
        );
      }
      if (groups.dim) {
        const dim = groups.bright ? parseInt(groups.bright) + parseInt(groups.dim) : groups.dim;
        effect.atlChanges?.push(
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, parseInt(`${dim}`)),
        );
      }
      return [effect];
    } else if (match) {
      // without ATL the light is written straight onto the prototype token; setProperty because
      // the token light block may not exist yet on the npc data being built
      const npc = this.ddbParser.ddbMonster?.npc;
      if (npc && groups.bright) {
        foundry.utils.setProperty(npc, "prototypeToken.light.bright", parseInt(groups.bright));
      }
      if (npc && groups.dim) {
        const dim = groups.bright ? parseInt(groups.bright) + parseInt(groups.dim) : groups.dim;
        foundry.utils.setProperty(npc, "prototypeToken.light.dim", parseInt(`${dim}`));
      }
    }

    return [];
  }

}
