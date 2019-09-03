# can-todomvc-test

This project is used to test a CanJS implementation of TodoMVC.  
To use it:

1. Install it

  ```
  npm install can-todomvc-test --save-dev
  ```

2. Import it and pass it your application main element:

  ```js
  class AppVM extends ObservableObject {
    static props = { ... };
  }

  const appVM = new AppVM();

  const frag = view(appVM);
  document.body.appendChild(frag);
  
  const todoMvcTest = require("can-todomvc-test");
  todoMvcTest(appVM)
  ```
