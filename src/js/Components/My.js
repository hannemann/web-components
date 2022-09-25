import { AbstractComponent } from "./Abstract.js";
class MyComponent extends AbstractComponent {
  get elements() {
    return {
      my: ".myElement",
      button: ".button",
    };
  }
  get listeners() {
    return {
      ".button": {
        click: (e) =>
          this.my.appendChild(document.createTextNode(" are awesome!!")),
      },
    };
  }
  get mutations() {
    return {
      my: [
        { childList: (m, o) => console.log(m) },
        { childList: (m, o) => console.log(o) },
        { childList: "This raises an error" },
      ],
      button: [{ childList: (m, o) => console.log(m, o) }],
    };
  }
  connectedCallback() {
    super.connectedCallback();
    console.log(this.my);
  }
}
MyComponent.prototype.template = document.createElement("template");
MyComponent.prototype.template.innerHTML = /* html */ `
<button class="button">Click!</button>
<div class="myElement">
    Web Components
</div>
`;
customElements.define("my-component", MyComponent);
