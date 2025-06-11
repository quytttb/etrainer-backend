const express = require("express");
const MigrationController = require("../controllers/migration");
const { checkLogin, isAdmin } = require("../middlewares/auth");

const migrationRouter = express.Router();

// 🔒 SECURITY FIX: Secure migration endpoints with admin authentication
migrationRouter.post("/final-test", checkLogin, isAdmin, MigrationController.migrateFinalTest);
migrationRouter.get("/final-test/status", checkLogin, isAdmin, MigrationController.checkMigrationStatus);

// 🚨 DANGEROUS: Temporarily without auth for easy migration (REMOVED FOR SECURITY)
// migrationRouter.post("/final-test", MigrationController.migrateFinalTest);
// migrationRouter.get("/final-test/status", MigrationController.checkMigrationStatus);

module.exports = migrationRouter; 