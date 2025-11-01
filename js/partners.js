document.addEventListener("DOMContentLoaded", function () {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // If user prefers reduced motion, display logos in a static grid
        const container = document.querySelector(".marquee-inner");
        container.style.transform = "none";
        container.style.flexWrap = "wrap";
        container.style.justifyContent = "center";
        container.style.gap = "2rem";
        container.style.padding = "2rem";

        // Remove duplicated logos for static display
        const images = container.querySelectorAll('.ratio');
        const totalImages = images.length;
        for (let i = totalImages / 2; i < totalImages; i++) {
            images[i].remove();
        }

        return; // Exit the animation script
    }

    // Original marquee animation for users without reduced motion preference
    const container = document.querySelector(".marquee-inner");
    const clones = container.cloneNode(true);
    container.appendChild(clones);

    let scrollAmount = 0;
    let isPaused = false;
    let animationFrameId;

    function marqueeScroll() {
        if (!isPaused) {
            scrollAmount += 1; // animation speed
            container.style.transform = `translateX(-${scrollAmount}px)`;

            // Reset position when scrolled half the width for seamless loop
            if (scrollAmount >= container.scrollWidth / 2) {
                scrollAmount = 0;
            }
        }
        animationFrameId = requestAnimationFrame(marqueeScroll);
    }

    // Start the animation
    marqueeScroll();

    // Pause on hover/focus for better accessibility
    const wrapper = document.querySelector(".marquee-wrapper");

    wrapper.addEventListener("mouseenter", () => {
        isPaused = true;
    });

    wrapper.addEventListener("mouseleave", () => {
        isPaused = false;
    });

    // Also pause when any logo inside receives focus
    const logos = wrapper.querySelectorAll('.ratio');
    logos.forEach(logo => {
        logo.addEventListener('focus', () => {
            isPaused = true;
        });

        logo.addEventListener('blur', () => {
            isPaused = false;
        });
    });

    // Clean up animation frame when page is hidden (performance optimization)
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
        } else {
            animationFrameId = requestAnimationFrame(marqueeScroll);
        }
    });
});