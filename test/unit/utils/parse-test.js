import { describe, it } from "mocha";
import { parseFile } from "../../../src/utils/parse";

describe("parse", () => {
  it("handles a filename that does not exist", () => {
    const filename = "does_not_exist";
    parseFile(filename, {}, {});
  });
});
