export class Router {
  #_routes = [];
  #_initial = "/";
  #_current = "/";

  constructor() {
    this.current = location.pathname;
    this.initial = this.current;
    this.abortController = new AbortController();
    this.abortSignal = this.abortController.signal;
    addEventListener("popstate", (e) => this.handleHistoryPop(e));
  }

  /**
   * Define routes
   * @param {String} route
   * @param {Function} callback
   */
  route(route = "/", cb = () => {}) {
    this.routes.push({ route, cb });
    this.addListener(route, cb);
  }

  addListener(route, cb) {
    document.querySelectorAll(`[href="/${route}"]`).forEach((node) => {
      node.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          this.push(route);
          cb();
        },
        {
          signal: this.abortSignal,
        }
      );
    });
  }

  addListeners() {
    this.routes.forEach((i) => this.addListener(i.route, i.cb));
  }

  push(route) {
    history.pushState(route, "", route);
  }

  handleHistoryPop(e) {
    this.abortController.abort();
    if (location.pathname === this.initial) {
      // We reload the page since we cannot know how to recreate this view
      location.reload();
    } else {
      // run the assiociated callback otherwise
      this.routes.find((r) => e.state === r.route)?.cb?.();
    }
  }

  get initial() {
    return this.#_initial;
  }
  set initial(v) {
    this.#_initial = v;
  }

  get routes() {
    return this.#_routes;
  }
  set routes(v) {
    this.#_routes = v;
  }

  get current() {
    return this.#_current;
  }
  set current(v) {
    this.#_current = v;
  }
}
