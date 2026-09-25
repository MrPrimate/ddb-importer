import AuraOfConquest from "../../../src/parser/enrichers/class/paladin/AuraOfConquest";
import StormAuraTundra from "../../../src/parser/enrichers/class/barbarian/StormAuraTundra";
import PhoenixRocketSword from "../../../src/parser/enrichers/item/PhoenixRocketSword";
import Requiem from "../../../src/parser/enrichers/item/Requiem";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const build = (Enricher: new (options: any) => any, options: Parameters<typeof makeEnricherData>[1] = {}): any =>
  makeEnricherData(Enricher, options);

describe("scale and scaling formulas", () => {
  it("Aura of Conquest deals half the paladin level and keeps its radius scale out of the damage", () => {
    const e = build(AuraOfConquest);
    expect(e.activity.data.damage.parts[0].custom.formula).toBe("floor(@classes.paladin.levels / 2)");
    // the same-named scale is the aura radius, which the character import would swap into the damage
    expect(e.override.data.flags.ddbimporter.skipScale).toBe(true);
  });

  it("Storm Aura (Tundra) reads the storm-herald subclass scale", () => {
    expect(JSON.stringify(build(StormAuraTundra).activity)).toContain("@scale.storm-herald.storm-aura-tundra");
  });

  // dnd5e's @scaling is the scaling value (increase + 1), i.e. the charges or questions spent
  it("Phoenix Rocket Sword's push DC is 10 + the charges expended", () => {
    const rocket = build(PhoenixRocketSword).additionalActivities.find((a: any) => a.init.name === "Rocket");
    expect(rocket.build.saveOverride.dc.formula).toBe("10 + @scaling");
  });

  it("Requiem's addiction DC is the printed base + 1 per question asked", () => {
    expect(build(Requiem, { name: "Requiem Bliss" }).activity.data.save.dc.formula).toBe("12 + @scaling");
    expect(build(Requiem, { name: "Requiem Clay" }).activity.data.save.dc.formula).toBe("10 + @scaling");
  });
});
