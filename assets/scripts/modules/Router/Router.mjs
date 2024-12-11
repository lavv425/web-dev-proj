"use strict";
import Typer from "../Typer/Typer.mjs";

/**
 * @typedef {Object} RouterConfig
 * @property {string} selector - The CSS selector for the container where the content will be loaded.
 * @property {boolean} isPathRelative - Whether the paths in the routes are relative to the basePath.
 * @property {string} basePath - The base path for the application (e.g., "/web-dev-proj").
 * @property {boolean} cachePages - Whether to cache the pages in Indexed DB (fallbacks to localStorage if not available).
 */

/**
 * @typedef {Record<any, any>} Routes
 */

/**
 * Class representing a router to manage SPA routing..
 * @author Michael Lavigna
 * @version 1.3
 */
class Router {
    /** @type {Routes} Routes configuration */
    #routes = {};

    /**
     * Default configuration options for the Router.
     * @type {RouterConfig}
     * @private
     */
    #config = { selector: "#app", isPathRelative: true, basePath: "", cachePages: true };

    /** @type {HTMLElement} The container where the pages will be loaded */
    #container;

    /** @type {Typer} Instance of Typer for type validation */
    #typer;

    /** @type {Worker} Web worker for handling page fetches */
    #worker;

    /** @type {DOMParser} DOMParser instance for parsing HTML content */
    #domParser;

    /** 
     * @type {IDBDatabase | null} Reference to the IndexedDB instance for caching pages.
     * When null (indexedDB not available), localStorage will be used as a fallback.
     */
    #db = null;

    /** @type {string} The current path */
    #currentPath = null;

    /** @type {string} The last generated path */
    #lastFullPath = null;

    /**
     * Creates a new Router instance.
     * @param {Routes} routes - An object defining the routes.
     * @param {RouterConfig} [config={}] - Configuration options.
     */
    constructor(routes, config = {}) {
        try {
            this.#typer = new Typer();
            this.#domParser = new DOMParser();
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
            const bp = this.#config.basePath === "/" ? "" : "/";
            const workerPath = this.#typer.isType("s", `${this.#config.basePath}/assets/scripts/modules/Router/FetchWorker.js`);

            this.#worker = new Worker(workerPath);

            // Handle messages from the worker
            this.#worker.onmessage = (event) => this.#handleWorkerMessage(event.data);

            if (this.#config.cachePages) {
                // Initialize IndexedDB or fallback to localStorage
                this.#initializeCache();
            }
            // Intialize the events and load the first page
            this.#initialize();
        } catch (error) {
            throw new Error(error.message);
        }

    }

    /**
     * Handles messages from the web worker.
     * @param {Object} data - The data sent from the worker.
     */
    async #handleWorkerMessage(data) {
        if (data.success) {
            if (this.#config.cachePages) {
                await this.#cachePage(this.#lastFullPath, data.html);
            }

            const { headElements, bodyContent } = this.#parseDom(data.html);

            await this.#composeDom(headElements, bodyContent);

            // // Update the <head> content
            // await this.#updateHead(headElements);

            // // Update the <body> content
            // this.#container.innerHTML = bodyContent;

            // // Trigger the "DOMContentLoaded" event
            // document.dispatchEvent(new Event("DOMContentLoaded"));

            // // Append the HTML fetched by the worker
            // this.#container.innerHTML = data.html;
        } else {
            console.error(`Error fetching page for path "${data.path}":`, data.error);
            this.#lastFullPath = btoa("error-fetching-from-worker-path-not-found");
            this.#container.innerHTML = "<h1>404: Page not found</h1>";
        }
    }

    async #initializeCache() {
        if (window.indexedDB) {
            const request = indexedDB.open("RouterCache", 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("pages")) {
                    db.createObjectStore("pages", { keyPath: "path" });
                }
            };

            request.onsuccess = (event) => {
                this.#db = event.target.result;
            };

            request.onerror = (event) => {
                console.error("IndexedDB initialization failed:", event.target.error);
                this.#db = null; // Fallback to localStorage
            };
        } else {
            console.warn("IndexedDB not available, using localStorage as fallback.");
        }
    }

    async #cachePage(path, html) {
        if (!this.#config.cachePages) return;

        if (this.#db) {
            const transaction = this.#db.transaction("pages", "readwrite");
            const store = transaction.objectStore("pages");
            store.put({ path, html });
        } else {
            localStorage.setItem(`page_${path}`, html);
        }
    }

    async #getCachedPage(path) {
        if (!this.#config.cachePages) return null;

        if (this.#db) {
            return new Promise((resolve, reject) => {
                const transaction = this.#db.transaction("pages", "readonly");
                const store = transaction.objectStore("pages");
                const request = store.get(path);

                request.onsuccess = () => resolve(request.result?.html || null);
                request.onerror = () => reject(null);
            });
        } else {
            return localStorage.getItem(`page_${path}`);
        }
    }

    /**
    * Updates the document head with new elements returned from the worker.
    * @param {Object} headElements - An object containing the returned head elements (title, links, scripts, metas).
    */
    async #updateHead(headElements) {
        const { title, links, scripts, metas } = headElements;

        // Updates the title (if a new one is present)
        if (title) document.title = title;

        const baseTag = document.querySelector("base") || document.createElement("base");
        baseTag.setAttribute("href", `${location.origin}${this.#config.basePath}/`);
        if (!document.head.contains(baseTag)) {
            document.head.prepend(baseTag);
        }

        // Remove old dynamics <link> e <script>. Dynamics links and scripts are defined with [data-key] prop
        document.querySelectorAll("head link[data-key], head script[data-key]").forEach(el => el.remove());

        // Promises for loading links and scripts, so that they are loaded before the body
        const loadPromises = [];
        // Adds new <link> if not already present (present means it's already there 1:1)
        links.forEach((link) => {
            const existingLink = Array.from(document.querySelectorAll("head link")).find(existing => {
                return Array.from(link.attributes).every(attr =>
                    existing.getAttribute(attr.name) === attr.value
                );
            });

            if (!existingLink) {
                const linkElement = document.createElement("link");
                Array.from(link.attributes).forEach(attr => {
                    linkElement.setAttribute(attr.name, attr.value);
                });
                linkElement.setAttribute("data-key", "dynamic"); // Dynamic identifier

                // Load event listener
                const loadPromise = new Promise((resolve, reject) => {
                    linkElement.onload = resolve;
                    linkElement.onerror = reject;
                });
                loadPromises.push(loadPromise);

                document.head.appendChild(linkElement);
            }
        });

        // Adds new <script> if not already present (present means it's already there 1:1)
        scripts.forEach((script) => {
            const existingScript = Array.from(document.querySelectorAll("head script")).find(existing => {
                return Array.from(script.attributes).every(attr =>
                    existing.getAttribute(attr.name) === attr.value
                );
            });

            if (!existingScript) {
                const scriptElement = document.createElement("script");
                Array.from(script.attributes).forEach(attr => {
                    scriptElement.setAttribute(attr.name, attr.value);
                });
                scriptElement.setAttribute("data-key", "dynamic"); // Dynamic identifier

                const loadPromise = new Promise((resolve, reject) => {
                    scriptElement.onload = resolve;
                    scriptElement.onerror = reject;
                });
                loadPromises.push(loadPromise);

                document.head.appendChild(scriptElement);
            }
        });

        // Adds new <meta> if not already present (present means it's already there 1:1)
        metas.forEach((meta) => {
            const existingMeta = Array.from(document.querySelectorAll("head meta")).find(existing => {
                return Array.from(meta.attributes).every(attr =>
                    existing.getAttribute(attr.name) === attr.value
                );
            });

            if (!existingMeta) {
                const metaElement = document.createElement("meta");
                Array.from(meta.attributes).forEach(attr => {
                    metaElement.setAttribute(attr.name, attr.value);
                });
                metaElement.setAttribute("data-key", "dynamic"); // Dynamic identifier
                document.head.appendChild(metaElement);
            }
        });

        return Promise.all(loadPromises);
    }

    /**
     * Loads a page and updates the content dynamically.
     * @param {string} path - The path of the route to load.
     */
    async #loadPage(path) {
        try {
            const normalizedPath = this.#normalizePath(path); // Normalize the incoming path
            const routePath = normalizedPath.replace(this.#config.basePath, "") || "/"; // Remove basePath from the route

            // The "theoretical" (needs a test) current path
            this.#currentPath = routePath;

            // console.log(routePath);
            const route = this.#routes[routePath]; // Match route with normalized path
            // console.log(route);
            if (!route) {
                this.#lastFullPath = routePath;
                console.error(`Route for path "${routePath}" not found in routes object.`);
                document.querySelector(this.#config.selector).innerHTML = "<h1>404: Page not found</h1>";
                return;
            }

            const fullPath = this.#config.isPathRelative
                ? `${this.#config.basePath}/${route}` // If relative, prepend basePath
                : `${location.origin}${this.#config.basePath}/${route}`; // If absolute, prepend origin and basePath
            if (!fullPath) {
                this.#lastFullPath = btoa("unknown-route-parameter-given-path-not-found");
                throw new Error("Page not found");
            }

            // const response = await fetch(fullPath);
            // if (!response.ok) throw new Error("Page not found");

            // // Puts the page content into the given selector
            // const html = await response.text();
            // this.#container.innerHTML = html;
            if (this.#lastFullPath === fullPath) {
                return; // Skip loading if the route corresponds to the current path
            }
            this.#lastFullPath = fullPath;

            const cachedPage = await this.#getCachedPage(fullPath);
            if (cachedPage) {
                const { headElements, bodyContent } = this.#parseDom(cachedPage);
                await this.#composeDom(headElements, bodyContent);
                return;
            }

            this.#worker.postMessage({ path, fullPath });
        } catch (error) {
            this.#container.innerHTML = "<h1>404: Page not found</h1>";
            console.error(error);
        }
    }

    #parseDom(html) {
        // Parse the html returned from the worker
        const doc = this.#domParser.parseFromString(html, "text/html");

        // Extract body and head from the parsed html
        const bodyContent = doc.body.innerHTML;
        const headElements = {
            title: doc.title,
            links: Array.from(doc.head.querySelectorAll("link")),
            scripts: Array.from(doc.head.querySelectorAll("script")),
            metas: Array.from(doc.head.querySelectorAll("meta")),
        };

        return { bodyContent, headElements };
    }

    async #composeDom(head, body) {
        this.#container.innerHTML = body;
        await this.#updateHead(head);
        document.dispatchEvent(new Event("DOMContentLoaded"));
    }
    /**
     * Normalizes the path by removing the basePath and trailing slash.
     * @param {string} path - The path to normalize.
     * @returns {string} The normalized path.
     */
    #normalizePath(path) {
        const basePath = this.#config.basePath || "";
        // Ensure the path is relative to the basePath
        return path.startsWith(basePath)
            ? path.slice(basePath.length).replace(/\/$/, "")
            : path.replace(/\/$/, "");
    }

    /**
     * Handles navigation events and loads the requested page.
     * @param {Event} event - The "link" click event.
     */
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

    /**
     * Initializes routing, including event listeners and the initial load.
     */
    #initialize() {
        // Browser navigation "handler"
        window.addEventListener("popstate", () => this.#loadPage(window.location.pathname));

        // "Links" click
        document.addEventListener("click", (event) => this.#handleNavigation(event));

        // Loads initial content
        this.#loadPage(window.location.pathname);
    }

    // Public methods
    getCurrentPath() { return this.#currentPath }

    getLastPath() { return this.#lastFullPath }

    getRegisteredRoutes() { return this.#routes }

    getRegisteredContainer() { return this.#container }
}

export default Router;