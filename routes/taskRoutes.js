const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware"); // ✅ sahi path

const taskController = require("../controllers/taskController");

// ✅ Admin creates task
router.post("/create", protect("admin"), taskController.createTask);

// ✅ Employee: Get my tasks
router.get("/my-tasks", protect("employee"), taskController.getMyTasks);

// ✅ Admin: Get all tasks created by me
router.get("/admin-tasks", protect("admin"), taskController.getAdminTasks);

// ✅ Employee: Update task status
router.put("/:taskId/status", protect("employee"), taskController.updateTaskStatus);

// ✅ Admin: Approve or Reject task requests
router.put("/:taskId/request-status", protect("admin"), taskController.updateTaskRequestStatus);

module.exports = router;
