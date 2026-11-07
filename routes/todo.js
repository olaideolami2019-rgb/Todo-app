
const express = require("express");
const router = express.Router();

const Todo = require("../models/Todo");
const { authMiddleware } = require("../middleware/auth");
const { getSocket } = require("../config/socket");

// CREATE A TODO
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, due_date } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({
        message: "Title and due date are required",
      });
    }

    const parsedDate = new Date(due_date);

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid due date",
      });
    }

    const todo = await Todo.create({
      title,
      due_date: parsedDate,
      user: req.user.userId,
    });

    res.status(201).json({
      message: "Todo created successfully",
      todo,
    });
  } catch (error) {
    console.error("Create Todo Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL TODOS BELONGING TO LOGGED-IN USER
router.get("/", authMiddleware, async (req, res) => {
  try {
    const todos = await Todo.find({
      user: req.user.userId,
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });

    res.json({
      message: "Todos retrieved successfully",
      todos,
    });
  } catch (error) {
    console.error("Get Todos Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE A TODO
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, due_date, status } = req.body;

    const existingTodo = await Todo.findOne({
      _id: req.params.id,
      user: req.user.userId,
      status: { $ne: "deleted" },
    });

    if (!existingTodo) {
      return res.status(404).json({
        message: "Todo not found",
      });
    }

    const updates = {};

    if (title !== undefined) {
      updates.title = title;
    }

    if (due_date !== undefined) {
      const parsedDate = new Date(due_date);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date",
        });
      }

      updates.due_date = parsedDate;
    }

    if (status !== undefined) {
      if (!["pending", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Invalid task status",
        });
      }

      updates.status = status;
    }

    const todo = await Todo.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
        status: { $ne: "deleted" },
      },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (
      existingTodo.status !== "completed" &&
      todo.status === "completed"
    ) {
      const io = getSocket();

      io.to(req.user.userId.toString()).emit("todo-completed", {
        message: "Your task has been completed!",
        todoId: todo._id,
        title: todo.title,
        status: todo.status,
      });
    }

    res.json({
      message: "Todo updated successfully",
      todo,
    });
  } catch (error) {
    console.error("Update Todo Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE A TODO (SOFT DELETE)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
        status: { $ne: "deleted" },
      },
      { $set: { status: "deleted" } },
      { returnDocument: "after" }
    );

    if (!todo) {
      return res.status(404).json({
        message: "Todo not found",
      });
    }

    res.json({
      message: "Todo deleted successfully",
    });
  } catch (error) {
    console.error("Delete Todo Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
