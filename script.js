const gameArea = document.getElementById("gameArea");
const rectangle = document.getElementById("rectangle");
const startBtn = document.getElementById("startBtn");
const timeDisplay = document.getElementById("time");
const scoreDisplay = document.getElementById("score");
const finalScoreDisplay = document.getElementById("finalScore");
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

const classicModeBtn = document.getElementById("classicModeBtn");
const rectangleModeBtn = document.getElementById("rectangleModeBtn");
const gauntletModeBtn = document.getElementById("gauntletModeBtn");
const modeInstructions = document.getElementById("modeInstructions");

const scoreLabel = scoreDisplay.previousElementSibling;
const finalScoreLabel = finalScoreDisplay.previousElementSibling;

let currentMode = "classic";

let isPlaying = false;
let isDrawing = false;
let hasFinishedRound = false;
let startX = 0;
let startY = 0;
let timeLeft = 10;
let timer = null;

const GAME_TIME_SECONDS = 10;
const GAUNTLET_START_TIME_SECONDS = 5;
const GAUNTLET_MIN_TIME_SECONDS = 1;
const MIN_SIDE_PIXELS = 80;
const GAUNTLET_TARGETS = [80, 85, 90, 95, 96, 97, 98, 99];

let gauntletScore = 0;
let gauntletTargetIndex = 0;
let gauntletCurrentTimeLimit = GAUNTLET_START_TIME_SECONDS;

const gauntletTargetDisplay = createGauntletTargetDisplay();
injectGauntletTargetStyles();

startBtn.addEventListener("click", () => {
  startGame();
});

classicModeBtn.addEventListener("click", () => {
  switchMode("classic");
});

rectangleModeBtn.addEventListener("click", () => {
  switchMode("rectangle");
});

gauntletModeBtn.addEventListener("click", () => {
  switchMode("gauntlet");
});

function createGauntletTargetDisplay() {
  let display = document.getElementById("gauntletTargetDisplay");

  if (!display) {
    display = document.createElement("div");
    display.id = "gauntletTargetDisplay";
    display.classList.add("gauntlet-target", "hidden");
    display.textContent = "80%";
    gameArea.prepend(display);
  }

  return display;
}

function injectGauntletTargetStyles() {
  const style = document.createElement("style");

  style.textContent = `
    .gauntlet-target {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(80px, 18vw, 180px);
      font-weight: 900;
      color: rgba(17, 24, 39, 0.16);
      pointer-events: none;
      z-index: 1;
      user-select: none;
    }

    .gauntlet-target.hidden {
      display: none;
    }

    .gauntlet-target.flash-target {
      animation: targetFlash 0.35s ease;
    }

    @keyframes targetFlash {
      0% {
        transform: scale(0.92);
        opacity: 0.45;
      }

      60% {
        transform: scale(1.08);
        opacity: 1;
      }

      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    #rectangle {
      z-index: 2;
    }
  `;

  document.head.appendChild(style);
}

function switchMode(mode) {
  currentMode = mode;

  classicModeBtn.classList.remove("active-mode");
  rectangleModeBtn.classList.remove("active-mode");
  gauntletModeBtn.classList.remove("active-mode");

  if (currentMode === "classic") {
    classicModeBtn.classList.add("active-mode");
    modeInstructions.textContent =
      "Classic mode: Draw the most perfect square you can. Width and height should match.";
  }

  if (currentMode === "rectangle") {
    rectangleModeBtn.classList.add("active-mode");
    modeInstructions.textContent =
      "Rectangle mode: Draw a perfect 2:1 rectangle. The longer side should be exactly twice the shorter side.";
  }

  if (currentMode === "gauntlet") {
    gauntletModeBtn.classList.add("active-mode");
    modeInstructions.textContent =
      "Square Gauntlet: Start at 80% perfection and climb through 85%, 90%, 95%, 96%, 97%, 98%, and 99%. You have 5 seconds per square.";
  }

  resetRoundDisplay();
}

function getCurrentModeName() {
  if (currentMode === "rectangle") {
    return "rectangle";
  }

  return "square";
}

function getCurrentTimeLimit() {
  if (currentMode === "gauntlet") {
    return gauntletCurrentTimeLimit;
  }

  return GAME_TIME_SECONDS;
}

function getGauntletTarget() {
  return GAUNTLET_TARGETS[gauntletTargetIndex];
}

function updateGauntletTargetDisplay() {
  if (currentMode !== "gauntlet") {
    hideGauntletTargetDisplay();
    return;
  }

  gauntletTargetDisplay.classList.remove("hidden");
  gauntletTargetDisplay.textContent = getGauntletTarget() + "%";

  gauntletTargetDisplay.classList.remove("flash-target");

  requestAnimationFrame(() => {
    gauntletTargetDisplay.classList.add("flash-target");
  });
}

function hideGauntletTargetDisplay() {
  gauntletTargetDisplay.classList.add("hidden");
  gauntletTargetDisplay.classList.remove("flash-target");
}

function startGame() {
  isPlaying = true;
  isDrawing = false;
  hasFinishedRound = false;

  if (currentMode === "gauntlet") {
    gauntletScore = 0;
    gauntletTargetIndex = 0;
    gauntletCurrentTimeLimit = GAUNTLET_START_TIME_SECONDS;
  }

  startRoundTimer(getCurrentTimeLimit());
  resetShapeAndComparison();

  scoreDisplay.textContent = "--";

  if (currentMode === "gauntlet") {
    scoreLabel.textContent = "Perfection";
    finalScoreLabel.textContent = "Gauntlet Score";
    finalScoreDisplay.textContent = gauntletScore;
    message.textContent = `Square Gauntlet: Hit at least ${getGauntletTarget()}% perfection.`;
    dimensions.textContent = `Target: ${getGauntletTarget()}% | Time limit: ${gauntletCurrentTimeLimit.toFixed(1)}s`;
    updateGauntletTargetDisplay();
  } else {
    hideGauntletTargetDisplay();

    scoreLabel.textContent = "Perfection";
    finalScoreLabel.textContent = "Leaderboard Score";
    finalScoreDisplay.textContent = "--";

    if (currentMode === "classic") {
      message.textContent = "Draw your square!";
    } else {
      message.textContent = "Draw your 2:1 rectangle!";
    }

    dimensions.textContent = "";
  }

  startBtn.textContent = "Restart";
}

function startRoundTimer(seconds) {
  clearInterval(timer);

  timeLeft = seconds;
  timeDisplay.textContent = timeLeft.toFixed(1);

  timer = setInterval(() => {
    timeLeft -= 0.1;
    timeDisplay.textContent = Math.max(timeLeft, 0).toFixed(1);

    if (timeLeft <= 0) {
      endGameFromTimer();
    }
  }, 100);
}

function resetShapeAndComparison() {
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
}

function resetRoundDisplay() {
  isPlaying = false;
  isDrawing = false;
  hasFinishedRound = false;

  clearInterval(timer);

  if (currentMode === "gauntlet") {
    gauntletScore = 0;
    gauntletTargetIndex = 0;
    gauntletCurrentTimeLimit = GAUNTLET_START_TIME_SECONDS;
    timeLeft = gauntletCurrentTimeLimit;
    scoreLabel.textContent = "Perfection";
    finalScoreLabel.textContent = "Gauntlet Score";
    finalScoreDisplay.textContent = "0";
    message.textContent =
      "Press Start Game, then survive the Square Gauntlet. First target: 80%.";
    dimensions.textContent = "Pass each square to move instantly to the next target.";
    updateGauntletTargetDisplay();
  } else {
    hideGauntletTargetDisplay();

    timeLeft = GAME_TIME_SECONDS;
    scoreLabel.textContent = "Perfection";
    finalScoreLabel.textContent = "Leaderboard Score";
    finalScoreDisplay.textContent = "--";
    dimensions.textContent = "";

    if (currentMode === "classic") {
      message.textContent = "Press Start Game, then draw the most perfect square you can.";
    } else {
      message.textContent =
        "Press Start Game, then draw a 2:1 rectangle. The longer side should be twice the shorter side.";
    }
  }

  timeDisplay.textContent = timeLeft.toFixed(1);
  scoreDisplay.textContent = "--";

  resetShapeAndComparison();

  startBtn.textContent = "Start Game";
}

function endGameFromTimer() {
  clearInterval(timer);
  isPlaying = false;
  isDrawing = false;

  if (!hasFinishedRound) {
    if (currentMode === "gauntlet") {
      message.textContent = `Time is up! Final Gauntlet Score: ${gauntletScore}.`;
      dimensions.textContent = `You reached the ${getGauntletTarget()}% target. Press Restart or drag again to retry.`;
    } else {
      message.textContent = "Time is up! Press Restart or drag again to try again.";
    }
  }
}

gameArea.addEventListener("pointerdown", (event) => {
  if (!isPlaying || hasFinishedRound) {
    startGame();
  }

  beginDrawing(event);
});

function beginDrawing(event) {
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

  comparison.classList.add("hidden");
  widthLine.style.width = "0px";
  heightLine.style.width = "0px";
  widthLine.style.opacity = "0";
  heightLine.style.opacity = "0";
  differenceText.textContent = "";
  dimensions.textContent = "";
  scoreDisplay.textContent = "--";

  if (currentMode !== "gauntlet") {
    finalScoreDisplay.textContent = "--";
  }

  removeOldFloatingLines();

  gameArea.setPointerCapture(event.pointerId);
}

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

  const drawnRect = rectangle.getBoundingClientRect();

  const width = drawnRect.width;
  const height = drawnRect.height;

  const smallerSide = Math.min(width, height);

  if (smallerSide < MIN_SIDE_PIXELS) {
    message.textContent = `Too small! Make the shorter side at least ${MIN_SIDE_PIXELS}px. Keep going.`;
    dimensions.textContent = `Current attempt: ${width.toFixed(2)}px × ${height.toFixed(2)}px`;
    scoreDisplay.textContent = "--";

    rectangle.style.display = "none";
    comparison.classList.add("hidden");

    return;
  }

  if (currentMode === "gauntlet") {
    finishGauntletAttempt(width, height);
    return;
  }

  clearInterval(timer);
  isPlaying = false;
  hasFinishedRound = true;

  const perfectionScore = calculateModeScore(width, height);
  const speedScore = calculateSpeedScore(timeLeft);
  const leaderboardScore = calculateLeaderboardScore(perfectionScore, speedScore);

  const timeUsed = getCurrentTimeLimit() - Math.max(timeLeft, 0);

  scoreDisplay.textContent = perfectionScore.toFixed(3) + "%";
  finalScoreDisplay.textContent = leaderboardScore.toFixed(3);

  dimensions.textContent =
    `Width: ${width.toFixed(2)}px | Height: ${height.toFixed(2)}px | Time: ${timeUsed.toFixed(2)}s`;

  setResultMessage(perfectionScore, leaderboardScore);
  prepareComparisonPanel(width, height, speedScore, leaderboardScore);
  animateRectangleBreakApart(drawnRect, width, height);
}

function finishGauntletAttempt(width, height) {
  const perfectionScore = calculateSquareScore(width, height);
  const target = getGauntletTarget();

  scoreDisplay.textContent = perfectionScore.toFixed(3) + "%";

  if (perfectionScore >= target) {
    gauntletScore += 1;
    finalScoreDisplay.textContent = gauntletScore;

    advanceGauntletTarget();
    updateGauntletTargetDisplay();

    message.textContent =
      `Passed with ${perfectionScore.toFixed(3)}%! Next target: ${getGauntletTarget()}%.`;

    dimensions.textContent =
      `Gauntlet Score: ${gauntletScore} | Time limit: ${gauntletCurrentTimeLimit.toFixed(1)}s`;

    rectangle.style.display = "none";
    comparison.classList.add("hidden");
    removeOldFloatingLines();

    startRoundTimer(gauntletCurrentTimeLimit);
    isPlaying = true;
    isDrawing = false;
    hasFinishedRound = false;

    return;
  }

  clearInterval(timer);
  isPlaying = false;
  hasFinishedRound = true;

  message.textContent =
    `Gauntlet over. You needed ${target}% but got ${perfectionScore.toFixed(3)}%. Final score: ${gauntletScore}.`;

  dimensions.textContent =
    `Final Gauntlet Score: ${gauntletScore} | Last target: ${target}% | Press Restart or drag again to retry.`;
}

function advanceGauntletTarget() {
  if (gauntletTargetIndex < GAUNTLET_TARGETS.length - 1) {
    gauntletTargetIndex += 1;
    return;
  }

  gauntletCurrentTimeLimit = Math.max(
    GAUNTLET_MIN_TIME_SECONDS,
    gauntletCurrentTimeLimit - 0.5
  );
}

function calculateModeScore(width, height) {
  if (currentMode === "rectangle") {
    return calculateRectangleScore(width, height);
  }

  return calculateSquareScore(width, height);
}

function calculateSquareScore(width, height) {
  if (width <= 0 || height <= 0) {
    return 0;
  }

  const shorterSide = Math.min(width, height);
  const longerSide = Math.max(width, height);

  return (shorterSide / longerSide) * 100;
}

function calculateRectangleScore(width, height) {
  if (width <= 0 || height <= 0) {
    return 0;
  }

  const shorterSide = Math.min(width, height);
  const longerSide = Math.max(width, height);

  const actualRatio = longerSide / shorterSide;
  const targetRatio = 2;

  const error = Math.abs(actualRatio - targetRatio) / targetRatio;
  const score = Math.max(0, (1 - error) * 100);

  return score;
}

function calculateSpeedScore(timeRemaining) {
  const safeTimeRemaining = Math.max(timeRemaining, 0);
  return (safeTimeRemaining / getCurrentTimeLimit()) * 100;
}

function calculateLeaderboardScore(perfectionScore, speedScore) {
  return (perfectionScore * 0.75) + (speedScore * 0.25);
}

function setResultMessage(perfectionScore, leaderboardScore) {
  const shapeName = getCurrentModeName();

  if (perfectionScore >= 99.999) {
    message.textContent = `Perfect. Literally perfect ${shapeName}. Leaderboard score: ${leaderboardScore.toFixed(3)}.`;
  } else if (perfectionScore >= 98) {
    message.textContent = `Insanely close ${shapeName}! Leaderboard score: ${leaderboardScore.toFixed(3)}.`;
  } else if (perfectionScore >= 90) {
    message.textContent = `Great ${shapeName}! Leaderboard score: ${leaderboardScore.toFixed(3)}.`;
  } else if (perfectionScore >= 75) {
    message.textContent = `Pretty good, but not quite perfect. Leaderboard score: ${leaderboardScore.toFixed(3)}.`;
  } else {
    message.textContent = `That was... spiritually a ${shapeName}. Leaderboard score: ${leaderboardScore.toFixed(3)}.`;
  }
}

function prepareComparisonPanel(width, height, speedScore, leaderboardScore) {
  comparison.classList.remove("hidden");

  removeOldFloatingLines();

  widthLine.style.transition = "none";
  heightLine.style.transition = "none";

  widthLine.style.width = "0px";
  heightLine.style.width = "0px";
  widthLine.style.opacity = "0";
  heightLine.style.opacity = "0";

  const labels = comparison.querySelectorAll(".line-label");

  if (currentMode === "rectangle") {
    const shorterSide = Math.min(width, height);
    const longerSide = Math.max(width, height);
    const doubledShortSide = shorterSide * 2;
    const ratioDifferencePixels = Math.abs(longerSide - doubledShortSide);
    const actualRatio = longerSide / shorterSide;

    labels[0].textContent = "Long side";
    labels[1].textContent = "Short × 2";

    widthValue.textContent = longerSide.toFixed(2) + "px";
    heightValue.textContent =
      `${shorterSide.toFixed(2)}px × 2 = ${doubledShortSide.toFixed(2)}px`;

    differenceText.textContent =
      `Ratio: ${actualRatio.toFixed(3)}:1. Target: 2:1. Doubled-short difference: ${ratioDifferencePixels.toFixed(2)}px. Speed score: ${speedScore.toFixed(3)}. Final score: ${leaderboardScore.toFixed(3)}.`;

    return;
  }

  labels[0].textContent = "Width";
  labels[1].textContent = "Height";

  widthValue.textContent = width.toFixed(2) + "px";
  heightValue.textContent = height.toFixed(2) + "px";

  const difference = Math.abs(width - height);

  if (width > height) {
    differenceText.textContent =
      `Difference: ${difference.toFixed(2)}px. Your square was too wide. Speed score: ${speedScore.toFixed(3)}. Final score: ${leaderboardScore.toFixed(3)}.`;
  } else if (height > width) {
    differenceText.textContent =
      `Difference: ${difference.toFixed(2)}px. Your square was too tall. Speed score: ${speedScore.toFixed(3)}. Final score: ${leaderboardScore.toFixed(3)}.`;
  } else {
    differenceText.textContent =
      `Difference: 0.00px. A perfect square. Speed score: ${speedScore.toFixed(3)}. Final score: ${leaderboardScore.toFixed(3)}.`;
  }
}

function animateRectangleBreakApart(drawnRect, width, height) {
  if (currentMode === "rectangle") {
    animateRectangleRatioBreakApart(drawnRect, width, height);
    return;
  }

  animateClassicBreakApart(drawnRect, width, height);
}

function animateClassicBreakApart(drawnRect, width, height) {
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
    const heightTrackCenterY = heightTrackRect.top + heightTrackRect.height / 2;

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
    widthLine.style.transition = "none";
    heightLine.style.transition = "none";

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

function animateRectangleRatioBreakApart(drawnRect, width, height) {
  removeOldFloatingLines();

  if (width <= 0 || height <= 0) return;

  const longTrackRect = widthTrack.getBoundingClientRect();
  const shortTrackRect = heightTrack.getBoundingClientRect();

  const borderThickness = 3;

  const isWide = width >= height;

  const longerSide = Math.max(width, height);
  const shorterSide = Math.min(width, height);
  const doubledShortSide = shorterSide * 2;

  const scaleMax = Math.max(longerSide, doubledShortSide);

  const finalLongLineWidth = (longerSide / scaleMax) * longTrackRect.width;
  const finalShortLineWidth = (shorterSide / scaleMax) * shortTrackRect.width;
  const finalDoubledShortLineWidth =
    (doubledShortSide / scaleMax) * shortTrackRect.width;

  const floatingLong = createFloatingLine({
    className: "floating-width",
    left: drawnRect.left,
    top: drawnRect.top,
    width: isWide ? width : borderThickness,
    height: isWide ? borderThickness : height,
    color: "#3b82f6"
  });

  const floatingShort = createFloatingLine({
    className: "floating-height",
    left: drawnRect.left,
    top: drawnRect.top,
    width: isWide ? borderThickness : width,
    height: isWide ? height : borderThickness,
    color: "#f97316"
  });

  setTimeout(() => {
    floatingLong.style.transition = "transform 0.85s ease";
    floatingShort.style.transition = "transform 0.85s ease";

    floatingLong.style.transform = isWide
      ? "translateY(-34px)"
      : "translateX(-34px)";

    floatingShort.style.transform = isWide
      ? "translateX(-34px)"
      : "translateY(-34px)";
  }, 80);

  setTimeout(() => {
    moveFloatingLineToTrack({
      line: floatingLong,
      trackRect: longTrackRect,
      finalWidth: finalLongLineWidth,
      borderThickness,
      startsVertical: !isWide
    });

    moveFloatingLineToTrack({
      line: floatingShort,
      trackRect: shortTrackRect,
      finalWidth: finalShortLineWidth,
      borderThickness,
      startsVertical: isWide
    });
  }, 1100);

  setTimeout(() => {
    widthLine.style.transition = "none";
    heightLine.style.transition = "none";

    widthLine.style.width = finalLongLineWidth + "px";
    heightLine.style.width = finalShortLineWidth + "px";
    widthLine.style.opacity = "1";
    heightLine.style.opacity = "1";

    floatingLong.style.opacity = "0";
    floatingShort.style.opacity = "0";
  }, 3200);

  setTimeout(() => {
    floatingLong.remove();
    floatingShort.remove();

    animateShortSideDoubling(finalShortLineWidth, finalDoubledShortLineWidth);
  }, 3450);
}

function moveFloatingLineToTrack({
  line,
  trackRect,
  finalWidth,
  borderThickness,
  startsVertical
}) {
  line.style.transition =
    "left 2.1s ease-in-out, top 2.1s ease-in-out, width 2.1s ease-in-out, height 2.1s ease-in-out, transform 2.1s ease-in-out, opacity 0.45s ease";

  if (startsVertical) {
    const trackCenterY = trackRect.top + trackRect.height / 2;

    const rotatedLeft = trackRect.left + finalWidth / 2 - borderThickness / 2;
    const rotatedTop = trackCenterY - finalWidth / 2;

    line.style.left = rotatedLeft + "px";
    line.style.top = rotatedTop + "px";
    line.style.width = borderThickness + "px";
    line.style.height = finalWidth + "px";
    line.style.transform = "translate(0, 0) rotate(90deg)";
  } else {
    line.style.left = trackRect.left + "px";
    line.style.top =
      trackRect.top + trackRect.height / 2 - borderThickness / 2 + "px";
    line.style.width = finalWidth + "px";
    line.style.height = borderThickness + "px";
    line.style.transform = "translate(0, 0)";
  }
}

function animateShortSideDoubling(finalShortLineWidth, finalDoubledShortLineWidth) {
  const extraLength = finalDoubledShortLineWidth - finalShortLineWidth;

  if (extraLength <= 0) {
    heightLine.style.transition = "width 0.65s ease";
    heightLine.style.width = finalDoubledShortLineWidth + "px";
    return;
  }

  heightTrack.style.position = "relative";

  const doublingSegment = document.createElement("div");
  doublingSegment.classList.add("doubling-segment");
  doublingSegment.style.left = finalShortLineWidth + "px";
  doublingSegment.style.width = "0px";

  heightTrack.appendChild(doublingSegment);

  requestAnimationFrame(() => {
    doublingSegment.style.opacity = "1";
    doublingSegment.style.width = extraLength + "px";
  });

  setTimeout(() => {
    heightLine.style.transition = "none";
    heightLine.style.width = finalDoubledShortLineWidth + "px";
    doublingSegment.style.opacity = "0";
  }, 950);

  setTimeout(() => {
    doublingSegment.remove();
  }, 1250);
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
  document.querySelectorAll(".floating-line, .doubling-segment").forEach((line) => {
    line.remove();
  });
}
