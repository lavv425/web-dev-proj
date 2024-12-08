(() => {
    const frag = document.createDocumentFragment();
    const goToTopBtn = document.createElement('button');
    goToTopBtn.className = "go-to-top";
    goToTopBtn.innerHTML = `<i class="fa-solid fa-arrow-up fa-lg" style="color: #ffffff;"></i>`;
    frag.appendChild(goToTopBtn);

    document.body.appendChild(frag);

    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            goToTopBtn.style.display = 'block';
        } else {
            goToTopBtn.style.display = 'none';
        }

        const st = document.documentElement.scrollTop || document.body.scrollTop;

        if (st > lastScrollTop) {
            document.body.style.top = '-400px';
        } else {
            document.body.style.top = document.body.style.marginTop;
        }

        lastScrollTop = st <= 0 ? 0 : st;
    });

    goToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
})();