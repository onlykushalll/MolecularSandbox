import { describe, it, expect } from "vitest";
import { checkSolubility, isPrecipitate, getPrecipitateColor } from "./solubility";

describe("Solubility Rules", () => {
  describe("Rule 1: Alkali metal / NH4+ salts always soluble", () => {
    it("NaCl is soluble", () => {
      expect(checkSolubility("NaCl").solubility).toBe("soluble");
    });
    it("KNO3 is soluble", () => {
      expect(checkSolubility("KNO3").solubility).toBe("soluble");
    });
    it("NH4Cl is soluble", () => {
      expect(checkSolubility("NH4Cl").solubility).toBe("soluble");
    });
    it("Na2CO3 is soluble (alkali carbonate)", () => {
      expect(checkSolubility("Na2CO3").solubility).toBe("soluble");
    });
  });

  describe("Rule 2: Nitrates / acetates always soluble", () => {
    it("AgNO3 is soluble", () => {
      expect(checkSolubility("AgNO3").solubility).toBe("soluble");
    });
    it("Pb(NO3)2 — detected as nitrate, soluble", () => {
      const r = checkSolubility("PbNO3");
      expect(r.solubility).toBe("soluble");
    });
  });

  describe("Rule 3: Halides soluble except Ag+, Pb2+, Hg2²+", () => {
    it("CaCl2 is soluble", () => {
      expect(checkSolubility("CaCl").solubility).toBe("soluble");
    });
    it("AgCl is insoluble", () => {
      expect(checkSolubility("AgCl").solubility).toBe("insoluble");
    });
    it("PbCl2 is insoluble", () => {
      expect(checkSolubility("PbCl").solubility).toBe("insoluble");
    });
    it("PbI2 is insoluble", () => {
      expect(checkSolubility("PbI").solubility).toBe("insoluble");
    });
  });

  describe("Rule 4: Sulfates soluble except Ba2+, Pb2+, Sr2+", () => {
    it("CuSO4 is soluble", () => {
      expect(checkSolubility("CuSO4").solubility).toBe("soluble");
    });
    it("BaSO4 is insoluble", () => {
      expect(checkSolubility("BaSO4").solubility).toBe("insoluble");
    });
    it("CaSO4 is slightly soluble", () => {
      expect(checkSolubility("CaSO4").solubility).toBe("slightly");
    });
    it("PbSO4 is insoluble", () => {
      expect(checkSolubility("PbSO4").solubility).toBe("insoluble");
    });
  });

  describe("Rule 5: Carbonates / phosphates insoluble", () => {
    it("CaCO3 is insoluble", () => {
      expect(checkSolubility("CaCO3").solubility).toBe("insoluble");
    });
    it("FePO4 is insoluble", () => {
      expect(checkSolubility("FePO4").solubility).toBe("insoluble");
    });
  });

  describe("Rule 6: Hydroxides insoluble except alkali/Ba/Sr/Ca(slightly)", () => {
    it("Fe(OH)3 → detected as iron hydroxide, insoluble", () => {
      expect(checkSolubility("FeOH").solubility).toBe("insoluble");
    });
    it("Ba(OH)2 is soluble", () => {
      expect(checkSolubility("BaOH").solubility).toBe("soluble");
    });
    it("Ca(OH)2 is slightly soluble", () => {
      expect(checkSolubility("CaOH").solubility).toBe("slightly");
    });
  });

  describe("Rule 7: Sulfides insoluble except alkali/alkaline earth", () => {
    it("CuS is insoluble", () => {
      expect(checkSolubility("CuS").solubility).toBe("insoluble");
    });
    it("Na2S → alkali sulfide, soluble", () => {
      expect(checkSolubility("NaS").solubility).toBe("soluble");
    });
  });

  describe("Acids are soluble", () => {
    it("HCl", () => expect(checkSolubility("HCl").solubility).toBe("soluble"));
    it("H2SO4", () => expect(checkSolubility("H2SO4").solubility).toBe("soluble"));
    it("HNO3", () => expect(checkSolubility("HNO3").solubility).toBe("soluble"));
  });

  describe("Elements / gases", () => {
    it("O2 is not a salt", () => {
      expect(checkSolubility("O2").solubility).toBe("insoluble");
    });
    it("H2O is solvent", () => {
      expect(checkSolubility("H2O").solubility).toBe("soluble");
    });
  });
});

describe("isPrecipitate", () => {
  it("AgCl is a precipitate", () => {
    expect(isPrecipitate("AgCl")).toBe(true);
  });
  it("NaCl is not a precipitate", () => {
    expect(isPrecipitate("NaCl")).toBe(false);
  });
});

describe("getPrecipitateColor", () => {
  it("PbI2 is golden yellow", () => {
    expect(getPrecipitateColor("PbI2", "#ffffff")).toBe("#ffdd00");
  });
  it("unknown compound falls back", () => {
    expect(getPrecipitateColor("XyzAbc", "#aabbcc")).toBe("#aabbcc");
  });
  it("Cu(OH)2 is blue", () => {
    expect(getPrecipitateColor("Cu(OH)2", "#ffffff")).toBe("#3399ff");
  });
});
