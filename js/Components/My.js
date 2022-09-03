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
