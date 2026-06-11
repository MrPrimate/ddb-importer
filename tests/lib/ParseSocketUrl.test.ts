import { describe, it, expect } from "vitest";
import { parseSocketUrl } from "../../src/lib/streaming/ParseSocketUrl";

describe("parseSocketUrl", () => {
  it("returns url with namespace appended when no subpath", () => {
    const result = parseSocketUrl("https://proxy.ddb.mrprimate.co.uk", "/monsters");
    expect(result).toEqual({
      url: "https://proxy.ddb.mrprimate.co.uk/monsters",
      path: undefined,
    });
  });

  it("extracts subpath into socket.io path option", () => {
    const result = parseSocketUrl("https://vtt.example.com/ddb-proxy", "/monsters");
    expect(result).toEqual({
      url: "https://vtt.example.com/monsters",
      path: "/ddb-proxy/socket.io",
    });
  });

  it("strips trailing slash from subpath", () => {
    const result = parseSocketUrl("https://vtt.example.com/ddb-proxy/", "/mule");
    expect(result).toEqual({
      url: "https://vtt.example.com/mule",
      path: "/ddb-proxy/socket.io",
    });
  });

  it("handles root namespace with subpath", () => {
    const result = parseSocketUrl("https://vtt.example.com/ddb-proxy", "/");
    expect(result).toEqual({
      url: "https://vtt.example.com/",
      path: "/ddb-proxy/socket.io",
    });
  });

  it("falls back to simple concatenation for invalid URL", () => {
    const result = parseSocketUrl("not-a-url", "/monsters");
    expect(result).toEqual({
      url: "not-a-url/monsters",
      path: undefined,
    });
  });

  it("handles deeply nested subpath", () => {
    const result = parseSocketUrl("https://services.example.com/api/v2/proxy", "/spells");
    expect(result).toEqual({
      url: "https://services.example.com/spells",
      path: "/api/v2/proxy/socket.io",
    });
  });
});
