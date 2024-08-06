const pathData = [
  {
    d: "",
    name: "",
  },
];

export const htmlString = (data) =>
  `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=1, user-scalable=no">
    <title>Interactive SVG</title>
    <style>
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .blink {
            animation: blink 0.5s infinite;
        }
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            touch-action: none;
            overflow: hidden;
        }
        #svgContainer {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="svgContainer">
        <!-- Insert your SVG code here -->
        <svg id="interactiveSVG" width="100%" height="100%" viewBox="0 -70 700 700">
            ${pathData
              .map(
                (data, i) =>
                  `<path
                  width="50%"
                  height="50%"
                  id="${data.name}"
                  class="${data.name}"
                  d="${data.d}"
                  fill="grey"
                  stroke="black"
                  stroke-width="0.7"
                  pointer-events="all"></path>`
              )
              .join("\n")}
        </svg>
    </div>
    <script>
        const svg = document.getElementById("interactiveSVG");

        let isPointerDown = false;
        let pointers = [];
        let lastDistance = 0;
        let viewBox = svg.viewBox.baseVal;
        let isDragging = false;
        let isWaiting = false;

        const minZoom = 1; // Minimum zoom level (original size)
        const maxZoom = 8; // Maximum zoom level
        const minPanX = -500; // Minimum x pan limit
        const maxPanX = 1200; // Maximum x pan limit
        const minPanY = -570; // Minimum y pan limit
        const maxPanY = 600; // Maximum y pan limit

        function reset() {
            viewBox.x = 0;
            viewBox.y = -70;
            viewBox.width = 700;
            viewBox.height = 700;
            updateViewBox();
        }

        function resetZoomAndPan() {
            const viewBox = svg.viewBox.baseVal;
            const startTime = performance.now();

            function step() {
                const currentTime = performance.now();
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / 1500, 1);

                const currentX = viewBox.x + (0 - viewBox.x) * progress;
                const currentY = viewBox.y + (-70 - viewBox.y) * progress;
                const currentWidth = viewBox.width + (700 - viewBox.width) * progress;
                const currentHeight = viewBox.height + (700 - viewBox.height) * progress;

                viewBox.x = currentX;
                viewBox.y = currentY;
                viewBox.width = currentWidth;
                viewBox.height = currentHeight;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    isWaiting = false;
                }
            }

            requestAnimationFrame(step);
        }

        svg.querySelectorAll("path").forEach((path) => {
            path.addEventListener("click", function (event) {
                window.ReactNativeWebView.postMessage(
                    JSON.stringify({
                        id: event.target.id,
                        class: event.target.className.baseVal,
                    })
                );
            });
        });

        svg.addEventListener("pointerdown", (event) => {
            isPointerDown = true;
            pointers.push(event);
        });

        svg.addEventListener("pointermove", (event) => {
            if (!isPointerDown) return;
            isDragging = true;

            for (let i = 0; i < pointers.length; i++) {
                if (pointers[i].pointerId === event.pointerId) {
                    pointers[i] = event;
                    break;
                }
            }

            if (pointers.length === 2) {
                const distance = getDistance(pointers[0], pointers[1]);
                if (lastDistance) {
                    const scale = distance / lastDistance;
                    zoom(scale);
                }
                lastDistance = distance;
            } else if (pointers.length === 1) {
                const dx = event.movementX;
                const dy = event.movementY;
                pan(dx, dy);
            }
        });

        svg.addEventListener("pointerup", (event) => {
            pointers = pointers.filter((p) => p.pointerId !== event.pointerId);
            if (pointers.length < 2) {
                lastDistance = 0;
            }
            if (pointers.length === 0) {
                isPointerDown = false;
                setTimeout(() => {
                    isDragging = false;
                }, 1);
            }
        });

        svg.addEventListener("pointercancel", (event) => {
            pointers = pointers.filter((p) => p.pointerId !== event.pointerId);
            if (pointers.length < 2) {
                lastDistance = 0;
            }
            if (pointers.length === 0) {
                isPointerDown = false;
                setTimeout(() => {
                    isDragging = false;
                }, 1);
            }
        });

        function getDistance(p1, p2) {
            return Math.sqrt(
                Math.pow(p2.clientX - p1.clientX, 2) +
                Math.pow(p2.clientY - p1.clientY, 2)
            );
        }

        function zoom(scale) {
            const newWidth = viewBox.width / scale;
            const newHeight = viewBox.height / scale;

            // Enforce zoom limits
            if (newWidth < 700 / maxZoom || newHeight < 700 / maxZoom) {
                return;
            }
            if (newWidth > 700 / minZoom || newHeight > 700 / minZoom) {
                return;
            }

            const newX = viewBox.x + (viewBox.width - newWidth) / 2;
            const newY = viewBox.y + (viewBox.height - newHeight) / 2;

            viewBox.x = newX;
            viewBox.y = newY;
            viewBox.width = newWidth;
            viewBox.height = newHeight;
            updateViewBox();
        }

        function pan(dx, dy) {
            const newX = viewBox.x - dx * (viewBox.width / svg.clientWidth);
            const newY = viewBox.y - dy * (viewBox.height / svg.clientHeight);

            // Enforce pan limits
            if (newX < minPanX) {
                viewBox.x = minPanX;
            } else if (newX > maxPanX) {
                viewBox.x = maxPanX;
            } else {
                viewBox.x = newX;
            }

            if (newY < minPanY) {
                viewBox.y = minPanY;
            } else if (newY > maxPanY) {
                viewBox.y = maxPanY;
            } else {
                viewBox.y = newY;
            }

            updateViewBox();
        }

        function updateViewBox() {
            svg.setAttribute("viewBox", viewBox.x + " " + viewBox.y + " " + viewBox.width + " " + viewBox.height);
        }

        // these are to disable mobile browser's own zoom and pan
        document.addEventListener('touchmove', function(event) {
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturestart', function(event) {
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturechange', function(event) {
            event.preventDefault();
        }, { passive: false });

        document.addEventListener('gestureend', function(event) {
            event.preventDefault();
        }, { passive: false });
    </script>
</body>
</html>
`;
