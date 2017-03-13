# can-todomvc-test

This project is used to test a CanJS implementation of TodoMVC.  
To use it:

1. Install it

  ```
  npm install can-todomvc-test --save-dev
  ```

2. Import it and pass it your application view model instance:

  ```js
  var AppViewModel = DefineMap.extend( .... );


  var appVM = new AppViewModel(...);

  var frag = view(appVM);
  document.body.appendChild(frag);
  
  var todoMvcTest = require("can-todomvc-test");
  todoMvcTest(appVM)
  ```
