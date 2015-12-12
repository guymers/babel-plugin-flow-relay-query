/* eslint no-console:0 */
// from relay/examples/scripts/updateSchema.js

import fs from "fs";
import path from "path";
import schema from "./articleSchema";
import { graphql } from "graphql";
import { introspectionQuery } from "graphql/utilities";

async function updateSchema() {
  const result = await graphql(schema, introspectionQuery);
  if (result.errors) {
    console.error("ERROR: ", JSON.stringify(result.errors, null, 2));
  } else {
    fs.writeFileSync(
      path.join(__dirname, "articleSchema.json"),
      JSON.stringify(result, null, 2)
    );
  }
}

updateSchema();
