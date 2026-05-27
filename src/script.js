// wait until all HTML elements are loaded before running JavaScript
document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     DOM ELEMENTS
     ========================= */

  // background slides inside jumbotron
  const backgroundSlides = document.querySelectorAll(
    ".jumbotron-container figure",
  );

  // all carousel cards
  const carouselCards = document.querySelectorAll(".carousel-items");

  // container used for dragging/swiping
  const carouselTrack = document.querySelector("#dragContainer");

  // container for pagination dots
  const paginationDotsContainer = document.querySelector("#pagination-dots");

  /* =========================
     CONFIGURATION
     ========================= */

  // central place for animation settings
  const CONFIG = {
    // minimum swipe distance
    swipeThreshold: 5,

    // controls depth animation strength
    depthStrength: 0.8,

    // maximum Y-axis rotation
    rotationStrength: 60,

    // responsive horizontal spacing
    mobileTranslateX: 70,
    tabletTranslateX: 100,
    desktopTranslateX: 150,

    // responsive breakpoints
    mobileBreakpoint: 640,
    tabletBreakpoint: 768,
    desktopBreakpoint: 1024,

    // responsive vertical spacing
    mobileTranslateY: 8,
    desktopTranslateY: 30,

    // how many nearby cards stay visible
    visibleCards: 2,

    // highest stacking order
    maxZIndex: 100,
  };

  /* =========================
     INITIAL STATE
     ========================= */

  // set middle card as initial active card
  const initialActiveSlideIndex = Math.floor(carouselCards.length / 2);

  // store current viewport width
  const viewportWidth = window.innerWidth;

  // global carousel state
  const state = {
    // current active slide
    activeSlideIndex: initialActiveSlideIndex,

    // pointer start position
    pointerStartX: 0,

    // pointer end position
    pointerEndX: 0,
  };

  /* =========================
     EVENT HANDLERS
     ========================= */

  // save pointer start position
  carouselTrack.addEventListener("pointerdown", (event) => {
    state.pointerStartX = event.clientX;
  });

  // save pointer end position
  // then calculate swipe direction
  carouselTrack.addEventListener("pointerup", (event) => {
    state.pointerEndX = event.clientX;

    handleSwipeGesture();
  });

  /* =========================
     SWIPE LOGIC
     ========================= */

  // determine swipe direction
  function handleSwipeGesture() {
    // calculate swipe distance
    const swipeDistance = state.pointerEndX - state.pointerStartX;

    // ignore tiny accidental movement
    if (Math.abs(swipeDistance) > CONFIG.swipeThreshold) {
      // swipe right
      if (swipeDistance > 0) {
        setActiveSlide(getWrappedSlideIndex(state.activeSlideIndex - 1));
      }

      // swipe left
      else {
        setActiveSlide(getWrappedSlideIndex(state.activeSlideIndex + 1));
      }
    }
  }

  /* =========================
     CREATE PAGINATION DOTS
     ========================= */

  carouselCards.forEach((_, slideIndex) => {
    // create pagination dot
    const paginationDot = document.createElement("button");

    // tailwind classes
    paginationDot.className = `
        h-2
        w-2
        rounded-full
        bg-white/30
        transition-all
        duration-300
        hover:bg-white/50
        cursor-pointer
        border
        border-black
        pagination-dot
      `;

    // save slide index
    paginationDot.dataset.index = slideIndex;

    // clicking dot changes slide
    paginationDot.addEventListener("click", () => {
      setActiveSlide(slideIndex);
    });

    // insert dot into DOM
    paginationDotsContainer.appendChild(paginationDot);
  });

  /* =========================
     PAGINATION DOTS
     ========================= */

  // select all pagination dots
  const paginationDots = document.querySelectorAll(".pagination-dot");

  // update active dot styles
  function renderActivePaginationDot() {
    paginationDots.forEach((dotElement, dotIndex) => {
      // check active state
      const isActiveDot = dotIndex === state.activeSlideIndex;

      // active dot style
      dotElement.classList.toggle("bg-white", isActiveDot);

      // inactive dot style
      dotElement.classList.toggle("bg-white/30", !isActiveDot);
    });
  }

  /* =========================
     HELPER FUNCTIONS
     ========================= */

  // keeps index inside valid range
  // creates infinite carousel loop
  function getWrappedSlideIndex(slideIndex) {
    return (slideIndex + carouselCards.length) % carouselCards.length;
  }

  // creates smooth depth effect
  function getDepthFactor(absoluteDistanceFromCenter) {
    return Math.exp(-absoluteDistanceFromCenter * CONFIG.depthStrength);
  }

  // responsive horizontal spacing
  function getHorizontalSpacing() {
    return viewportWidth < CONFIG.mobileBreakpoint
      ? CONFIG.mobileTranslateX
      : viewportWidth < CONFIG.desktopBreakpoint
        ? CONFIG.tabletTranslateX
        : CONFIG.desktopTranslateX;
  }

  // responsive vertical spacing
  function getVerticalSpacing() {
    return viewportWidth < CONFIG.tabletBreakpoint
      ? CONFIG.mobileTranslateY
      : CONFIG.desktopTranslateY;
  }

  /* =========================
     STYLE ENGINE
     ========================= */

  // calculate visual styles
  // based on distance from center
  function calculateCarouselStyles(distanceFromCenter) {
    // convert negative distance
    // into positive value
    const absoluteDistanceFromCenter = Math.abs(distanceFromCenter);

    // smooth depth animation
    const depthFactor = getDepthFactor(absoluteDistanceFromCenter);

    // responsive spacing
    const horizontalSpacing = getHorizontalSpacing();

    return {
      // farther cards become transparent
      opacity: depthFactor,

      // centered card becomes larger
      scale: 0.5 + depthFactor * 0.4,

      // horizontal positioning
      translateX:
        distanceFromCenter * 30 +
        Math.sign(distanceFromCenter) * (1 - depthFactor) * horizontalSpacing,

      // vertical positioning
      translateY: absoluteDistanceFromCenter * getVerticalSpacing(),

      // 3D rotation
      rotateY:
        -Math.sign(distanceFromCenter) *
        (1 - depthFactor) *
        CONFIG.rotationStrength,

      // stacking order
      zIndex: CONFIG.maxZIndex - absoluteDistanceFromCenter,

      // hide distant cards
      isVisible: absoluteDistanceFromCenter <= CONFIG.visibleCards,
    };
  }

  // apply styles into DOM element
  function renderCarouselStyles(carouselCard, visualStyles) {
    // transparency
    carouselCard.style.opacity = visualStyles.opacity;

    // stacking order
    carouselCard.style.zIndex = visualStyles.zIndex;

    // transform animation
    carouselCard.style.transform = `
      translateX(${visualStyles.translateX}px)
      translateY(${visualStyles.translateY}px)
      scale(${visualStyles.scale})
      rotateY(${visualStyles.rotateY}deg)
    `;

    // hide invisible cards
    carouselCard.classList.toggle("invisible", !visualStyles.isVisible);

    // disable interaction on hidden cards
    carouselCard.classList.toggle(
      "pointer-events-none",
      !visualStyles.isVisible,
    );
  }

  /* =========================
     RENDER ENGINE
     ========================= */

  // render all carousel cards
  function renderCarousel(activeSlideIndex) {
    carouselCards.forEach((carouselCard, carouselIndex) => {
      // calculate distance from center
      const distanceFromCenter = carouselIndex - activeSlideIndex;

      // generate visual styles
      const visualStyles = calculateCarouselStyles(distanceFromCenter);

      // apply styles
      renderCarouselStyles(carouselCard, visualStyles);
    });
  }

  /* =========================
     BACKGROUND SLIDES
     ========================= */

  // update background slide visibility
  function renderBackgroundSlides(activeSlideIndex) {
    backgroundSlides.forEach((backgroundSlide, backgroundIndex) => {
      // check active slide
      const isActiveSlide = backgroundIndex === activeSlideIndex;

      // visibility
      backgroundSlide.style.opacity = isActiveSlide ? "1" : "0";

      // stacking order
      backgroundSlide.style.zIndex = isActiveSlide ? "10" : "0";
    });
  }

  /* =========================
     MAIN UPDATE FUNCTION
     ========================= */

  // central update pipeline
  function setActiveSlide(slideIndex) {
    // update state
    state.activeSlideIndex = slideIndex;

    // update background
    renderBackgroundSlides(slideIndex);

    // update carousel
    renderCarousel(slideIndex);

    // update dots
    renderActivePaginationDot();
  }

  /* =========================
     CARD CLICK EVENTS
     ========================= */

  // clicking card makes it active
  carouselCards.forEach((carouselCard, carouselIndex) => {
    carouselCard.addEventListener("click", () => {
      setActiveSlide(carouselIndex);
    });
  });

  /* =========================
     NAVIGATION BUTTONS
     ========================= */

  const previousButton = document.querySelector("#prevMenu");

  const nextButton = document.querySelector("#nextMenu");

  // next slide
  nextButton.addEventListener("click", () => {
    setActiveSlide(getWrappedSlideIndex(state.activeSlideIndex + 1));
  });

  // previous slide
  previousButton.addEventListener("click", () => {
    setActiveSlide(getWrappedSlideIndex(state.activeSlideIndex - 1));
  });

  /* =========================
     INITIALIZATION
     ========================= */

  // render initial carousel state
  setActiveSlide(initialActiveSlideIndex);

  /* =========================
     RESPONSIVE UPDATE
     ========================= */

  // rerender carousel on resize
  window.addEventListener("resize", () => {
    renderCarousel(state.activeSlideIndex);
  });
});
