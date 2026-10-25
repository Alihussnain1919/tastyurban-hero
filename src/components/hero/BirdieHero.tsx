
import { useEffect, useRef } from "react";

const BRAND_TEXT = "BIRDIE BIRDIE";
const PARTICLE_COUNT = 900;
const SAMPLE_STEP = 4;
const FRAME_INTERVAL = 1000 / 40;

type Point = {
  x: number;
  y: number;
};

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  phase: number;
};

function generateTextTargets(
  width: number,
  height: number,
  count: number
): Point[] {
  const textCanvas = document.createElement("canvas");

  textCanvas.width = Math.max(1, Math.ceil(width));
  textCanvas.height = Math.max(1, Math.ceil(height));

  const textCtx = textCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!textCtx) return [];

  const mobile = width < 760;
  const maxTextWidth = width * (mobile ? 0.9 : 0.57);

  const fontSize = Math.max(
    16,
    Math.min(
      width * (mobile ? 0.095 : 0.075),
      height * (mobile ? 0.1 : 0.18),
      maxTextWidth / (BRAND_TEXT.length * 0.62)
    )
  );

  const centerX = mobile ? width * 0.5 : width * 0.72;
  const centerY = mobile ? height * 0.76 : height * 0.52;

  textCtx.clearRect(0, 0, width, height);
  textCtx.fillStyle = "#ffffff";
  textCtx.textAlign = "center";
  textCtx.textBaseline = "middle";
  textCtx.font = `900 ${fontSize}px Arial, sans-serif`;

  textCtx.fillText(
    BRAND_TEXT,
    centerX,
    centerY,
    maxTextWidth
  );

  const pixels = textCtx.getImageData(
    0,
    0,
    textCanvas.width,
    textCanvas.height
  ).data;

  const points: Point[] = [];

  for (let y = 0; y < textCanvas.height; y += SAMPLE_STEP) {
    for (let x = 0; x < textCanvas.width; x += SAMPLE_STEP) {
      const alphaIndex = (y * textCanvas.width + x) * 4 + 3;

      if (pixels[alphaIndex] > 100) {
        points.push({ x, y });
      }
    }
  }

  // Shuffle points to distribute particles across the letters.
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  if (points.length === 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const pointIndex = Math.floor(
      (index * points.length) / count
    );

    return points[Math.min(pointIndex, points.length - 1)];
  });
}

export default function BirdieHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
  const canvasRefValue = canvasRef.current;
if (!canvasRefValue) return;

// Explicit non-null types remain safe inside nested animation functions.
const canvas: HTMLCanvasElement = canvasRefValue;

const contextMaybe = canvas.getContext("2d", { alpha: true });

if (!contextMaybe) {
  console.error(
    "BirdieHero: Unable to initialize the 2D canvas context."
  );
  return;
}

const ctx: CanvasRenderingContext2D = contextMaybe;
    

    let width = 1;
    let height = 1;
    let dpr = 1;

    let animationFrame = 0;
    let lastFrame = 0;
    let gradient: CanvasGradient | null = null;

    let disposed = false;
    let running = false;
    let inView = true;
    let pageVisible = !document.hidden;

    let mouseX = -10000;
    let mouseY = -10000;
    let mouseActive = false;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const birds: Bird[] = Array.from(
      { length: PARTICLE_COUNT },
      () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        tx: 0,
        ty: 0,
        size: 1.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      })
    );

    // Draw all bird shapes in a single canvas stroke.
    // Avoid per-particle shadowBlur and repeated save/restore calls.
    function drawParticles() {
      if (!gradient) return;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.35;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.92;

      ctx.beginPath();

      for (const bird of birds) {
        const speed = Math.hypot(bird.vx, bird.vy);

        const angle =
          speed > 0.05 ? Math.atan2(bird.vy, bird.vx) : 0;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const s = bird.size;

        // First wing.
        const x1 = bird.x - s * cos + s * sin;
        const y1 = bird.y - s * sin - s * cos;

        // Center of the bird.
        const x2 = bird.x + s * 1.2 * cos;
        const y2 = bird.y + s * 1.2 * sin;

        // Second wing.
        const x3 = bird.x - s * cos - s * sin;
        const y3 = bird.y - s * sin + s * cos;

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function resize() {
      if (disposed) return;

      const previousWidth = width;
      const previousHeight = height;
      const rect = canvas.parentElement?.getBoundingClientRect();

      width = Math.max(1, rect?.width ?? window.innerWidth);
      height = Math.max(1, rect?.height ?? window.innerHeight);

      // Lower the resolution cost on high-DPI displays.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      // Reset the transform instead of accumulating scaling.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      gradient = ctx.createLinearGradient(
        0,
        0,
        width,
        height
      );

      gradient.addColorStop(0, "#fffaf0");
      gradient.addColorStop(0.5, "#ffe5ad");
      gradient.addColorStop(1, "#fff3df");

      const targets = generateTextTargets(
        width,
        height,
        PARTICLE_COUNT
      );

      birds.forEach((bird, index) => {
        if (previousWidth > 1 && previousHeight > 1) {
          bird.x *= width / previousWidth;
          bird.y *= height / previousHeight;
        }

        bird.tx = targets[index]?.x ?? width * 0.5;
        bird.ty = targets[index]?.y ?? height * 0.5;

        if (reduceMotion) {
          bird.x = bird.tx;
          bird.y = bird.ty;
          bird.vx = 0;
          bird.vy = 0;
        }
      });

      // Redraw immediately after resizing, including reduced-motion mode.
      drawParticles();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();

      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;

      mouseActive =
        mouseX >= 0 &&
        mouseY >= 0 &&
        mouseX <= width &&
        mouseY <= height;
    }

    function animate(time: number) {
      if (!running || disposed) return;

      // Skip particle calculations between render intervals.
      if (lastFrame && time - lastFrame < FRAME_INTERVAL) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      const dt = lastFrame
        ? Math.min((time - lastFrame) / 16.667, 2)
        : 1;

      lastFrame = time;

      for (const bird of birds) {
        const dx = bird.tx - bird.x;
        const dy = bird.ty - bird.y;
        const distance = Math.hypot(dx, dy);

        // Gentle spring attraction toward the brand letters.
        const flutter = distance < 8 ? 0.01 : 0.002;

        bird.vx +=
          dx * 0.018 * dt -
          bird.vx * 0.11 * dt +
          Math.sin(time * 0.0012 + bird.phase) *
            flutter *
            dt;

        bird.vy +=
          dy * 0.018 * dt -
          bird.vy * 0.11 * dt +
          Math.cos(time * 0.001 + bird.phase) *
            flutter *
            dt;

        // Mouse movement briefly pushes nearby particles away.
        if (mouseActive) {
          const mx = bird.x - mouseX;
          const my = bird.y - mouseY;
          const mouseDistance = Math.hypot(mx, my);
          const radius = 180;

          if (mouseDistance > 0 && mouseDistance < radius) {
            const force =
              (1 - mouseDistance / radius) * 1.2;

            bird.vx += (mx / mouseDistance) * force * dt;
            bird.vy += (my / mouseDistance) * force * dt;
          }
        }

        // Keep movement stable.
        const speed = Math.hypot(bird.vx, bird.vy);
        const maxSpeed = 5;

        if (speed > maxSpeed) {
          bird.vx = (bird.vx / speed) * maxSpeed;
          bird.vy = (bird.vy / speed) * maxSpeed;
        }

        bird.x += bird.vx * dt;
        bird.y += bird.vy * dt;

        if (
          distance < 0.25 &&
          Math.abs(bird.vx) < 0.15 &&
          Math.abs(bird.vy) < 0.15
        ) {
          bird.x = bird.tx;
          bird.y = bird.ty;
          bird.vx = 0;
          bird.vy = 0;
        }
      }

      drawParticles();

      animationFrame = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (
        disposed ||
        reduceMotion ||
        running ||
        !pageVisible ||
        !inView
      ) {
        return;
      }

      running = true;
      lastFrame = 0;
      animationFrame = window.requestAnimationFrame(animate);
    }

    function stopAnimation() {
      running = false;

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function onVisibilityChange() {
      pageVisible = !document.hidden;

      if (pageVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }

    resize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resize)
        : null;

    if (canvas.parentElement) {
      resizeObserver?.observe(canvas.parentElement);
    }

    const intersectionObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;

            if (inView) {
              startAnimation();
            } else {
              stopAnimation();
            }
          }, { threshold: 0.01 })
        : null;

    if (canvas.parentElement) {
      intersectionObserver?.observe(canvas.parentElement);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    startAnimation();

    return () => {
      disposed = true;
      stopAnimation();

      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();

      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, []);

  return (
    <section className="birdie-hero" id="top">
      <nav
        className="birdie-hero__nav"
        aria-label="Main navigation"
      >
        <a className="birdie-hero__logo" href="#top">
          birdie <span>birdie</span>
        </a>

        <div className="birdie-hero__links">
          <a href="#burger-build">Build yours</a>
          <a href="#menu">The menu</a>
          <a href="#story">Our crunch</a>
          <a href="#find-us">Find us</a>
        </div>

        <a
          className="birdie-hero__nav-cta"
          href="#customizer"
        >
          Build your Birdie <span aria-hidden="true">→</span>
        </a>
      </nav>

      <canvas
        ref={canvasRef}
        className="birdie-hero__canvas"
        aria-hidden="true"
      />

      <div
        className="birdie-hero__glow"
        aria-hidden="true"
      />
<img
  className="birdie-hero__chicken"
  src="/images/videos/birdie-chicken-transparent.webp"
  alt=""
  aria-hidden="true"
  draggable={false}
/>
      <div className="birdie-hero__content">
        <p className="birdie-hero__eyebrow">
          REAL CHICKEN <span>·</span> BIGGER MOMENTS
        </p>

        <h1>
          Real Chicken.
          <br />
          <span>Bigger Moments.</span>
        </h1>

        <p className="birdie-hero__description">
          Signature burgers, crispy tenders and bold flavours.
          Made for the moments that matter.
        </p>

        <a className="birdie-hero__cta" href="#menu">
          Explore Our Menu
          <span aria-hidden="true">→</span>
        </a>

        <div className="birdie-hero__scroll">
          <span aria-hidden="true">↓</span>
          Scroll to explore
        </div>
      </div>
    </section>
  );
}
