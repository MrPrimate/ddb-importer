/**
 * Monster gear tests: which parsed items carry dnd5e's NPC `gear` property, and
 * when the stat block Gear line falls back to DDB's text.
 */

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/gear";
import { makeMockMonster } from "../../_fixtures/mockMonster";

const generateGear = DDBMonster.prototype._generateGear;

function weapon(name: string, typeValue = "martialM", properties: string[] = []) {
  return { name, type: "weapon", system: { type: { value: typeValue }, quantity: 1, properties } };
}

function equipment(name: string, typeValue = "heavy") {
  return { name, type: "equipment", system: { type: { value: typeValue }, quantity: 1, properties: [] } };
}

function feat(name: string) {
  return { name, type: "feat", system: { type: { value: "monster" }, properties: [] } };
}

function makeGearMonster(items: any[], { useItemAC = true, acItems = [] as any[] } = {}) {
  const mock = makeMockMonster();
  mock.items = [...items, ...acItems];
  mock.useItemAC = useItemAC;
  mock.ac = { ddbItems: useItemAC ? acItems : [] };
  return mock;
}

const hasGear = (item: any) => item.system.properties.includes("gear");

describe("DDBMonster._generateGear", () => {
  it("flags Gear-line weapons and AC armor, leaves monster attacks and features off", () => {
    const greatsword = weapon("Greatsword");
    const claw = weapon("Claw", "simpleM");
    const plate = equipment("Plate");
    const multiattack = feat("Multiattack");
    const mock = makeGearMonster([greatsword, claw, multiattack], { acItems: [plate] });

    generateGear.call(mock, ["Greatsword", "Plate Armor"]);

    expect(hasGear(greatsword)).toBe(true);
    expect(hasGear(plate)).toBe(true);
    expect(hasGear(claw)).toBe(false);
    expect(multiattack.system.properties).toEqual([]);
    expect(mock.npc.flags?.dnd5e?.statBlockOverride).toBeUndefined();
  });

  it("matches plural stacks to the singular attack and takes the quantity", () => {
    const javelin = weapon("Javelin", "simpleM", ["thr"]);
    const hammer = weapon("Light Hammer", "simpleM");
    const dagger = weapon("Dagger", "simpleM");
    const mock = makeGearMonster([javelin, hammer, dagger]);

    generateGear.call(mock, ["Javelins (6)", "Light Hammers (3)", "Daggers 3"]);

    expect(javelin.system.properties).toEqual(["thr", "gear"]);
    expect(javelin.system.quantity).toBe(6);
    expect(hammer.system.quantity).toBe(3);
    expect(dagger.system.quantity).toBe(3);
    expect(mock.npc.flags?.dnd5e?.statBlockOverride).toBeUndefined();
  });

  it("puts a stack on one item only when two attacks share its name", () => {
    const melee = weapon("Javelin (Melee)", "simpleM");
    const thrown = weapon("Javelin (Thrown)", "simpleM");
    const mock = makeGearMonster([melee, thrown]);

    generateGear.call(mock, ["Javelins (3)"]);

    expect(hasGear(melee)).toBe(true);
    expect(hasGear(thrown)).toBe(false);
  });

  it("never flags natural weapons, and strips gear the parser did not ask for", () => {
    const bite = weapon("Bite", "natural", ["gear"]);
    const mace = weapon("Mace", "simpleM", ["gear"]);
    const mock = makeGearMonster([bite, mace]);

    generateGear.call(mock, ["Bite"]);

    expect(hasGear(bite)).toBe(false);
    expect(hasGear(mace)).toBe(false);
  });

  it("falls back to DDB's Gear text when an entry has no item", () => {
    const shortsword = weapon("Shortsword");
    const mock = makeGearMonster([shortsword], { useItemAC: false });

    generateGear.call(mock, ["Leather Armor", "Shortsword", "Arcane Focus (wand)"]);

    expect(hasGear(shortsword)).toBe(true);
    expect(mock.npc.flags.dnd5e.statBlockOverride.gear).toBe("Leather Armor, Shortsword, Arcane Focus (wand)");
  });

  it("matches hyphen, apostrophe and parenthetical variants", () => {
    const halfPlate = equipment("Half Plate Armor", "medium");
    const tools = { name: "Thieves' Tools", type: "tool", system: { type: { value: "" }, quantity: 1, properties: [] } };
    const shield = equipment("Shield", "shield");
    const mock = makeGearMonster([], { acItems: [halfPlate, tools, shield] });

    generateGear.call(mock, ["Half-Plate Armor", "Thieves’ Tools", "Shield (Hero Only)"]);

    expect([halfPlate, tools, shield].every(hasGear)).toBe(true);
    expect(mock.npc.flags?.dnd5e?.statBlockOverride).toBeUndefined();
  });

  it("does nothing to the stat block with no Gear line", () => {
    const sword = weapon("Longsword");
    const mock = makeGearMonster([sword]);

    generateGear.call(mock, [""]);

    expect(hasGear(sword)).toBe(false);
    expect(mock.npc.flags?.dnd5e?.statBlockOverride).toBeUndefined();
  });
});
