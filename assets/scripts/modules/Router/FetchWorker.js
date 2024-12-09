// using a web worker to fetch the pages, so that the main thread does not block on page fetch
self.onmessage = async function (event) {
    const { path, fullPath } = event.data;
    try {
        const response = await fetch(fullPath);
        if (!response.ok) throw new Error("Page not found");

        const html = await response.text();

        // Send the html to the main thread
        self.postMessage({ success: true, path, html });
    } catch (error) {
        self.postMessage({ success: false, path, error: error.message });
    }
};