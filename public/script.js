const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
} else {
  // Connect to Socket.IO
  const socket = io({
    auth: { token: token },
  });

  socket.on("connect", () => {
    console.log("Connected to notification server!");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
  });

  // Notifications
  socket.on("todo-completed", (data) => {
    alert(data.message + "\nTask: " + data.title);
    loadTodos();
  });

  socket.on("todo-overdue", (data) => {
    alert(data.message + "\nTask: " + data.title);
    loadTodos();
  });

  // Create a new task
  const todoForm = document.getElementById("todoForm");

  todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const due_date = document.getElementById("due_date").value;

    try {
      const response = await fetch("/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ title, due_date }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not create task");
        return;
      }

      alert("Task created successfully!");
      todoForm.reset();
      loadTodos();

    } catch (error) {
      console.error("Create task error:", error);
      alert("Something went wrong while creating your task.");
    }
  });

  // Display tasks
  async function loadTodos() {
    try {
      const response = await fetch("/todos", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not load tasks");
        return;
      }

      const todoList = document.getElementById("todoList");
      todoList.innerHTML = "";

      if (data.todos.length === 0) {
        todoList.textContent = "You have no tasks yet.";
        return;
      }

      data.todos.forEach((todo) => {
        const task = document.createElement("div");
        const title = document.createElement("h3");
        const dueDate = document.createElement("p");
        const status = document.createElement("p");

        title.textContent = todo.title;
        dueDate.textContent =
          "Due: " + new Date(todo.due_date).toLocaleString();
        status.textContent = "Status: " + todo.status;

        task.appendChild(title);
        task.appendChild(dueDate);
        task.appendChild(status);

        if (todo.status === "pending" || todo.status === "overdue") {
          const completeButton = document.createElement("button");
          completeButton.textContent = "Mark as Completed";

          completeButton.addEventListener("click", () => {
            updateTodo(todo._id, { status: "completed" });
          });

          task.appendChild(completeButton);
        }

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
          deleteTodo(todo._id);
        });

        task.appendChild(deleteButton);
        todoList.appendChild(task);
      });

    } catch (error) {
      console.error("Load tasks error:", error);
    }
  }

  // Update a task
  async function updateTodo(id, updates) {
    const response = await fetch("/todos/" + id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Task updated successfully!");
      loadTodos();
    } else {
      alert(data.message || "Could not update task");
    }
  }

  // Delete a task
  async function deleteTodo(id) {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    const response = await fetch("/todos/" + id, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (response.ok) {
      alert("Task deleted successfully!");
      loadTodos();
    } else {
      alert(data.message || "Could not delete task");
    }
  }

  // Load tasks when dashboard opens
  loadTodos();
}