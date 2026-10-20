import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { storeDocuments } from "../../src/services/document-storage.service.js";

async function scenario(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), "course-documents-"));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const plan = (reference = "documents/new.pdf") => ({
  name: "identification",
  reference,
  buffer: Buffer.from("%PDF-example"),
});
test("failed Mongo save removes only new unreferenced files and preserves old metadata", async () => {
  await scenario(async (root) => {
    await mkdir(path.join(root, "documents"));
    await writeFile(path.join(root, "documents/old.pdf"), "original");
    const user = {
      documents: [{ name: "identification", reference: "documents/old.pdf" }],
      save: async () => {
        throw new Error("Mongo unavailable");
      },
    };
    await assert.rejects(
      storeDocuments({
        user,
        plans: [plan()],
        root,
        referenceInUse: async () => false,
      }),
      /Mongo unavailable/,
    );
    assert.deepEqual(await readdir(path.join(root, "documents")), ["old.pdf"]);
    assert.equal(user.documents[0].reference, "documents/old.pdf");
  });
});
test("replacement removes the superseded file only after committing new metadata", async () => {
  await scenario(async (root) => {
    await mkdir(path.join(root, "documents"));
    await writeFile(path.join(root, "documents/old.pdf"), "original");
    let committed = false;
    const user = {
      documents: [{ name: "identification", reference: "documents/old.pdf" }],
      save: async () => {
        assert.equal(
          await readFile(path.join(root, "documents/old.pdf"), "utf8"),
          "original",
        );
        committed = true;
      },
    };
    await storeDocuments({
      user,
      plans: [plan()],
      root,
      referenceInUse: async () => {
        assert.equal(committed, true);
        return false;
      },
    });
    assert.deepEqual(await readdir(path.join(root, "documents")), ["new.pdf"]);
    assert.equal(user.documents[0].reference, "documents/new.pdf");
  });
});
test("ambiguous database result preserves a potentially committed new file", async () => {
  await scenario(async (root) => {
    const user = {
      documents: [],
      save: async () => {
        throw new Error("Unknown write result");
      },
    };
    const warnings = [];
    await assert.rejects(
      storeDocuments({
        user,
        plans: [plan()],
        root,
        referenceInUse: async () => {
          throw new Error("DB still offline");
        },
        warn: (message) => warnings.push(message),
      }),
    );
    assert.deepEqual(await readdir(path.join(root, "documents")), ["new.pdf"]);
    assert.equal(warnings.length, 1);
  });
});
test("duplicate types and paths outside the root are rejected before disk writes", async () => {
  await scenario(async (root) => {
    const user = {
      documents: [],
      save: async () => assert.fail("Must not save"),
    };
    const referenceInUse = async () => false;
    await assert.rejects(
      storeDocuments({
        user,
        plans: [plan(), plan("documents/second.pdf")],
        root,
        referenceInUse,
      }),
      /Duplicate/,
    );
    await assert.rejects(
      storeDocuments({
        user,
        plans: [plan("../outside.pdf")],
        root,
        referenceInUse,
      }),
      /outside/,
    );
    assert.deepEqual(await readdir(root), []);
  });
});
test("write collision never overwrites or removes the pre-existing file", async () => {
  await scenario(async (root) => {
    await mkdir(path.join(root, "documents"));
    await writeFile(path.join(root, "documents/new.pdf"), "keep");
    const user = {
      documents: [],
      save: async () => assert.fail("Must not save"),
    };
    await assert.rejects(
      storeDocuments({
        user,
        plans: [plan()],
        root,
        referenceInUse: async () => false,
      }),
      /EEXIST/,
    );
    assert.equal(
      await readFile(path.join(root, "documents/new.pdf"), "utf8"),
      "keep",
    );
  });
});
