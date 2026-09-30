let board = Array(9).fill("");
let currentPlayer = "X";
let result = "playing";
let difficulty = "hard";
let humanScore = 0;
let aiScore = 0;
let thinking = false;
let winningCells = [];
let aiTimer = null;

const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function openGame() {
  document.getElementById("home").classList.remove("active");
  document.getElementById("game").classList.add("active");
  render();
}

function showHome() {
  document.getElementById("game").classList.remove("active");
  document.getElementById("home").classList.add("active");
}

function render() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  board.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "cell" + (value === "O" ? " o" : "") +
      (winningCells.includes(index) ? " win" : "");
    button.textContent = value;
    button.disabled = thinking || result !== "playing" || value !== "" || currentPlayer !== "X";
    button.onclick = () => playerMove(index);
    boardEl.appendChild(button);
  });

  document.getElementById("humanScore").textContent = humanScore;
  document.getElementById("aiScore").textContent = aiScore;

  const status = document.getElementById("status");

  if (result === "playing") {
    status.textContent = thinking ? "AI is thinking…" : "Your turn";
  } else if (result === "human") {
    status.textContent = "You win 🎉";
  } else if (result === "ai") {
    status.textContent = "AI wins";
  } else {
    status.textContent = "Draw";
  }

  document.querySelectorAll(".segmented button").forEach(button => {
    button.classList.toggle("selected", button.dataset.level === difficulty);
  });
}

function playerMove(index) {
  if (thinking || result !== "playing" || board[index] !== "") return;

  board[index] = "X";
  currentPlayer = "O";

  if (finishIfNeeded("X")) {
    render();
    return;
  }

  thinking = true;
  render();

  aiTimer = setTimeout(() => {
    const move = getAIMove();
    if (move !== null) board[move] = "O";

    currentPlayer = "X";
    thinking = false;

    finishIfNeeded("O");
    render();
    aiTimer = null;
  }, 350);
}

function finishIfNeeded(player) {
  const pattern = wins.find(row => row.every(i => board[i] === player));

  if (pattern) {
    winningCells = pattern;

    if (player === "X") humanScore++;
    else aiScore++;

    result = player === "X" ? "human" : "ai";
    return true;
  }

  if (board.every(cell => cell !== "")) {
    result = "draw";
    return true;
  }

  return false;
}

function getAIMove() {
  const available = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  if (!available.length) return null;

  if (difficulty === "easy") {
    return available[Math.floor(Math.random() * available.length)];
  }

  if (difficulty === "medium") {
    return mediumMove(available);
  }

  return bestMove();
}

function mediumMove(available) {
  const win = immediateMove("O");
  if (win !== null) return win;

  const block = immediateMove("X");
  if (block !== null) return block;

  if (board[4] === "") return 4;

  const corners = [0,2,6,8].filter(i => board[i] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  return available[Math.floor(Math.random() * available.length)];
}

function immediateMove(player) {
  for (const index of board.keys()) {
    if (board[index] !== "") continue;

    const test = [...board];
    test[index] = player;

    if (wins.some(row => row.every(i => test[i] === player))) {
      return index;
    }
  }

  return null;
}

function bestMove() {
  let bestScore = -Infinity;
  let choices = [];

  for (const index of board.keys()) {
    if (board[index] !== "") continue;

    const test = [...board];
    test[index] = "O";

    const score = minimax(test, 0, false);

    if (score > bestScore) {
      bestScore = score;
      choices = [index];
    } else if (score === bestScore) {
      choices.push(index);
    }
  }

  return choices[Math.floor(Math.random() * choices.length)];
}

function minimax(state, depth, maximizing) {
  if (isWinner("O", state)) return 10 - depth;
  if (isWinner("X", state)) return depth - 10;
  if (state.every(cell => cell !== "")) return 0;

  if (maximizing) {
    let best = -Infinity;

    for (const index of state.keys()) {
      if (state[index] !== "") continue;

      const next = [...state];
      next[index] = "O";
      best = Math.max(best, minimax(next, depth + 1, false));
    }

    return best;
  }

  let best = Infinity;

  for (const index of state.keys()) {
    if (state[index] !== "") continue;

    const next = [...state];
    next[index] = "X";
    best = Math.min(best, minimax(next, depth + 1, true));
  }

  return best;
}

function isWinner(player, state) {
  return wins.some(row => row.every(i => state[i] === player));
}

function newGame() {
  if (aiTimer !== null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }

  board = Array(9).fill("");
  currentPlayer = "X";
  result = "playing";
  thinking = false;
  winningCells = [];
  render();
}

function setDifficulty(level) {
  if (thinking) return;
  difficulty = level;
  newGame();
}

render();
