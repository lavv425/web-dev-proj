import routerInstance from "./app.mjs";

const navbarLinks = document.querySelectorAll(".nav-link");

const updateActiveLink = () => {
    const currentPath = routerInstance.getCurrentPath();

    navbarLinks?.forEach(navLink => {
        const linkPath = navLink.getAttribute("to");

        if (currentPath === linkPath) {
            navLink.classList.add("active");
        } else {
            navLink.classList.remove("active");
        }
    });
};

document.addEventListener("DOMContentLoaded", updateActiveLink);

window.addEventListener("popstate", updateActiveLink);
document.addEventListener("click", (event) => {
    if (event.target.matches("[data-link]")) {
        setTimeout(updateActiveLink, 0);
    }
});