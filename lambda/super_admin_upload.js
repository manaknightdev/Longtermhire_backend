const UploadService = require("../../../baas/services/UploadService");
const {
  getLocalPath,
  sqlDateFormat,
  sqlDateTimeFormat,
  sizeOfRemote,
} = require("../../../baas/services/UtilService");
const sizeOf = require("image-size");
const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const upload = UploadService.local_upload();
const uploadS3 = UploadService.s3_upload();
const uploadS3Public = UploadService.s3_upload_public();
const fs = require("fs");

const imageMiddlewares = [upload.single("file")];
const imageMiddlewaresS3 = [uploadS3.single("file")];
const imagesMiddlewares = [upload.array("files")];
const imagesMiddlewaresS3 = [uploadS3.array("files")];

module.exports = function (app) {
  // Single file upload (local storage)
  app.post(
    "/v1/api/longtermhire/super_admin/lambda/upload",
    imageMiddlewares,
    async function (req, res) {
      try {
        // Set user_id for upload path
        req.user_id = 2;

        // No permission check needed - matches other API routes

        const url = getLocalPath(req.file.path);

        let params = {
          url: url,
          user_id: 2, // Use current admin user ID 2
          caption: req.body.caption || null,
          type: 1,
          width: 0,
          height: 0,
        };
        const whitelist = ["image/png", "image/jpeg", "image/jpg"];

        const uploadedfile = fs.readFileSync(req.file.path);

        if (whitelist.includes(req.file.mimetype)) {
          const dimensions = sizeOf(uploadedfile);
          params.width = dimensions.width;
          params.height = dimensions.height;
          params.type = 0;
        }

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const result = await sdk.create("uploads", {
          url: params.url,
          caption: params.caption,
          user_id: 1, // Default user_id since no auth middleware
          width: params.width,
          height: params.height,
          type: params.type,
          created_at: sqlDateFormat(new Date()),
          updated_at: sqlDateTimeFormat(new Date()),
        });

        return res.status(201).json({ id: result, url });
      } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
      }
    }
  );

  // Single file upload (S3 storage)
  app.post(
    "/v1/api/longtermhire/super_admin/lambda/s3/upload",
    imageMiddlewaresS3,
    async function (req, res) {
      try {
        // Set user_id for upload path
        req.user_id = 2;

        // No permission check needed - matches other API routes

        const url = req.file.location;

        let params = {
          url: url,
          user_id: 2, // Use current admin user ID 2
          caption: req.body.caption || null,
          type: 1,
          width: 0,
          height: 0,
        };
        const whitelist = ["image/png", "image/jpeg", "image/jpg"];

        if (whitelist.includes(req.file.mimetype)) {
          const dimensions = await sizeOfRemote(url);
          params.width = dimensions.width;
          params.height = dimensions.height;
          params.type = 1;
        }

        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const result = await sdk.create("uploads", {
          url: params.url,
          caption: params.caption,
          user_id: 1, // Default user_id since no auth middleware
          width: params.width,
          height: params.height,
          type: params.type,
          created_at: sqlDateFormat(new Date()),
          updated_at: sqlDateTimeFormat(new Date()),
        });

        res.set("Content-Type", "application/json");
        return res.status(201).json({ id: result, url });
      } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
      }
    }
  );

  // Multiple files upload (local storage)
  app.post(
    "/v1/api/longtermhire/super_admin/lambda/uploads",
    imagesMiddlewares,
    async function (req, res, next) {
      try {
        // No permission check needed - matches other API routes
        let urlArray = [];
        let urlArrayObject = [];
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        for (const file of req.files) {
          const url = getLocalPath(file.path);
          urlArray.push(url);
          let width = 0;
          let height = 0;
          let type = 1;

          if (!file.mimetype.includes("video")) {
            const uploadedfile = fs.readFileSync(file.path);
            const dimensions = sizeOf(uploadedfile);
            width = dimensions.width;
            height = dimensions.height;
            type = 0;
          }

          const result = await sdk.create("uploads", {
            url: url,
            caption: "",
            user_id: 1, // Default user_id since no auth middleware
            width: width,
            height: height,
            type: type,
            created_at: sqlDateFormat(new Date()),
            updated_at: sqlDateTimeFormat(new Date()),
          });

          urlArrayObject.push({ id: result, url: url });
        }
        return res
          .status(201)
          .json({ success: true, attachments: urlArrayObject });
      } catch (error) {
        console.log(error);
        return res
          .status(500)
          .json({ success: false, error: true, message: error.message });
      }
    }
  );

  // Multiple files upload (S3 storage)
  app.post(
    "/v1/api/longtermhire/super_admin/lambda/s3/uploads",
    imagesMiddlewaresS3,
    async function (req, res, next) {
      try {
        // No permission check needed - matches other API routes
        let urlArray = [];
        let urlArrayObject = [];
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        for (const file of req.files) {
          const url = file.location;
          urlArray.push(url);
          let width = 0;
          let height = 0;
          let type = 1;

          if (!file.mimetype.includes("video")) {
            const dimensions = await sizeOfRemote(file.location);
            width = dimensions.width;
            height = dimensions.height;
            type = 0;
          }

          const result = await sdk.create("uploads", {
            url: url,
            caption: "",
            user_id: 1, // Default user_id since no auth middleware
            width: width,
            height: height,
            type: type,
            created_at: sqlDateFormat(new Date()),
            updated_at: sqlDateTimeFormat(new Date()),
          });

          urlArrayObject.push({ id: result, url: url });
        }
        return res
          .status(201)
          .json({ success: true, attachments: urlArrayObject });
      } catch (error) {
        return res
          .status(500)
          .json({ success: false, error: true, message: error.message });
      }
    }
  );
};
