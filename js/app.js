document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const columnsContainer = document.getElementById("columns-container");
  const taskModal = document.getElementById("task-modal");
  const columnModal = document.getElementById("column-modal");
  const completeModal = document.getElementById("complete-modal");
  const taskForm = document.getElementById("task-form");
  const columnForm = document.getElementById("column-form");
  const completeForm = document.getElementById("complete-form");
  const addTaskBtn = document.querySelector(".add-task-btn");
  const addColumnBtn = document.querySelector(".add-column-btn");
  const closeModalBtns = document.querySelectorAll(
    ".close-modal, .close-modal-btn"
  );
  const taskColumnSelect = document.getElementById("task-column");
  const taskRepeatSelect = document.getElementById("task-repeat");
  const weeklyOptions = document.getElementById("weekly-options");
  const monthlyOptions = document.getElementById("monthly-options");
  const categoriesContainer = document.getElementById("categories-container");
  const newCategoryInput = document.getElementById("new-category");
  const addCategoryBtn = document.getElementById("add-category-btn");

  //   newCategoryInput.addEventListener("input", () => {
  //     console.log(newCategoryInput.value);
  //   });

  // Initialize days of month options
  const daysOfMonthContainer = document.querySelector(".days-of-month");
  for (let i = 1; i <= 31; i++) {
    const dayLabel = document.createElement("label");
    dayLabel.className = "day-checkbox";
    dayLabel.innerHTML = `<input type="checkbox" name="monthday" value="${i}"> ${i}`;
    daysOfMonthContainer.appendChild(dayLabel);
  }

  // Task colors based on categories
  const categoryColors = {};
  const defaultCategories = [
    "Робота",
    "Особисте",
    "Навчання",
    "Здоров'я",
    "Дім",
  ];

  // Generate random color for a category
  function getCategoryColor(category) {
    if (!categoryColors[category]) {
      const hue = Math.floor(Math.random() * 360);
      categoryColors[category] = `hsl(${hue}, 70%, 60%)`;
    }
    return categoryColors[category];
  }

  // Initialize default columns and load tasks
  let columns = [];
  let tasks = [];

  // Initialize data from localStorage or use defaults
  function initializeData() {
    // Завантаження стовпців
    const savedColumns = localStorage.getItem("columns");
    if (savedColumns) {
      columns = JSON.parse(savedColumns);
    } else {
      // Default columns
      columns = [
        { id: "today", title: "Сьогодні" },
        { id: "tomorrow", title: "Завтра" },
        { id: "other", title: "Інші" },
      ];
      saveColumns();
    }

    // Завантаження завдань
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);

      // Перевіряємо наявність orderIndex, додаємо якщо відсутній
      let needsUpdate = false;
      tasks.forEach((task, index) => {
        if (task.orderIndex === undefined) {
          task.orderIndex = index * 10;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        saveTasks();
      }
    }

    // Завантаження кольорів категорій
    const savedColors = localStorage.getItem("categoryColors");
    if (savedColors) {
      Object.assign(categoryColors, JSON.parse(savedColors));
    } else {
      // Initialize colors for default categories
      defaultCategories.forEach((category) => {
        getCategoryColor(category);
      });
      saveCategoryColors();
    }

    renderColumns();
    renderTasks();
  }

  // Save columns to localStorage
  function saveColumns() {
    localStorage.setItem("columns", JSON.stringify(columns));
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Save category colors to localStorage
  function saveCategoryColors() {
    localStorage.setItem("categoryColors", JSON.stringify(categoryColors));
  }

  // Generate a unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Render columns
  function renderColumns() {
    columnsContainer.innerHTML = "";
    taskColumnSelect.innerHTML = "";

    columns.forEach((column) => {
      // Create column element
      const columnElement = document.createElement("div");
      columnElement.className = "column";
      columnElement.dataset.id = column.id;
      // Видалимо draggable з колонки
      // columnElement.draggable = true;

      // Create column header
      const columnHeader = document.createElement("div");
      columnHeader.className = "column-header";
      // Додаємо draggable до заголовка
      columnHeader.draggable = true;

      // Додаємо обробники перетягування для заголовків колонок замість самих колонок
      columnHeader.addEventListener("dragstart", handleColumnDragStart);
      columnHeader.addEventListener("dragover", handleColumnDragOver);
      columnHeader.addEventListener("drop", handleColumnDrop);
      columnHeader.addEventListener("dragend", handleColumnDragEnd);

      const columnTitle = document.createElement("div");
      columnTitle.className = "column-title";
      columnTitle.textContent = column.title;

      // Додаємо елемент для відображення загального часу
      const columnTotalTime = document.createElement("div");
      columnTotalTime.className = "column-total-time";
      // Розрахуємо загальний час для колонки
      const totalTime = calculateColumnTotalTime(column.id);
      columnTotalTime.textContent = `${totalTime} хв`;

      const deleteColumnBtn = document.createElement("button");
      deleteColumnBtn.className = "delete-column";
      deleteColumnBtn.innerHTML = "&times;";
      deleteColumnBtn.addEventListener("click", () => deleteColumn(column.id));

      columnHeader.appendChild(columnTitle);
      columnHeader.appendChild(columnTotalTime);
      columnHeader.appendChild(deleteColumnBtn);

      // Create tasks container
      const tasksContainer = document.createElement("div");
      tasksContainer.className = "tasks";
      tasksContainer.dataset.columnId = column.id;

      // Add drag and drop event listeners
      tasksContainer.addEventListener("dragover", handleDragOver);
      tasksContainer.addEventListener("dragleave", handleDragLeave);
      tasksContainer.addEventListener("drop", handleDrop);

      columnElement.appendChild(columnHeader);
      columnElement.appendChild(tasksContainer);
      columnsContainer.appendChild(columnElement);

      // Add option to select
      const option = document.createElement("option");
      option.value = column.id;
      option.textContent = column.title;
      taskColumnSelect.appendChild(option);
    });
  }

  // Функцію для підрахунку загального часу в колонці
  function calculateColumnTotalTime(columnId) {
    const columnTasks = tasks.filter(
      (task) => task.columnId === columnId && !task.completed
    );

    return columnTasks.reduce(
      (total, task) => total + (parseInt(task.duration) || 0),
      0
    );
  }

  let draggedColumn = null;

  // Обробник початку перетягування колонки
  function handleColumnDragStart(e) {
    // Тепер draggedColumn буде вказувати на батьківський елемент заголовка
    draggedColumn = this.parentElement;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "columnDrag");
    e.dataTransfer.setData("columnId", draggedColumn.dataset.id);
    this.classList.add("dragging-header");
    // Додаємо клас до колонки також
    draggedColumn.classList.add("dragging-column");

    // Щоб запобігти спрацюванню перетягування завдань
    e.stopPropagation();
  }

  // Обробник перетягування над іншою колонкою
  function handleColumnDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    // Перевіряємо, що це справді перетягування колонки
    if (e.dataTransfer.getData("text/html") === "columnDrag") {
      const targetColumn = this.parentElement;
      if (targetColumn !== draggedColumn) {
        e.dataTransfer.dropEffect = "move";
        targetColumn.classList.add("column-dragover");
      }
    }

    return false;
  }

  // Обробник скидання колонки
  function handleColumnDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    // Перевіряємо, що це справді перетягування колонки
    if (e.dataTransfer.getData("text/html") === "columnDrag") {
      const targetColumn = this.parentElement;
      targetColumn.classList.remove("column-dragover");

      if (targetColumn === draggedColumn) return;

      const columnId = e.dataTransfer.getData("columnId");
      const sourceIndex = columns.findIndex((col) => col.id === columnId);
      const targetIndex = columns.findIndex(
        (col) => col.id === targetColumn.dataset.id
      );

      if (sourceIndex !== -1 && targetIndex !== -1) {
        // Перемістити колонку
        const [movedColumn] = columns.splice(sourceIndex, 1);
        columns.splice(targetIndex, 0, movedColumn);

        saveColumns();
        renderColumns();
        renderTasks();
      }
    }
  }

  function handleColumnDragEnd(e) {
    this.classList.remove("dragging-header");
    if (draggedColumn) {
      draggedColumn.classList.remove("dragging-column");
    }
    document.querySelectorAll(".column").forEach((col) => {
      col.classList.remove("column-dragover");
    });
  }

  // Render all tasks
  function renderTasks() {
    // Clear all task containers
    document.querySelectorAll(".tasks").forEach((container) => {
      container.innerHTML = "";
    });

    // Групуємо завдання за колонками
    const tasksByColumn = {};
    columns.forEach((column) => {
      tasksByColumn[column.id] = [];
    });

    tasks.forEach((task) => {
      if (tasksByColumn[task.columnId]) {
        tasksByColumn[task.columnId].push(task);
      }
    });

    // Сортуємо за orderIndex і рендеримо для кожної колонки
    Object.keys(tasksByColumn).forEach((columnId) => {
      // Сортуємо завдання за orderIndex
      tasksByColumn[columnId].sort((a, b) => {
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });

      // Рендеримо кожне завдання
      tasksByColumn[columnId].forEach((task) => {
        renderTask(task);
      });
    });
  }

  // Render a single task
  function renderTask(task) {
    // Знайдемо основний контейнер для колонки
    const columnContainer = document.querySelector(
      `.tasks[data-column-id="${task.columnId}"]`
    );
    if (!columnContainer) return;

    // Створюємо елемент завдання
    const taskElement = createTaskElement(task);

    if (!taskElement) {
      return;
    }
    // Додаємо завдання в основну колонку
    columnContainer.appendChild(taskElement);

    // Оновлюємо загальний час у колонці
    updateColumnTotalTime(task.columnId);

    // Якщо завдання має повторення "щодня" і знаходиться в колонці "Сьогодні", додаємо його також у "Завтра"
    if (task.repeat === "daily" && task.columnId === "today") {
      const tomorrowContainer = document.querySelector(
        `.tasks[data-column-id="tomorrow"]`
      );
      if (tomorrowContainer) {
        // Створюємо копію завдання для відображення в колонці "Завтра"
        const tomorrowTaskElement = createTaskElement(task, true);
        tomorrowContainer.appendChild(tomorrowTaskElement);

        // Оновлюємо загальний час у колонці "Завтра"
        updateColumnTotalTime("tomorrow");
      }
    }
  }

  // Функція для створення DOM-елемента завдання
  function createTaskElement(task, isCopy = false) {
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.dataset.id = task.id;
    taskElement.draggable = !isCopy; // Копії не можна перетягувати

    // Set border color based on the first category if any
    if (task.categories && task.categories.length > 0) {
      const mainCategory = task.categories[0];
      taskElement.style.borderLeftColor = getCategoryColor(mainCategory);
    }

    // Mark as completed if needed
    if (task.completed) {
      taskElement.classList.add("task-completed");
      return null;
    }

    // Додаємо маркер копії, якщо це копія
    if (isCopy) {
      taskElement.classList.add("task-copy");
    } else {
      // Add drag events only for real tasks
      taskElement.addEventListener("dragstart", handleDragStart);
      taskElement.addEventListener("dragend", handleDragEnd);

      taskElement.draggable = true;
    }

    // Task header with title and controls
    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    const taskTitle = document.createElement("div");
    taskTitle.className = "task-title";
    taskTitle.textContent = task.title;

    const taskControls = document.createElement("div");
    taskControls.className = "task-controls";

    if (!task.completed && !isCopy) {
      const completeBtn = document.createElement("button");
      completeBtn.className = "task-complete";
      completeBtn.innerHTML = "✓";
      completeBtn.title = "Позначити як виконане";
      completeBtn.addEventListener("click", () => showCompleteModal(task.id));
      taskControls.appendChild(completeBtn);
    }

    if (!isCopy) {
      const editBtn = document.createElement("button");
      editBtn.className = "task-edit";
      editBtn.innerHTML = "✎";
      editBtn.title = "Редагувати";
      editBtn.addEventListener("click", () => showEditModal(task.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "task-delete";
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.title = "Видалити";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      taskControls.appendChild(editBtn);
      taskControls.appendChild(deleteBtn);
    }

    taskHeader.appendChild(taskTitle);
    taskHeader.appendChild(taskControls);

    // Task info
    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    // Expected duration
    let infoText = `Тривалість: ${task.duration} хв`;

    // Show actual duration if completed
    if (task.completed && task.actualDuration) {
      infoText += ` (Факт: ${task.actualDuration} хв)`;
    }

    // Show scheduled date if exists
    if (task.scheduledDate) {
      const scheduledDate = new Date(task.scheduledDate);
      infoText += ` · Призначено: ${formatDate(scheduledDate)}`;
    }

    // Show deadline if exists
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      infoText += ` · Дедлайн: ${formatDate(deadline)}`;
    }

    // Show repetition info
    if (task.repeat !== "none") {
      let repeatText = "";

      switch (task.repeat) {
        case "daily":
          repeatText = "Щодня";
          break;
        case "weekly":
          if (task.weekdays && task.weekdays.length) {
            const days = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            repeatText =
              "Щотижня: " + task.weekdays.map((d) => days[d]).join(", ");
          } else {
            repeatText = "Щотижня";
          }
          break;
        case "monthly":
          if (task.monthdays && task.monthdays.length) {
            repeatText = "Щомісяця: " + task.monthdays.join(", ");
          } else {
            repeatText = "Щомісяця";
          }
          break;
      }

      infoText += ` · ${repeatText}`;
    }

    // Show completion date if completed
    if (task.completed && task.completionDate) {
      const completionDate = new Date(task.completionDate);
      infoText += ` · Завершено: ${formatDate(completionDate)}`;
    }

    taskInfo.textContent = infoText;

    // Categories
    const taskCategories = document.createElement("div");
    taskCategories.className = "task-categories";

    if (task.categories && task.categories.length > 0) {
      task.categories.forEach((category) => {
        const categoryTag = document.createElement("span");
        categoryTag.className = "category-tag";
        categoryTag.textContent = category;
        categoryTag.style.backgroundColor = getCategoryColor(category);
        categoryTag.style.color = "#fff";
        taskCategories.appendChild(categoryTag);
      });
    }

    taskElement.appendChild(taskHeader);
    taskElement.appendChild(taskInfo);
    taskElement.appendChild(taskCategories);

    return taskElement;
  }

  // Format date to readable string
  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month} ${hours}:${minutes}`;
  }

  // Add a new column
  function addColumn(title) {
    const newColumn = {
      id: "column-" + generateId(),
      title: title,
    };

    columns.push(newColumn);
    saveColumns();
    renderColumns();
    renderTasks();
  }

  // Delete a column
  function deleteColumn(columnId) {
    // Check if there are tasks in this column
    const columnTasks = tasks.filter((task) => task.columnId === columnId);

    if (columnTasks.length > 0) {
      if (
        !confirm(
          `Ця категорія містить ${columnTasks.length} завдань. Видалити її разом із завданнями?`
        )
      ) {
        return;
      }

      // Delete tasks in this column
      tasks = tasks.filter((task) => task.columnId !== columnId);
      saveTasks();
    }

    // Delete the column
    columns = columns.filter((column) => column.id !== columnId);
    saveColumns();
    renderColumns();
    renderTasks();
  }

  // Add a new task
  function addTask(task) {
    // Додаємо дату призначення автоматично якщо її немає
    if (!task.scheduledDate) {
      task.scheduledDate = new Date().toISOString();
    }

    if (task.columnId === "today") {
      task.date = new Date().toISOString();
    } else if (task.columnId === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      task.date = tomorrow.toISOString();
    }

    const tasksInColumn = tasks.filter((t) => t.columnId === task.columnId);
    const maxOrderIndex =
      tasksInColumn.length > 0
        ? Math.max(...tasksInColumn.map((t) => t.orderIndex || 0))
        : -1;

    const newTask = {
      id: "task-" + generateId(),
      ...task,
      createdAt: new Date().toISOString(),
      completed: false,
      orderIndex: maxOrderIndex + 1,
    };

    tasks.push(newTask);
    saveTasks();
    renderTask(newTask);
  }

  function checkAndMoveScheduledTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let needsUpdate = false;

    tasks.forEach((task) => {
      if (task.completed) return;

      if (task.columnId === "tomorrow") {
        const scheduledDate = task.date ? new Date(task.date) : null;

        if (scheduledDate) {
          scheduledDate.setHours(0, 0, 0, 0);

          // Якщо запланована дата вже настала або минула
          if (scheduledDate <= today) {
            task.columnId = "today";
            needsUpdate = true;
          }
        }
      }
    });

    if (needsUpdate) {
      saveTasks();
      renderTasks();
    }
  }

  // Update an existing task
  function updateTask(taskId, updatedData) {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
      // Якщо дедлайн не визначено, видаляємо його з завдання
      if (updatedData.deadline === null || updatedData.deadline === undefined) {
        const updatedTask = { ...tasks[taskIndex], ...updatedData };
        delete updatedTask.deadline;
        tasks[taskIndex] = updatedTask;
      } else {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
      }

      if (tasks[taskIndex].columnId === "today") {
        tasks[taskIndex].date = new Date().toISOString();
      } else if (tasks[taskIndex].columnId === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tasks[taskIndex].date = tomorrow.toISOString();
      }

      saveTasks();
      renderTasks(); // Re-render all tasks for simplicity
    }
  }

  // Delete a task
  function deleteTask(taskId) {
    if (confirm("Ви впевнені, що хочете видалити це завдання?")) {
      const task = tasks.find((t) => t.id === taskId);
      const columnId = task ? task.columnId : null;

      tasks = tasks.filter((task) => task.id !== taskId);
      saveTasks();
      renderTasks();

      // Оновлюємо загальний час у колонці
      if (columnId) {
        updateColumnTotalTime(columnId);
      }
    }
  }

  // Complete a task
  function completeTask(taskId, actualDuration, completionDate) {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
      const task = tasks[taskIndex];
      const columnId = task.columnId;

      // If task is repeating
      if (task.repeat !== "none") {
        // Mark this instance as completed and create the next one
        const completedTask = { ...task };
        completedTask.id = "task-" + generateId();
        completedTask.completed = true;
        completedTask.actualDuration = actualDuration;
        completedTask.completionDate = completionDate;
        completedTask.repeat = "none"; // Remove repetition for completed task

        // Calculate the next occurrence
        let nextDate = new Date();
        if (task.deadline) {
          nextDate = new Date(task.deadline);
        }

        switch (task.repeat) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            // Find the next day of the week
            if (task.weekdays && task.weekdays.length) {
              const today = nextDate.getDay();
              const weekdays = task.weekdays.map(Number).sort((a, b) => a - b);

              // Find the next weekday
              let nextWeekday = weekdays.find((day) => day > today);
              if (!nextWeekday) {
                // If no next day in this week, go to first day next week
                nextWeekday = weekdays[0];
                nextDate.setDate(
                  nextDate.getDate() + (7 - today + nextWeekday)
                );
              } else {
                nextDate.setDate(nextDate.getDate() + (nextWeekday - today));
              }
            } else {
              // Simple weekly repetition
              nextDate.setDate(nextDate.getDate() + 7);
            }
            break;
          case "monthly":
            // Find the next day of month
            if (task.monthdays && task.monthdays.length) {
              const currentDay = nextDate.getDate();
              const monthdays = task.monthdays
                .map(Number)
                .sort((a, b) => a - b);

              // Find the next day in current month
              let nextMonthday = monthdays.find((day) => day > currentDay);

              if (!nextMonthday) {
                // Move to the first specified day of next month
                nextDate.setMonth(nextDate.getMonth() + 1);
                nextDate.setDate(monthdays[0]);
              } else {
                nextDate.setDate(nextMonthday);
              }
            } else {
              // Simple monthly repetition
              nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
        }

        // Create the new task
        const newTask = { ...task };
        newTask.id = "task-" + generateId();
        if (task.deadline) {
          newTask.deadline = nextDate.toISOString();
        }

        // Add the new task and the completed task
        tasks[taskIndex] = newTask;
        tasks.push(completedTask);
      } else {
        // Simply mark as completed
        tasks[taskIndex].completed = true;
        tasks[taskIndex].actualDuration = actualDuration;
        tasks[taskIndex].completionDate = completionDate;
      }

      saveTasks();
      renderTasks();

      // Оновлюємо загальний час у відповідній колонці
      updateColumnTotalTime(columnId);
    }
  }

  // Drag and drop functionality
  let draggedTask = null;

  function handleDragStart(e) {
    const isSafari = navigator.userAgent.includes("Safari");
    const isChrome = navigator.userAgent.includes("Chrome");
    const isFirefox = navigator.userAgent.includes("Firefox");
    const isEdge = navigator.userAgent.includes("Edge");

    draggedTask = this;

    if (isSafari) {
      // Safari requires no special handling
    } else if (isChrome) {
      e.dataTransfer.types = ["text/html"];
    } else if (isFirefox || isEdge) {
      e.dataTransfer.types = ["text/html"];
      e.dataTransfer.dropEffect = "move";
    }

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "taskDrag");
    e.dataTransfer.setData("taskId", this.dataset.id);
    this.classList.add("dragging");

    // Запобігаємо перетягуванню колонки
    e.stopPropagation();
  }

  function handleDragEnd() {
    this.classList.remove("dragging");
    renderTasks();
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    const isSafari = navigator.userAgent.includes("Safari");
    const isChrome = navigator.userAgent.includes("Chrome");
    const isFirefox = navigator.userAgent.includes("Firefox");
    const isEdge = navigator.userAgent.includes("Edge");

    if (isSafari) {
      // Safari requires no special handling
    } else if (isChrome || isFirefox || isEdge) {
      e.dataTransfer.dropEffect = "move";
    }

    // Перевіряємо, що це перетягування завдання
    const isTaskDrag =
      e.dataTransfer &&
      e.dataTransfer.types &&
      e.dataTransfer.types.includes("text/html") &&
      e.dataTransfer.getData("text/html") === "taskDrag";

    if (isTaskDrag) {
      e.dataTransfer.dropEffect = "move";
      // Відмічаємо зону перетягування
      this.classList.add("dragover");

      // Додаємо індикатор позиції всередині стовпця
      const taskElements = Array.from(this.children).filter(
        (el) =>
          el.classList.contains("task") &&
          el.dataset.id !== draggedTask.dataset.id
      );

      let targetIndex = -1;
      for (let i = 0; i < taskElements.length; i++) {
        const rect = taskElements[i].getBoundingClientRect();
        const taskMiddle = rect.top + rect.height / 2;

        if (e.clientY < taskMiddle) {
          targetIndex = i;
          break;
        }
      }

      // Оновлюємо порядок завдань
      if (targetIndex !== -1) {
        const draggedTaskIndex = tasks.findIndex(
          (task) => task.id === draggedTask.dataset.id
        );
        const targetTaskIndex = tasks.findIndex(
          (task) => task.id === taskElements[targetIndex].dataset.id
        );

        if (draggedTaskIndex !== targetTaskIndex) {
          tasks.splice(
            targetTaskIndex,
            0,
            tasks.splice(draggedTaskIndex, 1)[0]
          );
          tasks.forEach((task, index) => {
            task.orderIndex = index * 10;
          });
          saveTasks();
        }
      }
    }

    return false;
  }

  function handleDragLeave(e) {
    this.classList.remove("dragover");

    // Видаляємо індикатор при виході з зони
    const dropIndicator = this.querySelector(".drop-indicator");
    if (dropIndicator) {
      dropIndicator.remove();
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const taskElements = Array.from(this.children).filter(
      (el) =>
        el.classList.contains("task") &&
        el.dataset.id !== draggedTask.dataset.id
    );

    let targetIndex = -1;
    for (let i = 0; i < taskElements.length; i++) {
      const rect = taskElements[i].getBoundingClientRect();
      const taskMiddle = rect.top + rect.height / 2;

      if (e.clientY < taskMiddle) {
        targetIndex = i;
        break;
      }
    }

    // Оновлюємо порядок завдань
    if (targetIndex !== -1) {
      const draggedTaskIndex = tasks.findIndex(
        (task) => task.id === draggedTask.dataset.id
      );
      const targetTaskIndex = tasks.findIndex(
        (task) => task.id === taskElements[targetIndex].dataset.id
      );

      if (draggedTaskIndex !== targetTaskIndex) {
        // Move the dragged task to the target position
        tasks.splice(targetTaskIndex, 0, tasks.splice(draggedTaskIndex, 1)[0]);

        // Update the orderIndex property of each task
        tasks.forEach((task, index) => {
          task.orderIndex = index * 10;
        });

        normalizeOrderIndices();

        // Save the updated tasks array
        saveTasks();
      }
    }

    // Add this line to fix the issue in Safari
    return false;
  }

  // Функція для нормалізації порядкових індексів
  function normalizeOrderIndices() {
    // Нормалізуємо індекси для кожної колонки
    columns.forEach((column) => {
      const columnTasks = tasks
        .filter((t) => t.columnId === column.id && !t.completed)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Перевизначаємо індекси від 0 з кроком 10
      columnTasks.forEach((task, index) => {
        task.orderIndex = index * 10;
      });
    });

    saveTasks();
  }

  // Функція для оновлення загального часу в заголовку колонки
  function updateColumnTotalTime(columnId) {
    const columnHeader = document.querySelector(
      `.column[data-id="${columnId}"] .column-total-time`
    );
    if (columnHeader) {
      const totalTime = calculateColumnTotalTime(columnId);
      columnHeader.textContent = `${(totalTime - (totalTime % 60)) / 60} год ${
        totalTime % 60
      } хв`;
    }
  }

  // Modal functionality
  function openModal(modal) {
    modal.style.display = "flex";
  }

  function closeModal(modal) {
    modal.style.display = "none";
  }

  function closeAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      closeModal(modal);
    });
  }

  // Show task modal for adding a new task
  function showAddTaskModal() {
    // Reset the form
    document.getElementById("modal-title").textContent = "Додати завдання";
    taskForm.reset();
    document.getElementById("edit-task-id").value = "";

    // Reset categories
    categoriesContainer.innerHTML = "";

    // Set default scheduled date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("task-scheduled-date").value = now
      .toISOString()
      .slice(0, 16);

    // Set default deadline to empty (optional field)
    document.getElementById("task-deadline").value = "";

    // Show the modal
    openModal(taskModal);
  }

  // Show task modal for editing a task
  function showEditModal(taskId) {
    const task = tasks.find((task) => task.id === taskId);
    if (!task) return;

    // Update form title
    document.getElementById("modal-title").textContent = "Редагувати завдання";

    // Fill form with task data
    document.getElementById("edit-task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-duration").value = task.duration;
    document.getElementById("task-column").value = task.columnId;
    document.getElementById("task-repeat").value = task.repeat || "none";

    // Set scheduled date
    if (task.scheduledDate) {
      const scheduledDate = new Date(task.scheduledDate);
      scheduledDate.setMinutes(
        scheduledDate.getMinutes() - scheduledDate.getTimezoneOffset()
      );
      document.getElementById("task-scheduled-date").value = scheduledDate
        .toISOString()
        .slice(0, 16);
    } else {
      // Default to current date
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById("task-scheduled-date").value = now
        .toISOString()
        .slice(0, 16);
    }

    if (task.columnId === "today") {
      task.date = new Date().toISOString();
    } else if (task.columnId === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      task.date = tomorrow.toISOString();
    }

    // Set deadline (optional)
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset());
      document.getElementById("task-deadline").value = deadline
        .toISOString()
        .slice(0, 16);
    } else {
      document.getElementById("task-deadline").value = "";
    }

    // Show appropriate repetition options
    updateRepeatOptions();

    // Set weekdays if applicable
    if (task.weekdays) {
      document.querySelectorAll('input[name="weekday"]').forEach((checkbox) => {
        checkbox.checked = task.weekdays.includes(checkbox.value);
      });
    }

    // Set monthdays if applicable
    if (task.monthdays) {
      document
        .querySelectorAll('input[name="monthday"]')
        .forEach((checkbox) => {
          checkbox.checked = task.monthdays.includes(parseInt(checkbox.value));
        });
    }

    // Update categories
    categoriesContainer.innerHTML = "";
    if (task.categories && task.categories.length > 0) {
      task.categories.forEach((category) => {
        addCategoryPill(category);
      });
    }

    // Show the modal
    openModal(taskModal);
  }

  // Show complete task modal
  function showCompleteModal(taskId) {
    const task = tasks.find((task) => task.id === taskId);
    if (!task) return;

    // Fill form with data
    document.getElementById("complete-task-id").value = task.id;
    document.getElementById("actual-duration").value = task.duration; // Default to expected duration

    // Set default completion date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("completion-date").value = now
      .toISOString()
      .slice(0, 16);

    // Show the modal
    openModal(completeModal);
  }

  // Show column modal
  function showColumnModal() {
    columnForm.reset();
    openModal(columnModal);
  }

  // Add a category pill to the categories container
  function addCategoryPill(category) {
    const categoryPill = document.createElement("div");
    categoryPill.className = "category-pill";
    categoryPill.dataset.category = category;
    categoryPill.style.backgroundColor = getCategoryColor(category);

    const categoryText = document.createElement("span");
    categoryText.textContent = category;

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-category";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      categoryPill.remove();
    });

    categoryPill.appendChild(categoryText);
    categoryPill.appendChild(removeBtn);
    categoriesContainer.appendChild(categoryPill);
  }

  // Update repetition options based on selection
  function updateRepeatOptions() {
    const repeatType = taskRepeatSelect.value;

    // Hide all options first
    weeklyOptions.style.display = "none";
    monthlyOptions.style.display = "none";

    // Show relevant options
    if (repeatType === "weekly") {
      weeklyOptions.style.display = "block";
    } else if (repeatType === "monthly") {
      monthlyOptions.style.display = "block";
    }
  }

  // Get current task categories from the form
  function getFormCategories() {
    const categories = [];
    document.querySelectorAll(".category-pill").forEach((pill) => {
      categories.push(pill.dataset.category);
    });
    return categories;
  }

  // Event listeners

  // Add task button
  addTaskBtn.addEventListener("click", showAddTaskModal);

  // Add column button
  addColumnBtn.addEventListener("click", showColumnModal);

  // Close modal buttons
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAllModals();
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Task form submission
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("task-title").value;
    const duration = parseInt(document.getElementById("task-duration").value);
    const columnId = document.getElementById("task-column").value;
    const repeatType = document.getElementById("task-repeat").value;
    const scheduledDateInput = document.getElementById(
      "task-scheduled-date"
    ).value;
    const scheduledDate = scheduledDateInput
      ? new Date(scheduledDateInput).toISOString()
      : null;
    const deadlineInput = document.getElementById("task-deadline").value;
    const deadline = deadlineInput
      ? new Date(deadlineInput).toISOString()
      : null;
    const categories = getFormCategories();

    // Repetition data
    let weekdays = [];
    let monthdays = [];

    if (repeatType === "weekly") {
      document
        .querySelectorAll('input[name="weekday"]:checked')
        .forEach((checkbox) => {
          weekdays.push(checkbox.value);
        });
    } else if (repeatType === "monthly") {
      document
        .querySelectorAll('input[name="monthday"]:checked')
        .forEach((checkbox) => {
          monthdays.push(parseInt(checkbox.value));
        });
    }

    const taskData = {
      title,
      duration,
      columnId,
      scheduledDate,
      repeat: repeatType,
      deadline,
      categories,
      weekdays: repeatType === "weekly" ? weekdays : undefined,
      monthdays: repeatType === "monthly" ? monthdays : undefined,
    };

    const editTaskId = document.getElementById("edit-task-id").value;

    if (editTaskId) {
      // Update existing task
      updateTask(editTaskId, taskData);
    } else {
      // Add new task
      addTask(taskData);
    }

    closeAllModals();
  });

  // Column form submission
  columnForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("column-title").value;
    addColumn(title);

    closeAllModals();
  });

  // Complete task form submission
  completeForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const taskId = document.getElementById("complete-task-id").value;
    const actualDuration = parseInt(
      document.getElementById("actual-duration").value
    );
    const completionDate = document.getElementById("completion-date").value;

    completeTask(taskId, actualDuration, completionDate);

    closeAllModals();
  });

  // Add category button
  //   addCategoryBtn.addEventListener("click", () => {
  //     const category = newCategoryInput.value.trim();
  //     console.log(category);

  //     if (category) {
  //       addCategoryPill(category);
  //       newCategoryInput.value = "";

  //       // Ensure the color is saved
  //       getCategoryColor(category);
  //       saveCategoryColors();
  //     }
  //   });

  addCategoryBtn.addEventListener("click", () => {
    const category = newCategoryInput.value.trim();
    if (category) {
      addCategoryPill(category);
      newCategoryInput.value = "";
    }
  });

  // Add category on enter key
  newCategoryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategoryBtn.click();
    }
  });

  // Update repeat options when repeat type changes
  taskRepeatSelect.addEventListener("change", updateRepeatOptions);

  // Initialize the app
  initializeData();

  // Запускаємо перевірку переміщення завдань при завантаженні сторінки
  checkAndMoveScheduledTasks();

  // Встановлюємо інтервал для перевірки раз на 10 хвилин
  setInterval(checkAndMoveScheduledTasks, 600000);
});

document.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("downloadLocalStorage");
  const uploadInput = document.getElementById("uploadLocalStorage");
  const selectFileButton = document.getElementById("selectFileButton");
  const localStorageKeys = ["tasks", "columns", "categoryColors"]; // Замініть на ключ, який ви використовуєте

  // Функція для завантаження даних з LocalStorage
  downloadButton.addEventListener("click", () => {
    const dataToSave = {};
    for (const key of localStorageKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        dataToSave[key] = JSON.parse(data);
      }
    }

    if (dataToSave) {
      const blob = new Blob([JSON.stringify(dataToSave)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks ${new Date().toISOString()}_export.json`; // Ім'я файлу для завантаження
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("У LocalStorage немає даних для завантаження");
    }
  });

  // Прихований input type="file" викликається при кліку на кастомну кнопку
  selectFileButton.addEventListener("click", () => {
    uploadInput.click();
  });

  // Обробник події зміни файлу для завантаження
  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const fileContent = e.target.result;
          // Спробуйте розпарсити JSON, щоб переконатися, що файл коректний
          JSON.parse(fileContent);
          // Якщо парсинг успішний, зберігаємо у LocalStorage

          for (const key of localStorageKeys) {
            const data = JSON.parse(fileContent)[key];
            if (data) {
              localStorage.setItem(key, JSON.stringify(data));
            }
          }

          alert("Дані успішно завантажено у LocalStorage!");
        } catch (error) {
          alert(
            "Помилка при читанні або парсингу файлу JSON: " + error.message
          );
        }
      };

      reader.onerror = () => {
        alert("Помилка при читанні файлу.");
      };

      reader.readAsText(file);
    }
  });
});
