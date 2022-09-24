# Web Components

Provide an abstract class for convenient web components.

## Features

- Configure event listeners that remove themselves on disconnect
- Configure elements to fetch from your component for later use
- configure mutation observers

### Event listeners

Add a listeners getter that returns an object describing the desired event listeners.  
The keys of the returned object are css selectors to choose which elements the event should be added to.  
The selector `root` will be interpreted as the component itself.  
The values are objects of `event`: `handler` pairs where the handler is a function.

```javascript
  /** @inheritdoc */
  get listeners() {
    return {
      button: { click: "addHandler" },
      input: { keydown: e => console.log(e) },
    };
  }
```

### Elements

Add an elements getter that returns an object of `key`: `css-selector` pairs.  
The selected elements are mapped to instance properties named `key`.

```javascript
  /** @inheritdoc */
  get elements() {
    return {
      myButton: "button"
    };
  }

  myFunc() {
    this.myButton.doSomething();
  }
```

### Mutations

Add a mutations getter that returns an object describing the desired mutation observers.  
The keys of the returned object are names of properties that contain one or multiple nodes of the components shadow dom (see above).  
The word `root` will be interpreted as the component itself.
The values are arrays of objects of `mutationType`: `handler` pairs where the handler is a function.  
By default attributes, the childList and its subTree are observed. To change that behavior add a `mutationObserverOptions` getter which returns an object with the desired options.

```javascript
  /** @inheritdoc */
  get mutations() {
    return {
      root: [{childList: (m, o) => console.log(m, o)}] // must be an array of objects
      myButton: [
        {childList: (m, o) => console.log(m)},
        {childList: (m, o) => console.log(o)}
      ] // must be an array of objects
    };
  }

  get mutationObserverOptions() {
    return {
      childList: true,
      subTree: false
    };
  }
```

## Usage

A component has to be a class that extends the `AbstractComponent` class and must add a template to its prototype.  
See examples.
