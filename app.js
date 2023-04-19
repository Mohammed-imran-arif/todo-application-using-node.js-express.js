const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

var format = require("date-fns/format");

var isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");

app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const inizialitationOfServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
inizialitationOfServerAndDb();

//defining
const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasSearchQueryProperties = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let data = null;
  let getTodoQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        console.log("hi");
        if (
          status === "IN PROGRESS" ||
          status === "TO DO" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where priority='${priority}' and status='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        if (
          status === "IN PROGRESS" ||
          status === "TO DO" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where category='${category}' and status='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `select * from todo where category='${category}' and priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => outputResult(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `select * from todo where priority='${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearchQueryProperties(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => outputResult(each)));

      break;

    case hasStatusProperties(request.query):
      if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
        getTodoQuery = `select * from todo where status='${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperties(request.query):
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        getTodoQuery = `select * from todo where category='${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => outputResult(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getTodoQuery = `select * from todo where id=${todoId};`;
  getTodoQueryResponse = await db.get(getTodoQuery);
  response.send(outputResult(getTodoQueryResponse));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = isMatch(date, "yyyy-MM-dd");

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getTodoDateQuery = `select * from todo where due_date='${newDate}'`;

    const getTodoDateQueryresponse = await db.all(getTodoDateQuery);

    response.send(getTodoDateQueryresponse.map((each) => outputResult(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const dueDate1 = format(new Date(dueDate), "yyyy-MM-dd");
          console.log(dueDate);
          console.log(dueDate1);
          const postNewdataQuery = `insert into todo(id,todo,priority,status,category,due_date)
                  values(${id},'${todo}','${priority}','${status}','${category}','${dueDate1}');`;
          postNewdataQueryResponse = await db.run(postNewdataQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;
  const requestBody = request.body;
  let updateTodoQuery;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
        updateTodoQuery = `update todo set status='${status}' where id=${todoId}`;
        updateTodoQueryResponse = await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `update todo set priority='${priority}'where id=${todoId};`;
        updateTodoQueryResponse = await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `update todo set todo='${todo}'where id=${todoId};`;
      updateTodoQueryResponse = await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        updateTodoQuery = `update todo set category='${category}' where id=${todoId};`;
        updateTodoQueryResponse = await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        updateTodoQuery = `update todo set due_date='${dueDate}'where id=${todoId};`;
        updateTodoQueryResponse = await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id='${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
