/**
 * Compile compound DDB arithmetic without dropping text after postfix constraints.
 * Rounding binds to its operand; min/max constraints cap the preceding expression.
 * Token resolution is supplied by the template parser so class/ability lookup stays shared.
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
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const expect = (value: string) => {
    if (take() !== value) throw new Error(`Expected ${value} in template expression`);
  };

  const primary = (): string => {
    const token = take();
    if (!token) throw new Error("Missing template operand");
    let value: string;
    if (token === "(") {
      value = `(${expression()})`;
      expect(")");
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
    while (["@rounddown", "@roundown", "@roundup"].includes(peek())) {
      value = `${take() === "@roundup" ? "ceil" : "floor"}(${value})`;
    }
    return value;
  };
  const term = (): string => {
    let value = primary();
    while (["*", "/"].includes(peek())) value = `${value} ${take()} ${primary()}`;
    return value;
  };
  const additive = (): string => {
    let value = term();
    while (["+", "-"].includes(peek())) value = `${value} ${take()} ${term()}`;
    return value;
  };
  // "#" constraints apply to everything before them, so "a+b#rounddown" is floor(a + b); "@" rounding binds
  // to its operand in primary()
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
