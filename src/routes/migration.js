const express = require("express");
const MigrationController = require("../controllers/migration");
const { checkLogin, isAdmin } = require("../middlewares/auth");

const migrationRouter = express.Router();

// Endpoint migration (temporarily without auth for easy migration)
migrationRouter.post("/final-test", MigrationController.migrateFinalTest);
migrationRouter.get("/final-test/status", MigrationController.checkMigrationStatus);

// Secure endpoints (with auth) - commented out for now
// migrationRouter.post("/final-test", checkLogin, isAdmin, MigrationController.migrateFinalTest);
// migrationRouter.get("/final-test/status", checkLogin, isAdmin, MigrationController.checkMigrationStatus);

module.exports = migrationRouter; 