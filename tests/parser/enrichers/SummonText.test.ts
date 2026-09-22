/**
 * Pins for the reader that finds the creatures a monster feature calls. All wording here is
 * synthetic, written to the shapes D&D Beyond uses: the "singular;plural" residue of its monster
 * tag, plain names after a count, book references, stand-in stat blocks and challenge ratings.
 * The real text is covered by the monsters audit.
 */
import { monsterLinksToResidue, parseSummon, parseSummonDuration, parseSummonRange } from "../../../src/parser/enrichers/monster/Generic/_SummonText";

function names(text: string, self = ""): string[] {
  return (parseSummon(text, self)?.creatures ?? []).map((c) => `${c.upTo ? "<=" : ""}${c.count} ${c.name}`);
}

describe("the tag residue", () => {
  it("reads a dice count and the singular name", () => {
    expect(names("The ogre magically calls 1d4 cave rat;cave rats. Each appears in an unoccupied space within 30 feet."))
      .toEqual(["1d4 Cave Rat"]);
  });

  it("reads a whole list, with a number word at the end", () => {
    expect(names("A fiend has a 50 percent chance of summoning 1d8 imp;imps, 1d6 hound;hounds, or one ogre."))
      .toEqual(["1d8 Imp", "1d6 Hound", "1 Ogre"]);
  });

  it("shares a count across an or", () => {
    expect(names("She magically calls 2d4 swarm of moths;swarms of moths or swarm of mice;mice."))
      .toEqual(["2d4 Swarm of Moths", "2d4 Swarm of Mice"]);
  });

  it("carries up to across the list it heads", () => {
    expect(names("Up to five husk;husks or ghast;ghasts appear in unoccupied spaces within 30 feet of the lord."))
      .toEqual(["<=5 Husk", "<=5 Ghast"]);
  });

  it("keeps a bonus on the dice and a book suffix on the name", () => {
    expect(names("The captain summons 1d4 + 1 marsh wraith (XYZ);marsh wraiths, who appear in unoccupied spaces."))
      .toEqual(["1d4 + 1 Marsh Wraith (XYZ)"]);
  });

  it("adds what a later calling sentence offers instead", () => {
    expect(names("He magically calls 2d4 swarm of moths;swarms of moths. While outdoors, he can call 3d6 hound;hounds instead."))
      .toEqual(["2d4 Swarm of Moths", "3d6 Hound"]);
  });

  it("is not fooled by a semicolon that ends a clause", () => {
    expect(parseSummon("Rain causes rivers to fill or overflow their banks; snow forms deep drifts.")).toBeNull();
  });

  it("does not run a second calling into the name before it", () => {
    expect(names("He magically calls 4d6 bat;bats or swarm of moths;swarms of moths, or he magically calls 2d6 imp;imps."))
      .toEqual(["4d6 Bat", "4d6 Swarm of Moths", "2d6 Imp"]);
  });
});

describe("names with no residue", () => {
  it("are read after a count when the text says they arrive", () => {
    expect(names("The priest summons a stone elemental. It appears in an unoccupied space within 60 feet of its summoner."))
      .toEqual(["1 Stone Elemental"]);
  });

  it("are refused when nothing arrives anywhere", () => {
    expect(parseSummon("The mage summons a cone of silver fire.")).toBeNull();
  });

  it("let a trailing book reference vouch for the whole list", () => {
    expect(names("The conjurer magically summons a red sprite, a blue sprite, or a green sprite (all appear in the Big Book )."))
      .toEqual(["1 Red Sprite", "1 Blue Sprite", "1 Green Sprite"]);
  });

  it("drop a plain noun when the text marks real stat blocks beside it", () => {
    expect(names("It releases a piercing cry similar to a wounded bat. Next round, 1d6 bat;bats arrive."))
      .toEqual(["1d6 Bat"]);
  });

  it("are cut back to the singular after a count of several", () => {
    expect(names("If the commander is hurt, 1d4 + 1 grave soldiers appear in unoccupied spaces within 30 feet of it."))
      .toEqual(["1d4 + 1 Grave Soldier"]);
  });

  it("skip what follows a preposition and the feature's own rest wording", () => {
    expect(names("She summons the spirit of a fallen scout, which appears as a shade (see the Big Book ) in an unoccupied space."))
      .toEqual(["1 Shade"]);
    expect(names("Recharges after a Short or Long Rest. The golem summons 1d4 wisp;wisps.")).toEqual(["1d4 Wisp"]);
  });

  it("skip a lone compound adjective that opens a run of them", () => {
    expect(parseSummon("The devil magically calls one gem-crusted, fiendish suit of armor. The called creature arrives in 1d4 rounds."))
      .toBeNull();
  });
});

describe("stand-ins and its own kind", () => {
  it("uses the stat block the text points at", () => {
    expect(names("It howls and magically summons three hunting dogs (use the Jackal stat block) that appear in unoccupied spaces."))
      .toEqual(["3 Jackal"]);
    expect(names("The denizens rise up, causing 2d4 giant gnats (use the statistics of a giant fly) to appear in unoccupied spaces."))
      .toEqual(["2d4 Giant Fly"]);
  });

  it("falls back to the stand-in when the thing summoned is no stat block", () => {
    expect(names("The dryad magically summons a mount, which appears in an unoccupied space. The mount uses the stat block of an ibex (see the Big Book ) with changes."))
      .toEqual(["1 Ibex"]);
  });

  it("names the summoner for creatures of its kind, without the variant suffix", () => {
    expect(names("The sprite has a 25 percent chance of summoning 1d4 sprites of its kind.", "Ash Sprite (Summoner Variant)"))
      .toEqual(["1d4 Ash Sprite"]);
  });
});

describe("challenge ratings, chance, delay, range and duration", () => {
  it("reads a challenge rating summon with its creature type", () => {
    const summon = parseSummon("The gnome magically calls 1d4 devils with a challenge rating of 4 or lower. The called Fiends arrive in 1d4 rounds.");
    expect(summon?.creatures).toEqual([]);
    expect(summon?.challenge).toEqual({ count: "1d4", cr: "4", types: ["fiend"] });
    expect(summon?.delay).toBe("1d4");
  });

  it("reads the chance of the summoning, and no other chance", () => {
    expect(parseSummon("A fiend has a 30 percent chance of summoning one imp. It appears in an unoccupied space.")?.chance).toBe("30");
    expect(parseSummon("The kobold releases 1 weasel into an unoccupied space. Each turn there is a 50 percent chance that the weasel flees.")?.chance)
      .toBeNull();
  });

  it("reads the range said with the creatures, not an earlier option's", () => {
    const summon = parseSummon("It throws a pot at a point within 20 feet. Or the kobold summons 1 weasel, which appears in an unoccupied space within 5 feet of it.");
    expect(summon?.range).toBe("5");
    expect(parseSummonRange("The creatures appear within 60 feet of the caller.")).toBe("60");
  });

  it("reads how long they stay", () => {
    expect(parseSummonDuration("The Beasts remain for 1 hour, until the lord dies.")).toEqual({ value: "1", units: "hour" });
    expect(parseSummonDuration("The thing vanishes after 1 minute.")).toEqual({ value: "1", units: "minute" });
    expect(parseSummonDuration("It obeys the caller.")).toBeNull();
  });

  it("separates paragraphs the monster parser runs together", () => {
    expect(names("The fiend attempts a magical summoning.A pit lord summons 2d4 imp;imps, or one ogre with no chance of failure."))
      .toEqual(["2d4 Imp", "1 Ogre"]);
  });
});

describe("monster links, as a monster fetched by id carries them", () => {
  const link = (id: number, slug: string, label: string) =>
    `<a class="tooltip-hover monster-tooltip" href="/monsters/${id}-${slug}" data-tooltip-href="/monsters/${id}-tooltip">${label}</a>`;
  const html = `<p><em><strong>Call Vermin (1/Day).</strong></em> The caller magically calls <span data-dicenotation="2d4">2d4</span> ${link(101, "swarm-of-moths", "swarms of moths")} or ${link(102, "swarm-of-mice", "mice")}, or one ${link(103, "hag-s-cat", "hag's cat")}.</p>`;

  it("become the residue form, with the creature's id kept by name", () => {
    const { html: rewritten, ids } = monsterLinksToResidue(html);
    expect(rewritten).toContain("swarm of moths;swarms of moths");
    expect(rewritten).toContain("swarm of mice;mice");
    expect([...ids]).toEqual([["swarm of moths", 101], ["swarm of mice", 102], ["hag's cat", 103]]);
  });

  it("then read exactly as the residue does", () => {
    const text = monsterLinksToResidue(html).html.replace(/<[^>]+>/g, "");
    expect(names(text)).toEqual(["2d4 Swarm of Moths", "2d4 Swarm of Mice", "1 Hag's Cat"]);
  });

  it("leave text without links alone", () => {
    expect(monsterLinksToResidue("<p>1d4 cave rat;cave rats</p>")).toEqual({ html: "<p>1d4 cave rat;cave rats</p>", ids: new Map() });
  });
});
