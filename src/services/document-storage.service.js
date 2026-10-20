import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

function fileInRoot(root, reference) {
  const base = path.resolve(root);
  const file = path.resolve(base, reference);
  if (file === base || !file.startsWith(base + path.sep))
    throw new Error("Document path outside upload root");
  return file;
}

/** Compensates disk writes; never removes a file still referenced in MongoDB. */
export async function storeDocuments({
  user,
  plans,
  root,
  referenceInUse,
  warn = console.warn,
}) {
  const names = new Set(plans.map((file) => file.name));
  if (names.size !== plans.length)
    throw Object.assign(new Error("Duplicate document type"), { status: 400 });
  const original = user.documents.map(({ name, reference }) => ({
    name,
    reference,
  }));
  const created = [];
  // Resolve every destination before writing the first file.
  const destinations = plans.map((file) => fileInRoot(root, file.reference));

  async function discardIfUnused(reference) {
    try {
      if (!(await referenceInUse(reference))) {
        await unlink(fileInRoot(root, reference)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    } catch {
      // An uncertain DB result must not delete a potentially committed document.
      warn(
        "Document cleanup deferred: reference check or disk operation failed",
      );
    }
  }

  try {
    for (let i = 0; i < plans.length; i++) {
      await mkdir(path.dirname(destinations[i]), { recursive: true });
      await writeFile(destinations[i], plans[i].buffer, { flag: "wx" });
      created.push(plans[i].reference);
    }
    user.documents = [
      ...original.filter((document) => !names.has(document.name)),
      ...plans.map(({ name, reference }) => ({ name, reference })),
    ];
    await user.save();
  } catch (error) {
    user.documents = original;
    for (const reference of created) await discardIfUnused(reference);
    throw error;
  }
  // Only after the new metadata is committed may superseded files be removed.
  for (const document of original)
    if (names.has(document.name)) await discardIfUnused(document.reference);
}
