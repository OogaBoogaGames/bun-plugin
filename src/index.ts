import type { BunPlugin } from "bun";

type PluginConfig = {
  globalName: string | null;
  importName: string;
};

export default (
  conf: PluginConfig = {
    globalName: "OogaBooga",
    importName: "@oogaboogagames/game-core",
  }
) =>
  ({
    name: "@oogaboogagames/bun-plugin",
    setup(build) {
      build.onLoad({ filter: /.*/ }, async (args) => {
        const { path } = args;
        const code = await Bun.file(path).text();

        const transformedCode = importsToObject(code, conf);

        return { contents: transformedCode, loader: "ts" };
      });
    },
  } as BunPlugin);

function importsToObject(
  code: string,
  { globalName, importName }: PluginConfig
) {
  // Regular expression to match import statements
  // const importStatementRegex =
  //   /import\s*{([^}]*)}\s*from\s*["']([^"']+)["'];?/g;

  const importStatementRegex = new RegExp(
    "import\\s*{([^}]*)}\\s*from\\s*[\"']" + importName + "[\"'];?",
    "g"
  );

  // Replace import statements with object properties
  const transformedCode = code.replace(
    importStatementRegex,
    (match, namedImports, modulePath) => {
      // Split named imports by comma and remove spaces
      const importIdentifiers = namedImports
        .split(",")
        .map((importSpecifier: string) => importSpecifier.trim())
        .filter((str: string) => str !== "");
      // Generate the replacement string
      const replacement = importIdentifiers
        .map((importIdentifier: string) =>
          globalName
            ? `const ${importIdentifier} = globalThis.${globalName}.${importIdentifier};`
            : `const ${importIdentifier} = globalThis.${importIdentifier};`
        )
        .join("\n");

      return replacement;
    }
  );

  return transformedCode;
}
