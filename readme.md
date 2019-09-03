# can-todomvc-test

This project is used to test a CanJS implementation of TodoMVC.  
To use it:

1. Install it

  ```
  npm install can-todomvc-test --save-dev
  ```

2. Import it and pass it your application main element:

  ```js
  class TodoMVC extends StacheElement {
    static view = "";
    static props = { ... };
  }
  customElement.define("todo-mvc", TodoMVC);

  ...
  
  const todoMvcTest = require("can-todomvc-test");
  todoMvcTest(document.querySelector("todo-mvc"));
  ```
