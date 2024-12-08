import Typer from "../Typer/Typer.js";

class Router {
    #routes = {};
    #config = { selector: "#app", isPathRelative: true, basePath: "/web-dev-proj", }; // Default config
    #container;
    #typer;
    #worker;

    constructor(routes, config = {}) {
        try {
            this.#typer = new Typer();

            // Routes must be and object
            this.#routes = this.#typer.isType("o", routes);

            // Validates config and merge with the default config
            this.#config = config ? { ...this.#config, ...this.#typer.isType("o", config) } : this.#config;

            // Find the container
            this.#container = document.querySelector(this.#config.selector);
            if (!this.#container) {
                throw new Error(`Element with selector "${this.#config.selector}" not found.`);
            }

            // Initialize the Web Worker
            const workerPath = this.#typer.isType("s", `${this.#config.basePath}/assets/scripts/modules/Router/FetchWorker.js`);

            this.#worker = new Worker(workerPath);

            // Handle messages from the worker
            this.#worker.onmessage = (event) => this.#handleWorkerMessage(event.data);

            // Intialize the events and load the first page
            this.#initialize();
        } catch (error) {
            throw new Error(error.message);
        }

    }

    #handleWorkerMessage(data) {
        if (data.success) {
            this.#container.innerHTML = data.html; // Append the HTML fetched by the worker
        } else {
            console.error(`Error fetching page for path "${data.path}":`, data.error);
            this.#container.innerHTML = "<h1>404: Page not found</h1>";
        }
    }

    #loadPage(path) {
        try {
            const normalizedPath = this.#normalizePath(path); // Normalize the incoming path
            const routePath = normalizedPath.replace(this.#config.basePath, "") || "/"; // Remove basePath from the route

            console.log(routePath);
            const route = this.#routes[routePath]; // Match route with normalized path
            console.log(route);
            if (!route) {
                console.error(`Route for path "${routePath}" not found in routes object.`);
                document.querySelector(this.#config.selector).innerHTML = "<h1>404: Page not found</h1>";
                return;
            }

            const fullPath = this.#config.isPathRelative
                ? `${this.#config.basePath}/${route}` // If relative, prepend basePath
                : `${location.origin}${this.#config.basePath}/${route}`; // If absolute, prepend origin and basePath
            if (!fullPath) throw new Error("Page not found");
            // const response = await fetch(fullPath);
            // if (!response.ok) throw new Error("Page not found");

            // // Puts the page content into the given selector
            // const html = await response.text();
            // this.#container.innerHTML = html;

            this.#worker.postMessage({ path, fullPath });
        } catch (error) {
            this.#container.innerHTML = "<h1>404: Page not found</h1>";
            console.error(error);
        }
    }

    #normalizePath(path) {
        const basePath = this.#config.basePath || "";
        // Ensure the path is relative to the basePath
        return path.startsWith(basePath)
            ? path.slice(basePath.length).replace(/\/$/, "")
            : path.replace(/\/$/, "");
    }

    #handleNavigation(event) {
        if (event.target.matches("[data-link]")) {
            event.preventDefault();
            const href = event.target.getAttribute("to");

            // Update the URL without reloading the page
            window.history.pushState(null, null, `${this.#config.basePath}${href}`);

            // Load the new page
            this.#loadPage(`${this.#config.basePath}${href}`);
        }
    }

    #initialize() {
        // Browser navigation "handler"
        window.addEventListener("popstate", () => this.#loadPage(window.location.pathname));

        // "Links" click
        document.addEventListener("click", (event) => this.#handleNavigation(event));

        // Loads initial content
        this.#loadPage(window.location.pathname);
    }
}

export default Router;