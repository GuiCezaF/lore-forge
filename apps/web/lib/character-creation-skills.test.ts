import { describe, expect, it } from "vitest";
import {
  getAvailablePowers,
  getGrantedSkillNames,
  getPowerSelectionLimit,
  getRequiredSkillCount,
  getTrainingUpgradeCount,
  getTrainingUpgradeLimit,
  type CharacterClass,
  type CharacterOrigin,
} from "./character-creation";

const origin: CharacterOrigin = {
  slug: "academico",
  name: "Acadêmico",
  grantedSkills: ["ciencia"],
  skillChoices: [
    {
      slug: "origem",
      selectionCount: 1,
      skills: ["atualidades", "investigacao"],
    },
  ],
};

const characterClass: CharacterClass = {
  slug: "especialista",
  name: "Especialista",
  paths: [],
  trainedSkills: 7,
  trainingUpgradeBase: 1,
  grantedSkills: ["investigacao"],
  skillChoices: [
    {
      slug: "classe",
      selectionCount: 2,
      skills: ["crime", "tecnologia", "pilotagem"],
    },
  ],
};

describe("character creation skill helpers", () => {
  it("counts granted, choice, class and Intellect skill slots", () => {
    expect(getGrantedSkillNames(origin, characterClass)).toEqual([
      "ciencia",
      "investigacao",
    ]);
    expect(getRequiredSkillCount(origin, characterClass, 3)).toBe(15);
  });

  it("counts veteran and expert upgrades against the class limit", () => {
    expect(getTrainingUpgradeLimit(characterClass, 3)).toBe(4);
    expect(
      getTrainingUpgradeCount([
        { name: "ciencia", degree: "trained" },
        { name: "investigacao", degree: "veteran" },
        { name: "crime", degree: "expert" },
      ]),
    ).toBe(3);
  });

  it("only exposes powers available to the selected class and NEX", () => {
    expect(
      getAvailablePowers(
        [
          {
            slug: "general",
            name: "Geral",
            minNex: 5,
            maxRank: 1,
            requiredClassSlug: null,
          },
          {
            slug: "specialist",
            name: "Especialista",
            minNex: 15,
            maxRank: 2,
            requiredClassSlug: "especialista",
          },
          {
            slug: "combatant",
            name: "Combatente",
            minNex: 5,
            maxRank: 1,
            requiredClassSlug: "combatente",
          },
        ],
        15,
        "especialista",
      ).map((power) => power.slug),
    ).toEqual(["general", "specialist"]);
  });

  it("limits class powers to one slot every 15% NEX", () => {
    expect(getPowerSelectionLimit(5)).toBe(0);
    expect(getPowerSelectionLimit(10)).toBe(0);
    expect(getPowerSelectionLimit(15)).toBe(1);
    expect(getPowerSelectionLimit(30)).toBe(2);
    expect(getPowerSelectionLimit(90)).toBe(6);
    expect(getPowerSelectionLimit(99)).toBe(6);
  });
});
