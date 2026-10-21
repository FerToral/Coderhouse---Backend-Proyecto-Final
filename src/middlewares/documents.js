import multer from "multer";
import { randomUUID } from "node:crypto";
import { UserModel } from "../dao/models/users.model.js";
import { requiredDocuments } from "../services/accounts.service.js";
import { storeDocuments } from "../services/document-storage.service.js";
const receive = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 5 },
}).any();
export async function ownsAccount(req, res, next) {
  if (!req.session?.user)
    return res.status(401).json({ status: "error", msg: "Login required" });
  if (
    req.session.user._id !== req.params.uid &&
    req.session.user.rol !== "admin"
  )
    return res
      .status(403)
      .json({ status: "error", msg: "Account access forbidden" });
  next();
}
export function uploadDocuments(req, res, next) {
  receive(req, res, async (error) => {
    if (error)
      return res
        .status(400)
        .json({ status: "error", msg: "Maximum five files, 5 MB each" });
    try {
      const user = await UserModel.findById(req.params.uid);
      if (!user)
        return res.status(404).json({ status: "error", msg: "User not found" });
      if (!req.files?.length)
        return res
          .status(400)
          .json({ status: "error", msg: "No files received" });
      const plans = req.files.map((file) => {
        if (
          ![...requiredDocuments, "profile", "product"].includes(file.fieldname)
        )
          throw Object.assign(new Error("Unknown document type"), {
            status: 400,
          });
        const pdf = file.buffer.subarray(0, 5).toString() === "%PDF-";
        const png = file.buffer
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const jpg =
          file.buffer[0] === 255 &&
          file.buffer[1] === 216 &&
          file.buffer[2] === 255;
        if (
          !(pdf || png || jpg) ||
          (["profile", "product"].includes(file.fieldname) && pdf)
        )
          throw Object.assign(
            new Error(
              "Only PDF, PNG or JPEG with valid signatures are accepted",
            ),
            { status: 400 },
          );
        const folder =
          file.fieldname === "profile"
            ? "profiles"
            : file.fieldname === "product"
              ? "products"
              : "documents";
        const filename = randomUUID() + (pdf ? ".pdf" : png ? ".png" : ".jpg");
        return {
          name: file.fieldname,
          reference: folder + "/" + filename,
          buffer: file.buffer,
        };
      });
      await storeDocuments({
        user,
        plans,
        root: req.app.locals.uploadRoot,
        referenceInUse: (reference) =>
          UserModel.exists({ "documents.reference": reference }),
      });
      res.status(201).json({
        status: "success",
        documents: user.documents.map((document) => ({
          name: document.name,
        })),
      });
    } catch (err) {
      next(err);
    }
  });
}
