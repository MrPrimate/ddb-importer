/**
 * Compile the compound arithmetic in a DDB template string (the part inside `{{ }}`) into a
 * Foundry roll formula, keeping everything after a postfix constraint. The template parser
 * supplies `resolve`, which turns an operand token into its value, so class, ability and scale
 * lookups stay in one place.
 *
 * Grammar, loosest binding first:
 *
 *   expression := additive ( constraint )*
 *   constraint := ("#" | "," | "") ("rounddown" | "roundown" | "roundup")
 *              |  ("@" | "#" | "") ("min" | "max") ":" additive
 *   additive   := term ( ("+" | "-") term )*
 *   term       := primary ( ("*" | "/") primary | "@rounddown" | "@roundown" | "@roundup" )*
 *   primary    := "(" expression ")" | ("+" | "-") primary | fn "(" expression ("," expression)* ")"
 *              |  number | dice | operand
 *   fn         := "min" | "max" (two arguments) | "floor" | "ceil" (one argument)
 *   operand    := a word, optionally with ability suffixes ("classlevel", "modifier:cha",
 *                 "modifier:str,dex"), passed to `resolve`; a multi-part result is parenthesised
 *
 * Binding rules, with `classlevel` = 7 and `modifier:cha` = 4:
 * - "@" rounding after a bracket or function call rounds that group, as DDB writes it:
 *   "4+2*((classlevel+1)/6)@rounddown" is `4 + 2 * floor(((7 + 1) / 6))`.
 * - "@" rounding after a plain operand rounds the product or quotient it ends, never a sum:
 *   "classlevel/2@roundup" is `ceil(7 / 2)` and "modifier:cha+classlevel/2@roundup" is
 *   `4 + ceil(7 / 2)`.
 * - "#" and "," constraints apply to everything before them:
 *   "(classlevel+1)/2#rounddown" is `floor((7 + 1) / 2)`.
 * - A min constraint is a floor on the value and a max constraint a ceiling:
 *   "modifier:cha+proficiency#min:1" is `max(4 + 3, 1)`, "classlevel@max:5" is `min(7, 5)`.
 * - "rounddown" and "roundown" (DDB's misspelling) are the same.
 *
 * Throws on anything outside the grammar or an operand `resolve` cannot resolve; the template
 * parser then logs the template and leaves it unreplaced in the text.
 */
export function compileTemplateExpression(source: string, resolve: (token: string) => string): string {
  const tokens: string[] = [];
  let remaining = source.trim();
  while (remaining) {
    const token = (/^(?:[@#](?:rounddown|roundown|roundup|min|max)|\d*d\d+|\d+(?:\.\d+)?|[a-z][a-z0-9]*(?::[a-z]{3}(?:,[a-z]{3})*)?|[()+*/,:-])/i).exec(remaining);
    if (!token) throw new Error(`Unsupported template expression near ${remaining}`);
    tokens.push(token[0]);
    remaining = remaining.slice(token[0].length).trimStart();
  }
  let position = 0;
  // whether the operand primary() last returned was a bracketed group or a function call
  let lastGrouped = false;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const expect = (value: string) => {
    if (take() !== value) throw new Error(`Expected ${value} in template expression`);
  };

  const primary = (): string => {
    const token = take();
    if (!token) throw new Error("Missing template operand");
    let value: string;
    let grouped = false;
    if (token === "(") {
      value = `(${expression()})`;
      expect(")");
      grouped = true;
    } else if (token === "+" || token === "-") {
      value = `${token}${primary()}`;
    } else if (["min", "max", "floor", "ceil"].includes(token) && peek() === "(") {
      take();
      const args = [expression()];
      while (peek() === ",") {
        take();
        args.push(expression());
      }
      expect(")");
      const arity = ["floor", "ceil"].includes(token) ? 1 : 2;
      if (args.length !== arity) throw new Error(`Invalid ${token} operand count`);
      value = `${token}(${args.join(", ")})`;
      grouped = true;
    } else if ((/^\d+(?:\.\d+)?$/).test(token)) {
      value = token;
    } else if ((/^[a-z0-9]/i).test(token)) {
      value = resolve(token).trim().replace(/^\+\s*/, "");
      if (!value || value.includes("{{") || (value === token && !(/^\d*d\d+$/).test(token))) {
        throw new Error(`Unresolved template operand ${token}`);
      }
      if ((/[+*/ ]/).test(value)) value = `(${value})`;
    } else {
      throw new Error(`Unexpected template operand ${token}`);
    }
    lastGrouped = grouped;
    return value;
  };
  // A term is built as `head` (the operands and operators so far) plus `last` (the latest operand),
  // so "@" rounding can close over just a bracketed operand or over the whole product or quotient
  const term = (): string => {
    let head = "";
    let last = primary();
    let grouped = lastGrouped;
    while (true) {
      const next = peek();
      if (next === "*" || next === "/") {
        head = `${head}${last} ${take()} `;
        last = primary();
        grouped = lastGrouped;
      } else if (["@rounddown", "@roundown", "@roundup"].includes(next)) {
        const round = take() === "@roundup" ? "ceil" : "floor";
        if (grouped) {
          last = `${round}(${last})`;
        } else {
          last = `${round}(${head}${last})`;
          head = "";
        }
        grouped = true;
      } else {
        return `${head}${last}`;
      }
    }
  };
  const additive = (): string => {
    let value = term();
    while (["+", "-"].includes(peek())) value = `${value} ${take()} ${term()}`;
    return value;
  };
  // "#" constraints apply to everything before them, so "a+b#rounddown" is floor(a + b); "@" rounding binds
  // to the product or quotient before it in term()
  const expression = (): string => {
    let value = additive();
    while (true) {
      if (peek() === "," && ["min", "max", "rounddown", "roundown", "roundup"].includes(tokens[position + 1])) take();
      const next = peek();
      if (["#rounddown", "#roundown", "#roundup", "rounddown", "roundown", "roundup"].includes(next)) {
        take();
        value = `${next.endsWith("up") ? "ceil" : "floor"}(${value})`;
        continue;
      }
      if (!["@min", "@max", "#min", "#max", "min", "max"].includes(next)) break;
      const constraint = take().replace(/^[@#]/, "");
      expect(":");
      value = `${constraint === "min" ? "max" : "min"}(${value}, ${additive()})`;
    }
    return value;
  };
  const result = expression();
  if (position !== tokens.length) throw new Error(`Unexpected template suffix ${peek()}`);
  return result;
}
