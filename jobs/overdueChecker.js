
const Todo = require("../models/Todo");
const User = require("../models/user");
const { getSocket } = require("../config/socket");
const { sendOverdueEmail } = require("../utils/email");

async function checkOverdueTodos() {
  try {
    const now = new Date();

    const overdueTodos = await Todo.find({
      status: "pending",
      due_date: { $lte: now },
    });

    for (const todo of overdueTodos) {
      const updatedTodo = await Todo.findOneAndUpdate(
        {
          _id: todo._id,
          status: "pending",
        },
        {
          $set: { status: "overdue" },
        },
        { returnDocument: "after" }
      );

      if (!updatedTodo) continue;

      // Send real-time notification to task owner
      getSocket()
        .to(updatedTodo.user.toString())
        .emit("todo-overdue", {
          message: "Your task is overdue!",
          todoId: updatedTodo._id,
          title: updatedTodo.title,
          status: updatedTodo.status,
        });

      // Find task owner and send email
       const owner = await User.findById(updatedTodo.user);

console.log("Task owner found:", !!owner);
console.log("Task owner's email:", owner?.email);

if (owner && owner.email) {
        try {
          await sendOverdueEmail(owner.email, updatedTodo.title);
          console.log("Overdue email sent to:", owner.email);
        } catch (emailError) {
          console.error("Email sending failed:", emailError.message);
        }
      }

      console.log("Overdue task detected:", updatedTodo.title);
    }
  } catch (error) {
    console.error("Overdue checker error:", error);
  }
}

// Check immediately, then every 30 seconds
checkOverdueTodos();
setInterval(checkOverdueTodos, 30 * 1000);

module.exports = checkOverdueTodos;
