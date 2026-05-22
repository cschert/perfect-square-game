const gameArea = document.getElementById("gameArea");
const rectangle = document.getElementById("rectangle");
const startBtn = document.getElementById("startBtn");
const timeDisplay = document.getElementById("time");
const scoreDisplay = document.getElementById("score");
const message = document.getElementById("message");
const dimensions = document.getElementById("dimensions");

const comparison = document.getElementById("comparison");
const widthTrack = document.getElementById("widthTrack");
const heightTrack = document.getElementById("heightTrack");
const widthLine = document.getElementById("widthLine");
const heightLine = document.getElementById("heightLine");
const widthValue = document.getElementById("widthValue");
const heightValue = document.getElementById("heightValue");
const differenceText = document.getElementById("differenceText");

let isPlaying = false;
let isDrawing = false;
let startX = 0;
let startY = 0;
let timeLeft = 10;
let timer = null;

startBtn.addEventListener("click", startGame);

function startGame() {
  isPlaying = true;
  isDrawing = false;
  timeLeft = 10;

  scoreDisplay.textContent = "--";
  timeDisplay.textContent = timeLeft.toFixed(1);
  message.textContent = "Draw your square!";
  dimensions.textContent = "";

  rectangle.classList.remove("rectangle-fade");
  rectangle.style.display = "none";
  rectangle.style.opacity = "1";
  rectangle.style.width = "0px";
  rectangle.style.height = "0px";

  comparison.classList.add("hidden");

  widthLine.style.width = "0px";
  heightLine.style.width = "0px";
  widthLine.style.opacity = "0";
  heightLine.style.opacity = "0";

  widthValue.textContent = "0px";
  heightValue.textContent = "0px";
  differenceText.textContent = "";

  removeOldFloatingLines();

  startBtn.textContent = "Restart";

  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft -= 0.1;
    timeDisplay.textContent = Math.max(timeLeft, 0).toFixed(1);

    if (timeLeft <= 0) {
      endGameFromTimer();
    }
  }, 100);
}

function endGameFromTimer() {
  clearInterval(timer);
  isPlaying = false;
  isDrawing = false;
  message.textContent = "Time is up! Press Restart to try again.";
}

gameArea.addEventListener("pointerdown", (event) => {
  if (!isPlaying) return;

  isDrawing = true;

  const areaRect = gameArea.getBoundingClientRect();

  startX = event.clientX - areaRect.left;
  startY = event.clientY - areaRect.top;

  rectangle.classList.remove("rectangle-fade");
  rectangle.style.opacity = "1";
  rectangle.style.left = startX + "px";
  rectangle.style.top = startY + "px";
  rectangle.style.width = "0px";
  rectangle.style.height = "0px";
  rectangle.style.display = "block";

  gameArea.setPointerCapture(event.pointerId);
});

gameArea.addEventListener("pointermove", (event) => {
  if (!isDrawing || !isPlaying) return;

  const areaRect = gameArea.getBoundingClientRect();

  const currentX = event.clientX - areaRect.left;
  const currentY = event.clientY - areaRect.top;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);

  rectangle.style.left = left + "px";
  rectangle.style.top = top + "px";
  rectangle.style.width = width + "px";
  rectangle.style.height = height + "px";
});

gameArea.addEventListener("pointerup", () => {
  finishDrawing();
});

gameArea.addEventListener("pointercancel", () => {
  finishDrawing();
});

function finishDrawing() {
  if (!isDrawing || !isPlaying) return;

  isDrawing = false;
  clearInterval(timer);
  isPlaying = false;

  const drawnRect = rectangle.getBoundingClientRect();

  const width = drawnRect.width;
  const height = drawnRect.height;

  const score = calculateSquareScore(width, height);

  scoreDisplay.textContent = score.toFixed(3) + "%";
  dimensions.textContent = `Width: ${width.toFixed(2)}px | Height: ${height.toFixed(2)}px`;

  setResultMessage(score);
  prepareComparisonPanel(width, height);
  animateRectangleBreakApart(drawnRect, width, height);
}

function calculateSquareScore(width, height) {
  if (width <= 0 || height <= 0) {
    return 0;
  }

  const shorterSide = Math.min(width, height);
  const longerSide = Math.max(width, height);

  return (shorterSide / longerSide) * 100;
}

function setResultMessage(score) {
  if (score >= 99.999) {
    message.textContent = "Perfect. Literally perfect.";
  } else if (score >= 98) {
    message.textContent = "Insanely close!";
  } else if (score >= 90) {
    message.textContent = "Great square!";
  } else if (score >= 75) {
    message.textContent = "Pretty good, but not quite square.";
  } else {
    message.textContent = "That was... spiritually a rectangle.";
  }
}

function prepareComparisonPanel(width, height) {
  comparison.classList.remove("hidden");

  widthLine.style.width = "0px";
  heightLine.style.width = "0px";
  widthLine.style.opacity = "0";
  heightLine.style.opacity = "0";

  widthValue.textContent = width.toFixed(2) + "px";
  heightValue.textContent = height.toFixed(2) + "px";

  const difference = Math.abs(width - height);

  if (width > height) {
    differenceText.textContent = `Difference: ${difference.toFixed(2)}px. Your square was too wide.`;
  } else if (height > width) {
    differenceText.textContent = `Difference: ${difference.toFixed(2)}px. Your square was too tall.`;
  } else {
    differenceText.textContent = "Difference: 0.00px. A perfect square.";
  }
}

function animateRectangleBreakApart(drawnRect, width, height) {
  removeOldFloatingLines();

  if (width <= 0 || height <= 0) return;

  const widthTrackRect = widthTrack.getBoundingClientRect();
  const heightTrackRect = heightTrack.getBoundingClientRect();

  const maxSide = Math.max(width, height);

  const finalWidthLineWidth = (width / maxSide) * widthTrackRect.width;
  const finalHeightLineWidth = (height / maxSide) * heightTrackRect.width;

  const borderThickness = 3;

  const floatingWidth = createFloatingLine({
    className: "floating-width",
    left: drawnRect.left,
    top: drawnRect.top,
    width: width,
    height: borderThickness,
    color: "#3b82f6"
  });

  const floatingHeight = createFloatingLine({
    className: "floating-height",
    left: drawnRect.left,
    top: drawnRect.top,
    width: borderThickness,
    height: height,
    color: "#f97316"
  });

  setTimeout(() => {
    floatingWidth.style.transition = "transform 0.85s ease";
    floatingHeight.style.transition = "transform 0.85s ease";

    floatingWidth.style.transform = "translateY(-34px)";
    floatingHeight.style.transform = "translateX(-34px)";
  }, 80);

  setTimeout(() => {
    rectangle.classList.add("rectangle-fade");
  }, 550);

  setTimeout(() => {
    rectangle.style.display = "none";
  }, 950);

  setTimeout(() => {
    const heightTrackCenterY = heightTrackRect.top + heightTrackRect.height / 2;

    /*
      The height line stays as a vertical line.
      Instead of becoming a horizontal rectangle, it rotates 90 degrees.
      Because it rotates around its center, we position its center carefully.
    */
    const rotatedHeightLeft =
      heightTrackRect.left + finalHeightLineWidth / 2 - borderThickness / 2;

    const rotatedHeightTop =
      heightTrackCenterY - finalHeightLineWidth / 2;

    floatingWidth.style.transition =
      "left 2.1s ease-in-out, top 2.1s ease-in-out, width 2.1s ease-in-out, transform 2.1s ease-in-out, opacity 0.45s ease";

    floatingHeight.style.transition =
      "left 2.1s ease-in-out, top 2.1s ease-in-out, height 2.1s ease-in-out, transform 2.1s ease-in-out, opacity 0.45s ease";

    floatingWidth.style.left = widthTrackRect.left + "px";
    floatingWidth.style.top =
      widthTrackRect.top + widthTrackRect.height / 2 - borderThickness / 2 + "px";
    floatingWidth.style.width = finalWidthLineWidth + "px";
    floatingWidth.style.height = borderThickness + "px";
    floatingWidth.style.transform = "translateY(0)";

    floatingHeight.style.left = rotatedHeightLeft + "px";
    floatingHeight.style.top = rotatedHeightTop + "px";
    floatingHeight.style.width = borderThickness + "px";
    floatingHeight.style.height = finalHeightLineWidth + "px";
    floatingHeight.style.transform = "translateX(0) rotate(90deg)";
  }, 1100);

  setTimeout(() => {
    widthLine.style.width = finalWidthLineWidth + "px";
    heightLine.style.width = finalHeightLineWidth + "px";
    widthLine.style.opacity = "1";
    heightLine.style.opacity = "1";

    floatingWidth.style.opacity = "0";
    floatingHeight.style.opacity = "0";
  }, 3200);

  setTimeout(() => {
    floatingWidth.remove();
    floatingHeight.remove();
  }, 3700);
}
function createFloatingLine({ className, left, top, width, height, color }) {
  const line = document.createElement("div");

  line.classList.add("floating-line", className);
  line.style.left = left + "px";
  line.style.top = top + "px";
  line.style.width = width + "px";
  line.style.height = height + "px";
  line.style.opacity = "1";
  line.style.background = color;
  line.style.transform = "translate(0, 0)";

  document.body.appendChild(line);

  return line;
}

function removeOldFloatingLines() {
  document.querySelectorAll(".floating-line").forEach((line) => {
    line.remove();
  });
}