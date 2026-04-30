import { hashDocument } from "../../src/shared/hash";

describe("hashDocument", () => {
  it("deve retornar um hash sha256", () => {
    const hash = hashDocument("12345678901");
    expect(hash).toHaveLength(64);
  });

  it("deve retornar o mesmo hash independente da formatação", () => {
    const hash1 = hashDocument("123.456.789-01");
    const hash2 = hashDocument("12345678901");
    expect(hash1).toBe(hash2);
  });

  it("não deve retornar o documento em texto puro", () => {
    const hash = hashDocument("12345678901");
    expect(hash).not.toBe("12345678901");
  });
});