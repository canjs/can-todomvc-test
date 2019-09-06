import QUnit from "steal-qunit";
import { domEvents, ajax } from "can";
import "./todomvc.css";

QUnit.config.reorder = false;

function waitFor(test) {
	return new Promise(function(resolve) {
		if (test()) {
			resolve();
		} else {
			setTimeout(function repeat() {
				if (test()) {
					resolve();
				} else {
					setTimeout(repeat, 20);
				}
			}, 20);
		}
	});
}

function moduleDefault(module) {
	if (module && typeof module === "object" && module.__esModule === true) {
		return module.default;
	}

	return module;
}

export default function(appVM) {
	var timeToShowTodos,
		fixture = steal.import("can-fixture"),
		todoModelPromise = steal
			.import("todomvc/models/todo")
			.then(function(module) {
				return { Todo: module.default, TodoList: module.TodoList };
			});

	// makes sure we wait for the app to load
	// and sets the fixture delay to 10 on the first test.
	QUnit.module("Todo", {
		beforeEach() {
			var start = new Date();

			return new Promise(function(resolve) {
				waitFor(function() {
					return document.querySelector(".todo");
				}).then(function() {
					if (timeToShowTodos === undefined) {
						timeToShowTodos = new Date() - start;
						fixture.then(
							function(fixture) {
								fixture.delay = 10;
								resolve();
							},
							function() {
								resolve();
							}
						);
					} else {
						resolve();
					}
				});
			});
		}
	});

	QUnit.test("setup works", function(assert) {
		const h1s = Array.from(document.querySelectorAll("h1"));

		const titles = h1s.map(function(h1) {
			return h1.innerHTML;
		});

		assert.ok(titles.includes("TodoMVC"), "There is an H1 titled TodoMVC");
	});

	QUnit.test("Defined Todo", function(assert) {
		const done = assert.async();

		todoModelPromise
			.then(
				function({ Todo }) {
					assert.ok(true, "created module");
					assert.equal(typeof Todo, "function", "exporting function");

					var todo = new Todo({ id: 1, name: 2 });
					assert.equal(todo.id, "1", "id is a string");
					assert.equal(todo.name, "2", "name is a string");
					assert.equal(todo.complete, false, "complete defaults to false");
					todo.toggleComplete();
					assert.equal(todo.complete, true, "toggleComplete works");

					done();
				},
				function() {
					assert.ok(false, "you haven't defined models/todo yet");
					done();
				}
			)
			.catch(function(err) {
				assert.notOk(err, err.message);
				done();
			});
	});

	QUnit.test("Defined TodoList", function(assert) {
		const done = assert.async();

		todoModelPromise
			.then(
				function({ Todo, TodoList }) {
					assert.ok(TodoList, "created module");
					assert.equal(typeof TodoList, "function", "exporting function");

					const todos = new TodoList([
						{ complete: true },
						{},
						{ complete: true }
					]);
					assert.ok(
						todos[0] instanceof Todo,
						"each item in a Todo.List is a Todo"
					);
					assert.equal(todos.active.length, 1);
					assert.equal(todos.complete.length, 2);
					assert.equal(todos.allComplete, false, "not allComplete");
					todos[1].complete = true;
					assert.equal(todos.allComplete, true, "allComplete");

					done();
				},
				function() {
					assert.ok(false, "you haven't defined models/todo yet");
					done();
				}
			)
			.catch(function(err) {
				assert.notOk(err, err.message);
				done();
			});
	});

	QUnit.test("Rendered a list of todos", function(assert) {
		// test that the HTML is no longer static (node-list would be a great way of doing this)
		var editingTodo = document.querySelector(".todo editing");
		assert.ok(!editingTodo, "there's nothing being edited");
		assert.ok(appVM.todosList, "there's a todoList");

		var bound = appVM.todosList[Symbol.for("can.meta")].handlers;
		assert.ok(bound.root.active, "<strong>X</strong> items left");

		var clearCompleted = document.querySelector("#clear-completed");

		assert.equal(
			clearCompleted.childNodes.length,
			3,
			"Clear completed (X) needs live-binding"
		);

		var todoEls = document.querySelectorAll(".todo");
		var todoCheckboxes = document.querySelectorAll(".todo .toggle");
		// check completed className and if input is checked
		appVM.todosList.forEach(function(todo, i) {
			assert.equal(
				todo.complete,
				todoEls[i].classList.contains("completed"),
				"has completed correctly in .className"
			);
			assert.equal(
				todo.complete,
				todoCheckboxes[i].checked,
				"<input type=checkbox> is checked correctly"
			);
		});
	});

	QUnit.test("Toggling a todo's completed state with event binding", function(
		assert
	) {
		var itemsLeft = document.querySelector("#todo-count strong");
		var startItemsLeft = itemsLeft.innerHTML;

		var checkbox = document.querySelector(".todo .toggle");
		if (document.querySelector(".toggle").hasAttribute("checked:bind")) {
			assert.ok(true, "skipping tests because you are using two way bindings");
		} else {
			domEvents.dispatch(checkbox, "click");
			var afterClickItemsLeft = itemsLeft.innerHTML;
			assert.notEqual(
				startItemsLeft,
				afterClickItemsLeft,
				"X items left changes"
			);

			// change it back
			domEvents.dispatch(checkbox, "click");
			afterClickItemsLeft = itemsLeft.innerHTML;
			assert.equal(
				startItemsLeft,
				afterClickItemsLeft,
				"X items left changes back"
			);
		}
	});

	QUnit.test("Toggling a todo's completed state with data bindings", function(
		assert
	) {
		var itemsLeft = document.querySelector("#todo-count strong");
		var startItemsLeft = itemsLeft.innerHTML;

		var checkbox = document.querySelector(".todo .toggle");
		if (document.querySelector(".toggle").hasAttribute("checked:bind")) {
			checkbox.checked = !checkbox.checked;
			domEvents.dispatch(checkbox, "change");
			var afterClickItemsLeft = itemsLeft.innerHTML;
			assert.notEqual(
				startItemsLeft,
				afterClickItemsLeft,
				"X items left changes"
			);

			// change it back
			checkbox.checked = !checkbox.checked;
			domEvents.dispatch(checkbox, "change");
			afterClickItemsLeft = itemsLeft.innerHTML;
			assert.equal(
				startItemsLeft,
				afterClickItemsLeft,
				"X items left changes back"
			);
		} else {
			assert.ok(false, "not trying two-way DOM data bindings yet");
		}
	});

	QUnit.test("Defining Todo identity", function(assert) {
		const done = assert.async();

		todoModelPromise
			.then(
				function({ Todo }) {
					assert.deepEqual(
						Todo[Symbol.for("can.getSchema")]().identity,
						["id"],
						"identity is set"
					);
					done();
				},
				function() {
					assert.ok(false, "you haven't defined models/todo yet");
					done();
				}
			)
			.catch(function(err) {
				assert.ok(false, "Todo's identity has not been defined");
				done();
			});
	});

	QUnit.test("Simulate the `/api/todos` service", function(assert) {
		const done = assert.async();

		steal
			.import("todomvc/models/todos-fixture")
			.then(moduleDefault, function() {
				throw new Error("you haven't defined models/todos-fixture yet");
			})
			.then(function(fixture) {
				fixture.delay = 10;

				return ajax({
					url: "/api/todos",
					type: "GET"
				});
			})
			.then(function(response) {
				assert.ok(response, "GET /api/todos response");
				assert.ok(Array.isArray(response.data), "data is array");
				assert.ok(response.data.length, "data has at least one item");

				var firstTodo = response.data[0];
				assert.ok(
					firstTodo.id && firstTodo.name && firstTodo.complete !== undefined,
					"has id, name, and complete"
				);
			})
			.then(function() {
				return ajax({
					url: "/api/todos",
					type: "POST",
					data: { name: "make a fixture", complete: true }
				});
			})
			.then(function(data) {
				var id = data.id;
				assert.ok(id, "POST has an id value sent back");

				return Promise.all([
					ajax({
						url: "/api/todos/" + id,
						type: "PUT",
						data: { name: "make a fixture", complete: false }
					}),
					id
				]);
			})
			.then(function([data, id]) {
				assert.deepEqual(
					data,
					{
						name: "make a fixture",
						complete: false,
						id: "" + id
					},
					"updated data"
				);

				return ajax({
					url: "/api/todos/" + id,
					type: "DELETE"
				});
			})
			.then(function() {
				assert.ok(true, "delete is successful");
				done();
			})
			.catch(function(err) {
				assert.notOk(err, err.message);
				done();
			});
	});

	QUnit.test("Connecting Todo to the `/api/todos` service", function(assert) {
		const done = assert.async();
		let Todo = null;
		let TodoList = null;

		todoModelPromise
			.then(
				function({ Todo: _Todo, TodoList: _TodoList }) {
					Todo = _Todo;
					TodoList = _TodoList;
					if (Todo.connection) {
						return Todo.getList({});
					} else {
						throw new Error("there's no connection");
					}
				},
				function() {
					throw new Error("you haven't defined models/todos-fixture yet");
				}
			)
			.then(function(todos) {
				assert.ok(todos instanceof TodoList, "response is TodoList");
				assert.ok(todos.length, "data has at least one item");
				var firstTodo = todos[0];
				assert.ok(
					firstTodo.id && firstTodo.name && firstTodo.complete !== undefined,
					"has id, name, and complete"
				);
			})
			.then(function() {
				return new Todo({ name: "make a fixture", complete: true }).save();
			})
			.then(function(todo) {
				assert.ok(todo.id, "save has an id value sent back");
				todo.complete = false;
				return Promise.all([todo.save(), todo.id]);
			})
			.then(function([todo, id]) {
				assert.deepEqual(
					todo.get(),
					{ name: "make a fixture", complete: false, id: id },
					"updated data"
				);

				return todo.destroy();
			})
			.then(function() {
				assert.ok(true, "delete is successful");
				done();
			})
			.catch(function(e) {
				assert.ok(false, "there was an error " + e);
				done();
			});
	});

	QUnit.test("List todos in the page", function(assert) {
		assert.ok(timeToShowTodos > 20, "loaded todos async " + timeToShowTodos);
	});

	QUnit.test("Toggling a todo's checkbox updates service layer", function(
		assert
	) {
		var done = assert.async();

		if (!document.querySelector(".toggle").hasAttribute("checked:bind")) {
			assert.ok(false, "not trying two-way DOM data bindings yet");
			done();
			return;
		}

		if (!document.querySelector(".toggle").hasAttribute("on:change")) {
			assert.ok(false, "missing on:change binding");
			done();
			return;
		}

		var changeCount = 0;
		fixture.then(function(fixture) {
			var checkbox = document.querySelector(".todo .toggle");
			var fixtureCompleteValue;

			var toggleCheckbox = function() {
				fixtureCompleteValue = checkbox.checked = !checkbox.checked;
				domEvents.dispatch(checkbox, "change");
				assert.ok(checkbox.disabled, "checkbox is disabled while saving");
			};
			// trap this request
			var fixtures = fixture.fixtures.splice(0);
			fixture({ url: "/api/todos/{id}", type: "put" }, function(request) {
				changeCount++;

				assert.ok(true, "made request");
				assert.equal(
					request.data.complete,
					fixtureCompleteValue,
					"Service layer sent new `.complete` state"
				);

				if (changeCount === 2) {
					// reset everything
					setTimeout(function() {
						fixture.fixtures.splice(0);
						fixture.fixtures.push.apply(fixture.fixtures, fixtures);
						checkbox = document.querySelector(".todo .toggle"); // TODO: remove after can-connect#436
						assert.notOk(checkbox.disabled, "checkbox is not disabled");
						done();
					}, 20);
				} else {
					toggleCheckbox();
				}

				return {
					id: request.data.id,
					name: request.data.name,
					complete: request.data.complete
				};
			});

			toggleCheckbox();
		});
	});

	QUnit.test("Delete todos", function(assert) {
		var done = assert.async();
		var todos = document.querySelectorAll(".todo");
		var todosCount = todos.length;
		var last = todos[0];

		if (!last.querySelector(".destroy").hasAttribute("on:click")) {
			assert.ok(false, "cannot delete to-do: missing on:click binding");
			done();
			return;
		}

		domEvents.dispatch(last.querySelector(".destroy"), "click");
		assert.ok(
			last.classList.contains("destroying"),
			"when instance is being destroyed, it should have `destroying` in .className"
		);

		waitFor(function() {
			return document.querySelectorAll(".todo").length === todosCount - 1;
		}).then(function() {
			assert.ok(true, "deleted a todo");
			done();
		});
	});

	QUnit.test("Create todos", function(assert) {
		var done = assert.async();

		steal
			.import("todomvc/components/todo-create/todo-create")
			.then(moduleDefault)
			.then(
				function(Todo) {
					var todos = document.querySelectorAll(".todo");
					var todosCount = todos.length;

					var newTodo = document.getElementById("new-todo");

					newTodo.value = "mow lawn";
					domEvents.dispatch(newTodo, "change");

					var event = new KeyboardEvent("keyup", { key: "Enter" });
					newTodo.dispatchEvent(event);

					waitFor(function() {
						return document.querySelectorAll(".todo").length === todosCount + 1;
					}).then(function() {
						assert.ok(true, "created a todo");
						assert.equal(
							newTodo.value,
							"",
							"The input is cleared after a todo is created"
						);
						done();
					});
				},
				function() {
					assert.ok(false, "you haven't defined components/todo-create/ yet");
					done();
				}
			);
	});

	QUnit.test("Edit todo names", function(assert) {
		var done = assert.async();

		steal
			.import("todomvc/components/todo-list/todo-list")
			.then(moduleDefault, function() {
				throw new Error("you haven't defined components/todo-list/ yet");
			})
			.then(function() {
				return fixture;
			})
			.then(function(fixture) {
				var todo = document.querySelector(".todo");
				var todoLabel = todo.querySelector("label");
				var todoInput = todo.querySelector(".edit");

				if (!todoLabel.hasAttribute("on:dblclick")) {
					throw new Error("cannot edit to-do: missing on:dblclick binding");
				}

				// trap this request
				var fixtures = fixture.fixtures.splice(0);
				fixture({ url: "/api/todos/{id}", type: "put" }, function(request) {
					assert.ok(true, "made request");
					assert.equal(request.data.name, "MOW GRASS", "got new name");
					setTimeout(function() {
						fixture.fixtures.splice(0);
						fixture.fixtures.push.apply(fixture.fixtures, fixtures);
						assert.ok(
							!todo.classList.contains("editing"),
							"enter removes editing mode"
						);
						done();
					}, 20);
					return {
						id: request.data.id,
						name: request.data.name,
						complete: request.data.complete
					};
				});

				// try editing
				domEvents.dispatch(todoLabel, "dblclick");
				assert.ok(todo.classList.contains("editing"), "in edit mode");
				assert.ok(document.activeElement, todoInput, "element has focus");

				todoInput.blur();
				domEvents.dispatch(todoInput, "blur");
				setTimeout(function() {
					assert.ok(
						!todo.classList.contains("editing"),
						".blur() removes editing mode"
					);

					// actually edit
					domEvents.dispatch(todoLabel, "dblclick");
					todoInput.value = "MOW GRASS";
					domEvents.dispatch(todoInput, "change");
					todoInput.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
				}, 20);
			})
			.catch(function(err) {
				assert.notOk(err, err.message);
				done();
			});
	});

	QUnit.test("Toggle all todos complete state", function(assert) {
		var done = assert.async();
		var todos = Array.from(document.querySelectorAll(".todo"));

		var initialState = todos.map(function(todo) {
			return todo.querySelector(".toggle").checked;
		});
		// change everything to checked
		todos.forEach(function(todo) {
			var input = todo.querySelector(".toggle");
			input.checked = true;
			domEvents.dispatch(input, "change");
		});

		var toggleAll = document.querySelector("#toggle-all");
		assert.ok(
			toggleAll.checked,
			"#toggle-all is checked when everything else is checked"
		);

		var input = todos[0].querySelector(".toggle");
		input.checked = false;
		domEvents.dispatch(input, "change");

		assert.ok(
			!toggleAll.checked,
			"#toggle-all is checked when a single todo is unchecked"
		);

		toggleAll.checked = true;
		domEvents.dispatch(toggleAll, "change");
		assert.ok(toggleAll.disabled, "disabled on change");
		waitFor(function() {
			return !toggleAll.disabled;
		}).then(function() {
			todos = Array.from(document.querySelectorAll(".todo")); // TODO: remove when can-connect is fixed
			todos.forEach(function(todo, i) {
				var input = todo.querySelector(".toggle");
				input.checked = initialState[i];
				domEvents.dispatch(input, "change");
			});
			done();
		});
	});

	QUnit.test("Clear all completed todos", function(assert) {
		var done = assert.async();
		var todos = Array.from(document.querySelectorAll(".todo .toggle"));

		var uncompletedCount = todos.reduce(function(acc, todo) {
			return acc + (todo.checked ? 0 : 1);
		}, 0);

		var clearCompleted = document.getElementById("clear-completed");
		//clearCompleted.click();
		domEvents.dispatch(clearCompleted, "click");

		setTimeout(function() {
			assert.equal(
				document.querySelectorAll(".todo").length,
				uncompletedCount,
				"only uncompleted todos left"
			);
			done();
		}, 20);
	});

	QUnit.test("Setup routing", function(assert) {
		var done = assert.async();

		// make sure the links are right
		var links = Array.from(document.querySelectorAll("#filters a"));
		var hrefMap = { All: "#!", Active: "#!active", Completed: "#!complete" };

		links.forEach(function(link) {
			assert.equal(
				link.getAttribute("href"),
				hrefMap[link.innerHTML.trim()],
				link.innerHTML.trim() + " href is right."
			);
		});

		window.location.href = "#!active";

		setTimeout(function() {
			Array.from(document.querySelectorAll(".todo .toggle")).forEach(function(
				input
			) {
				assert.ok(
					!input.checked,
					"#!active page should have only unchecked boxes"
				);
			});

			window.location.href = "#!complete";
			setTimeout(function() {
				Array.from(document.querySelectorAll(".todo .toggle")).forEach(function(
					input
				) {
					assert.ok(
						input.checked,
						"#!complete page should have only unchecked boxes"
					);
				});

				window.location.href = "#!";
				setTimeout(done, 20);
			}, 20);
		}, 20);
	});
}
