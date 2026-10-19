import { compileTemplateExpression } from "../../../src/parser/lib/DDBTemplateExpression";

// stands in for the template parser's operand lookup
const VALUES: Record<string, string> = {
  "classlevel": "7",
  "characterlevel": "7",
  "proficiency": "3",
  "modifier:cha": "4",
  "modifier:str,dex": "2",
};
const resolve = (token: string) => VALUES[token] ?? token;
const compile = (source: string) => compileTemplateExpression(source, resolve);

describe("compileTemplateExpression", () => {
  describe("@ rounding", () => {
    it("rounds the division before it, not just the divisor", () => {
      expect(compile("classlevel/2@roundup")).toBe("ceil(7 / 2)");
      expect(compile("classlevel/2@rounddown")).toBe("floor(7 / 2)");
      expect(compile("classlevel/2@roundown")).toBe("floor(7 / 2)");
    });

    it("rounds only the term it follows in a sum", () => {
      expect(compile("classlevel/2@roundup+1")).toBe("ceil(7 / 2) + 1");
      expect(compile("modifier:cha+classlevel/2@roundup")).toBe("4 + ceil(7 / 2)");
    });

    it("keeps multiplying and dividing after a rounded term", () => {
      expect(compile("classlevel/2@roundup*3")).toBe("ceil(7 / 2) * 3");
    });

    it("rounds a bracketed group as a whole", () => {
      expect(compile("(classlevel/2)@rounddown")).toBe("floor((7 / 2))");
      expect(compile("(classlevel+1)@rounddown")).toBe("floor((7 + 1))");
    });

    it("rounds only the bracketed group after a multiplier, as DDB writes its templates", () => {
      expect(compile("4+2*((classlevel+1)/6)@rounddown")).toBe("4 + 2 * floor(((7 + 1) / 6))");
      expect(compile("6+2*(classlevel/5)@rounddown,max:3")).toBe("min(6 + 2 * floor((7 / 5)), 3)");
      expect(compile("((classlevel+1)/6)@rounddown*2+4")).toBe("floor(((7 + 1) / 6)) * 2 + 4");
    });
  });

  describe("constraints on the whole expression", () => {
    it("applies # and , rounding to everything before it", () => {
      expect(compile("(classlevel+1)/2#rounddown")).toBe("floor((7 + 1) / 2)");
      expect(compile("1+classlevel/2,rounddown")).toBe("floor(1 + 7 / 2)");
    });

    it("turns a min constraint into a floor and a max constraint into a ceiling", () => {
      expect(compile("modifier:cha+proficiency#min:1")).toBe("max(4 + 3, 1)");
      expect(compile("classlevel+modifier:cha@max:5")).toBe("min(7 + 4, 5)");
    });

    it("keeps applying an @ bound on a bracketed group to the whole expression when nothing follows", () => {
      expect(compile("(classlevel/7)@min:1,rounddown")).toBe("floor(max((7 / 7), 1))");
    });
  });

  describe("@ bounds on a bracketed group followed by more arithmetic", () => {
    it("bounds and rounds just the group before adding (2014 Inquisition Domain)", () => {
      expect(compile("(classlevel/7)@min:1,rounddown+1")).toBe("floor(max((7 / 7), 1)) + 1");
    });

    it("bounds and rounds just the group before multiplying (Nakudama tongue die)", () => {
      expect(compile("6+(characterlevel/5)@max:1,rounddown*2+(characterlevel/11)@rounddown*2+(characterlevel/17)@rounddown*2"))
        .toBe("6 + floor(min((7 / 5), 1)) * 2 + floor((7 / 11)) * 2 + floor((7 / 17)) * 2");
    });
  });

  it("passes functions, dice and multi-ability operands through", () => {
    expect(compile("max(modifier:cha,1)")).toBe("max(4, 1)");
    expect(compile("2d6+modifier:str,dex")).toBe("2d6 + 2");
  });

  it("throws on an operand it cannot resolve", () => {
    expect(() => compile("unknownthing+1")).toThrow(/Unresolved template operand/);
  });
});
