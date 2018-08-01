import QUnit from "steal-qunit";
import "./todomvc.css";
import {domEvents, ajax} from "can";

QUnit.config.reorder = false;


function waitFor(test){
    return new Promise(function(resolve){
        if( test() ) {
            resolve();
        } else {
            setTimeout(function repeat(){
                if( test() ) {
                    resolve();
                } else {
                    setTimeout(repeat,20);
                }
            },20);
        }
    });
}

export default function(appVM){

    var timeToShowTodos,
        fixture = steal.import("can-fixture"),
        todoModelPromise = steal.import("todomvc/models/todo").then(moduleDefault);

    // makes sure we wait for the app to load
    // and sets the fixture delay to 10 on the first test.
    QUnit.module("TodoMVC",{
        setup: function(){
            QUnit.stop();
            var start = new Date();
            waitFor(function(){
                return document.querySelector(".todo");
            }).then(function(){
                if(timeToShowTodos === undefined) {
                    timeToShowTodos = (new Date() - start);
                    fixture.then(function(fixture){
                        fixture.delay = 10;
                        QUnit.start();
                    }, function(){
                        QUnit.start();
                    });
                } else {
                    QUnit.start();
                }

            });

        }
    });

    QUnit.test("setup works", function(){
        var h1s = document.querySelectorAll("h1");

        for(var i = 0 ; i < h1s.length; i++) {
            if(h1s[i].innerHTML === "TodoMVC") {
                QUnit.ok(true, "There is an H1 titled TodoMVC");
                return;
            }
        }
        QUnit.ok(false,"There is an H1 titled TodoMVC");
    });

    QUnit.asyncTest("Defined Todo", function(){
        todoModelPromise.then(function(Todo){
            QUnit.ok(true, "created module");
            QUnit.equal(typeof Todo , "function", "exporting function");

            var todo = new Todo({id: 1, name: 2});
            QUnit.equal(todo.id, "1", "id is a string");
            QUnit.equal(todo.name, "2", "name is a string");
            QUnit.equal(todo.complete, false, "complete defaults to false");
            todo.toggleComplete();
            QUnit.equal(todo.complete, true, "toggleComplete works");

            QUnit.start();
        }, function(){
            QUnit.ok(false, "you haven't defined models/todo yet");
            QUnit.start();
        });
    });


    QUnit.asyncTest("Defined Todo.List", function(){
        todoModelPromise.then(function(Todo){
            QUnit.ok(Todo, "created module");
            QUnit.equal(typeof Todo , "function", "exporting function");

            QUnit.ok(Todo.List, "Defined a List");
            var todos = new Todo.List([{complete: true},{},{complete: true}]);
            QUnit.ok(todos[0] instanceof Todo, "each item in a Todo.List is a Todo");
            QUnit.equal(todos.active.length, 1);
            QUnit.equal(todos.complete.length, 2);
            QUnit.equal(todos.allComplete, false, "not allComplete");
            todos[1].complete = true;
            QUnit.equal(todos.allComplete, true, "allComplete");

            QUnit.start();
        }, function(){
            QUnit.ok(false, "you haven't defined models/todo yet");
            QUnit.start();
        });
    });

    QUnit.test("Rendered a list of todos", function(){
        // test that the HTML is no longer static (node-list would be a great way of doing this)
        var editingTodo = document.querySelector(".todo editing");
        QUnit.ok(!editingTodo, "there's nothing being edited");
        QUnit.ok( appVM.todosList, "there's a todoList");

        var bound = appVM.todosList[Symbol.for("can.meta")].handlers;
        QUnit.ok(bound.root.active, "<strong>X</strong> items left");

        var clearCompleted = document.querySelector("#clear-completed");

        QUnit.equal(clearCompleted.childNodes.length, 3, "Clear completed (X) needs live-binding");

        var todoEls = document.querySelectorAll(".todo");
        var todoCheckboxes = document.querySelectorAll(".todo .toggle");
        // check completed className and if input is checked
        appVM.todosList.forEach(function(todo, i){
            QUnit.equal( todo.complete, todoEls[i].classList.contains("completed"), "has completed correctly in .className"  );
            QUnit.equal( todo.complete, todoCheckboxes[i].checked, "<input type=checkbox/> is checked correctly"  );
        });
    });

    QUnit.test("Toggling a todo's completed state with event binding", function(){
        var itemsLeft = document.querySelector("#todo-count strong");
        var startItemsLeft = itemsLeft.innerHTML;

        var checkbox = document.querySelector(".todo .toggle");
        if(document.querySelector(".toggle").hasAttribute("checked:bind")) {
            QUnit.ok(true, "skipping tests because you are using two way bindings");
        } else {
            domEvents.dispatch(checkbox,"click");
            var afterClickItemsLeft = itemsLeft.innerHTML;
            QUnit.ok(startItemsLeft !== afterClickItemsLeft, "X items left changes");

            // change it back
            domEvents.dispatch(checkbox,"click");
            afterClickItemsLeft = itemsLeft.innerHTML;
            QUnit.ok(startItemsLeft === afterClickItemsLeft, "X items left changes back");
        }
    });

    QUnit.test("Toggling a todo's completed state with data bindings", function(){
        var itemsLeft = document.querySelector("#todo-count strong");
        var startItemsLeft = itemsLeft.innerHTML;

        var checkbox = document.querySelector(".todo .toggle");
        if(document.querySelector(".toggle").hasAttribute("checked:bind")) {
            checkbox.checked = !checkbox.checked;
            domEvents.dispatch(checkbox,"change");
            var afterClickItemsLeft = itemsLeft.innerHTML;
            QUnit.ok(startItemsLeft !== afterClickItemsLeft, "X items left changes");

            // change it back
            checkbox.checked = !checkbox.checked;
            domEvents.dispatch(checkbox,"change");
            afterClickItemsLeft = itemsLeft.innerHTML;
            QUnit.ok(startItemsLeft === afterClickItemsLeft, "X items left changes back");
        } else {
            QUnit.ok(false, "not trying two-way DOM data bindings yet");
        }
    });

    QUnit.asyncTest("Defining Todo identity",function(){
        todoModelPromise.then(function(Todo){
			QUnit.deepEqual(Todo[Symbol.for("can.getSchema")]().identity, ["id"], "identity is set"  );
            QUnit.start();
        }, function(){
            QUnit.ok(false, "you haven't defined models/todo yet");
            QUnit.start();
        });

    });

    QUnit.asyncTest("Simulate the `/api/todos` service",function(){

        steal.import("todomvc/models/todos-fixture").then(moduleDefault).then(function(){
            return fixture.then(function(fixture){
                fixture.delay = 10;

                return ajax({
                    url: "/api/todos",
                    type: "GET"
                }).then(function(response){
                    QUnit.ok(response, "GET /api/todos response");
                    QUnit.ok(Array.isArray(response.data), "data is array");
                    QUnit.ok(response.data.length, "data has at least one item");
                    var firstTodo = response.data[0];
                    QUnit.ok(firstTodo.id && firstTodo.name && firstTodo.complete !== undefined, "has id, name, and complete");

                }).then(function(){
                    return ajax({
                        url: "/api/todos",
                        type: "POST",
                        data: {name: "make a fixture", complete: true}
                    }).then(function(data){
                        var id = data.id;
                        QUnit.ok(id, "POST has an id value sent back");
                        return ajax({
                            url: "/api/todos/"+id,
                            type: "PUT",
                            data: {name: "make a fixture", complete: false}
                        }).then(function(data){
                            QUnit.deepEqual(data, {name: "make a fixture", complete: false, id: ""+id}, "updated data");

                            return ajax({
                                url: "/api/todos/"+id,
                                type: "DELETE"
                            }).then(function(){
                                QUnit.ok(true, "delete is successful");
                            });

                        });
                    });
                });

            })
            .then(function(){
                QUnit.start();
            },function(e){
                QUnit.ok(false, "there was an error "+e);
                QUnit.start();
            });

        }, function(){
            QUnit.ok(false, "you haven't defined models/todos-fixture yet");
            QUnit.start();
        });

    });

    QUnit.asyncTest("Connecting Todo to the `/api/todos` service",function(){

        todoModelPromise.then(function(Todo){
            if(!Todo.connection) {
                QUnit.ok(false, "there's no connection");
                QUnit.start();
            } else {
                Todo.getList({}).then(function(todos){
                    QUnit.ok(todos instanceof Todo.List, "response is Todo.List");
                    QUnit.ok(todos.length, "data has at least one item");
                    var firstTodo = todos[0];
                    QUnit.ok(firstTodo.id && firstTodo.name && firstTodo.complete !== undefined, "has id, name, and complete");

                }).then(function(){
                    return new Todo({name: "make a fixture", complete: true})
                        .save().then(function(todo){
                        var id = todo.id;
                        QUnit.ok(todo.id, "save has an id value sent back");
                        todo.complete = false;
                        return todo.save().then(function(todo){
                            QUnit.deepEqual(todo.get(), {name: "make a fixture", complete: false, id: id}, "updated data");
                            return todo.destroy().then(function(){
                                QUnit.ok(true, "delete is successful");
                            });
                        });
                    });
                })
                .then(function(){
                    QUnit.start();
                },function(e){
                    QUnit.ok(false, "there was an error "+e);
                    QUnit.start();
                });
            }



        }, function(){
            QUnit.ok(false, "you haven't defined models/todos-fixture yet");
            QUnit.start();
        });

    });

    QUnit.test("List todos in the page", function(){
        QUnit.ok( timeToShowTodos > 20 , "loaded todos async "+timeToShowTodos);
    });

    QUnit.asyncTest("Toggling a todo's checkbox updates service layer",function(){
        if(!document.querySelector(".toggle").hasAttribute("checked:bind")) {
            QUnit.ok(false, "not trying two-way DOM data bindings yet");
            QUnit.start();
            return;
        }
        var changeCount = 0;
        fixture.then(function(fixture){

            var checkbox = document.querySelector(".todo .toggle");
            var fixtureCompleteValue;

            var toggleCheckbox = function(){
                fixtureCompleteValue = checkbox.checked = !checkbox.checked;
                domEvents.dispatch(checkbox,"change");
                QUnit.ok(checkbox.disabled, "checkbox is disabled while saving");
            };
            // trap this request
            var fixtures = fixture.fixtures.splice(0);
            fixture({url: "/api/todos/{id}", type:"put"}, function(request){
                changeCount++;

                QUnit.ok(true, "made request");
                QUnit.equal(request.data.complete,fixtureCompleteValue, "Service layer sent new `.complete` state");

                if(changeCount === 2) {
                    // reset everything
                    setTimeout(function(){
                        fixture.fixtures.splice(0);
                        fixture.fixtures.push.apply(fixture.fixtures, fixtures);
						checkbox = document.querySelector(".todo .toggle"); // TODO: remove after can-connect#436
                        QUnit.ok(! checkbox.disabled, "checkbox is not disabled");
                        QUnit.start();
                    },20);
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

    QUnit.asyncTest("Delete todos", function(){

        var todos = document.querySelectorAll(".todo");
        var todosCount = todos.length;
        var last = todos[0];

        domEvents.dispatch(last.querySelector(".destroy"),"click");
        QUnit.ok(last.classList.contains("destroying"), "when instance is being destroyed, it should have `destroying` in .className");

        waitFor(function(){
            return document.querySelectorAll(".todo").length === todosCount - 1;
        }).then(function(){
            QUnit.ok(true, "deleted a todo");
            QUnit.start();
        });


    });

    QUnit.asyncTest("Create todos",function(){
        steal.import("todomvc/components/todo-create/todo-create").then(moduleDefault).then(function(Todo){

            var todos = document.querySelectorAll(".todo");
            var todosCount = todos.length;

            var newTodo = document.getElementById("new-todo");

            newTodo.value = "mow lawn";
            domEvents.dispatch(newTodo,"change");

            var event = new KeyboardEvent("keyup",{key: "Enter"});
            newTodo.dispatchEvent(event);

            waitFor(function(){
                return document.querySelectorAll(".todo").length === todosCount + 1;
            }).then(function(){
                QUnit.ok(true, "created a todo");
                QUnit.equal(newTodo.value, "", "The input is cleared after a todo is created");
                QUnit.start();
            });
        }, function(){
            QUnit.ok(false, "you haven't defined components/todo-create/ yet");
            QUnit.start();
        });
    });

    QUnit.asyncTest("Edit todo names",function(){
        steal.import("todomvc/components/todo-list/todo-list").then(moduleDefault).then(function(){

            fixture.then(function(fixture){
                var todo = document.querySelector(".todo");
                var todoLabel = todo.querySelector("label");
                var todoInput = todo.querySelector(".edit");

                // trap this request
                var fixtures = fixture.fixtures.splice(0);
                fixture({url: "/api/todos/{id}", type:"put"}, function(request){
                    QUnit.ok(true, "made request");
                    QUnit.equal(request.data.name,"MOW GRASS", "got new name");
                    setTimeout(function(){
                        fixture.fixtures.splice(0);
                        fixture.fixtures.push.apply(fixture.fixtures, fixtures);
                        QUnit.ok(! todo.classList.contains("editing"), "enter removes editing mode");
                        QUnit.start();
                    },20);
                    return {
                        id: request.data.id,
                        name: request.data.name,
                        complete: request.data.complete
                    };
                });

                // try editing
                domEvents.dispatch(todoLabel,"dblclick");
                QUnit.ok( todo.classList.contains("editing"), "in edit mode");
                QUnit.ok( document.activeElement, todoInput, "element has focus");

                todoInput.blur();
                domEvents.dispatch(todoInput, "blur");
                setTimeout(function(){
                    QUnit.ok(! todo.classList.contains("editing"), ".blur() removes editing mode");

                    // actually edit
                    domEvents.dispatch(todoLabel,"dblclick");
                    todoInput.value = "MOW GRASS";
                    domEvents.dispatch(todoInput,"change");
                    todoInput.dispatchEvent(new KeyboardEvent("keyup",{key: "Enter"}));
                },20);

            });


        }, function(){
            QUnit.ok(false, "you haven't defined components/todo-list/ yet");
            QUnit.start();
        });


    });

    QUnit.asyncTest("Toggle all todos complete state", function(){
        var todos = Array.from( document.querySelectorAll(".todo") );

        var initialState = todos.map(function(todo){
            return todo.querySelector(".toggle").checked;
        });
        // change everything to checked
        todos.forEach(function(todo){
            var input = todo.querySelector(".toggle");
            input.checked = true;
            domEvents.dispatch(input,"change");
        });

        var toggleAll = document.querySelector("#toggle-all");
        QUnit.ok( toggleAll.checked, "#toggle-all is checked when everything else is checked");

        var input = todos[0].querySelector(".toggle");
        input.checked = false;
        domEvents.dispatch(input,"change");

        QUnit.ok( !toggleAll.checked, "#toggle-all is checked when a single todo is unchecked");


        toggleAll.checked = true;
        domEvents.dispatch(toggleAll,"change");
        QUnit.ok(toggleAll.disabled, "disabled on change");
        waitFor(function(){
            return !toggleAll.disabled;
        }).then(function(){
			todos = Array.from( document.querySelectorAll(".todo") ); // TODO: remove when can-connect is fixed
            todos.forEach(function(todo, i){
                var input = todo.querySelector(".toggle");
                input.checked = initialState[i];
                domEvents.dispatch(input,"change");
            });

            QUnit.start();
        });

    });

    QUnit.asyncTest("Clear all completed todos", function(){
        var todos = Array.from(document.querySelectorAll(".todo .toggle"));
        var uncompletedCount = todos.reduce(function(acc, todo){
            return acc + todo.checked ? 0 : 1;
        }, 0);

        var clearCompleted = document.getElementById("clear-completed");
        //clearCompleted.click();
        domEvents.dispatch(clearCompleted, "click");

        setTimeout(function(){
            QUnit.ok(document.querySelectorAll(".todo").length, uncompletedCount);
            QUnit.start();
        }, 20);
    });

    QUnit.asyncTest("Setup routing", function(){
        // make sure the links are right
        var links = Array.from( document.querySelectorAll("#filters a") );
        var hrefMap = {All: "#!", Active: "#!active", Completed: "#!complete"};

        links.forEach(function(link){
            QUnit.equal(link.getAttribute("href") , hrefMap[link.innerHTML.trim()], link.innerHTML.trim()+" href is right.");
        });

        window.location.href = "#!active";



        setTimeout(function(){
            Array.from( document.querySelectorAll(".todo .toggle") ).forEach(function(input){
                QUnit.ok(!input.checked, "#!active page should have only unchecked boxes");
            });

            window.location.href = "#!complete";
            setTimeout(function(){
                Array.from( document.querySelectorAll(".todo .toggle") ).forEach(function(input){
                    QUnit.ok(input.checked, "#!complete page should have only unchecked boxes");
                });

                window.location.href = "#!";
                setTimeout(function(){
                    QUnit.start();
                },20);

            },20);

        },20);



    });
}

function moduleDefault(module) {
    if (module && typeof module === 'object' && module.__esModule === true) {
        return module.default;
    }

    return module;
}
