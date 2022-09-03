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
The values are objects of `event`: `handler` pairs where the handler can be either the name of a callback function inside the class or a function.

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

Add an elements getter that returns an object of `key`: `selector` pairs.  
The selected elements are mapped to the key.

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
The keys of the returned object are css selectors to choose which elements should be observed.  
The selector `root` will be interpreted as the component itself.
The values are objects of `mutationType`: `handler` pairs where the handler can be either the name of a callback function inside the class or a function.  
Does not work for shadowRoot at the moment.

```javascript
  /** @inheritdoc */
  get mutations() {
    return {
      root: { childList: "updateCounter" },
      '.items': {childList: (m, o) => console.log(m, o)}
    };
  }
```

## Usage

A component has to be a class that extends the `AbstractComponent` class and must add a template to its prototype.

```javascript
import { AbstractComponent } from "./Abstract.js";
class MyComponent extends AbstractComponent {
  get elements() {
    return {
      my: ".myElement",
    };
  }
  get listeners() {
    return {
      ".myElement": {
        click: (e) =>
          this.my.appendChild(document.createTextNode(" is awesome!!")),
      },
    };
  }
  get mutations() {
    return {
      root: { childList: (m, o) => console.log(m, o) },
    };
  }
  connectedCallback() {
    super.connectedCallback();
    console.log(this.my);
  }
}
MyComponent.prototype.template = document.createElement("template");
MyComponent.prototype.template.innerHTML = /* html */ `
<div class="myElement">
    My Component
</div>
`;
customElements.define("my-component", MyComponent);
```
