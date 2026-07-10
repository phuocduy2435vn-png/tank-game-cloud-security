/**
 * Note that this is client code, but it still uses require! Webpack lets us do that, because it sees the
 * dependencies and wires it all together when it builds our single client JS file.
 */
var global = require("./global");
var Canvas = require("./canvas");
var DrawingUtil = require("./drawingUtil");
var socketIoClient = require("socket.io-client");
var socket;

//doesn't need to be for a variable, this import adds a polyfill Microsoft browsers need
require("babel-polyfill");

var screenNameForm = undefined;

var clientGameObjects = {};

var canvasGameBoard;
var drawingUtil;

var requestedFrame;

var lastClientCheckin = new Date().getTime();

window.addEventListener("resize", resize);

window.onload = function () {
  setupStartScreen();
  loadLeaderboard();
};

/**
 * Loads the leaderboard.html file into the leaderboard <div>.
 * NOTE: Dynamically loading in leaderboard.html to keep the main index.html file easy to read.
 */
function loadLeaderboard() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "html/leaderboard.html", true);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return;
    document.getElementById("leaderboard").innerHTML = this.responseText;
  };
}

//set up the form where the user can enter their name
function setupStartScreen() {
  if (typeof screenNameForm === "undefined") {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "html/start_screen.html", true);
    xhr.onreadystatechange = function () {
      if (this.readyState !== 4) return;
      if (this.status !== 200) return;

      var node = document.createElement("div");
      node.setAttribute("id", "start-screen-content");
      node.innerHTML = this.responseText;
      document.body.appendChild(node);
      document.getElementById("button-play").onclick = beginGame;
      document.getElementById("button-spectate").onclick = spectate;
    };
    xhr.send();
  } else {
    document.body.appendChild(screenNameForm);
    document.getElementById("button-play").onclick = beginGame;
    document.getElementById("button-spectate").onclick = spectate;
  }
}

//set up the socket and begin talking with the server
function beginGame() {
  socket = socketIoClient();
  setupPlaySocket(socket);
  init();
}

function spectate() {
  socket = socketIoClient();
  setupSpectateSocket(socket);
  init();
}

function init() {
  socket.emit(
    "init",
    document.getElementById("input-username").value.trim().slice(0, 10)
  );

  //remove the start up form from the page
  screenNameForm = document.getElementById("start-screen-content");
  screenNameForm.parentNode.removeChild(screenNameForm);

  canvasGameBoard = new Canvas();
  drawingUtil = new DrawingUtil(canvasGameBoard);

  document.getElementById("leaderboard").style.display = "block";
  document.getElementById("boost").style.display = "block";

  startGame();
}

/**
 * Basically this funciton lets us set up some global properties before the animation loop begins,
 * and will likely also be where we do some last minute (millisecond) checking to make sure we are good to go
 */
function startGame() {
  animationLoop();
}

function animationLoop() {
  requestedFrame = window.requestAnimationFrame(animationLoop);
  updateClientView();
}

/**
 * Here is where all the game objects are drawn,
 * it is important to start by clearing the canvas here first.
 */
function updateClientView() {
  //clear canvas
  canvasGameBoard.clear();

  if (typeof clientGameObjects.perspective !== "undefined") {
    drawingUtil.setPerspective(
      clientGameObjects.perspective.x,
      clientGameObjects.perspective.y
    );
    drawingUtil.drawGameObjects(clientGameObjects);
    canvasGameBoard.present();
    
    // MỚI: Tự động cập nhật thanh máu và thanh năng lượng (Boost) của chính mình lên UI HTML
    updatePlayerStatusUI();
  } else {
    console.log(
      "unable to find perspective, make sure server is sending perspective object with x and y"
    );
  }
}

/**
 * MỚI: Tìm kiếm dữ liệu tank của chính mình trong danh sách gửi về để cập nhật thanh máu (HP) và thanh Tốc độ (Boost)
 */
function updatePlayerStatusUI() {
  if (global.playerType === "SPECTATOR" || !clientGameObjects.tanks) return;

  // Lọc tìm tank của mình dựa vào tên hiển thị screenName đã lưu lúc Welcome
  var myTank = clientGameObjects.tanks.find(function(t) {
    return t.screenName === global.screenName;
  });

  if (myTank) {
    // Cập nhật thanh máu HTML (Ví dụ ID phần tử thanh máu là 'hp-bar' hoặc thanh hiển thị nội bộ của bạn)
    var hpElement = document.getElementById("hp-bar") || document.getElementById("hp");
    if (hpElement) {
      var currentHp = typeof myTank.hp !== "undefined" ? myTank.hp : 100;
      hpElement.style.width = currentHp + "%";
      if (currentHp <= 30) {
        hpElement.style.backgroundColor = "#ff4d4d"; // Máu thấp hiện đỏ
      } else {
        hpElement.style.backgroundColor = "#4caf50"; // Máu xanh
      }
    }

    // Cập nhật thanh năng lượng Boost tăng tốc
    var boostElement = document.getElementById("boost-bar") || document.getElementById("boost");
    if (boostElement) {
      var currentBoost = typeof myTank.boostRemaining !== "undefined" ? myTank.boostRemaining : 100;
      boostElement.style.width = currentBoost + "%";
    }
  }
}

/**
 * Here is where we set up the callbacks for our socket.
 * So basically we give the socket all the callbacks for the different events it might receive.
 */
function setupPlaySocket(socket) {
  socket.on("welcome", function (clientInitData, gameConfig) {
    clientInitData.player.screenHeight = global.screenHeight;
    clientInitData.player.screenWidth = global.screenWidth;
    clientInitData.player.type = "PLAYER";
    global.playerType = "PLAYER";

    global.gameWidth = gameConfig.gameWidth;
    global.gameHeight = gameConfig.gameHeight;
    global.screenName = clientInitData.tank.screenName;

    socket.emit("welcome_received", clientInitData);
  });

  //server needs to draw what gets put into gameObjects
  socket.on("game_objects_update", function (gameObjects) {
    clientGameObjects = gameObjects;
    if (
      new Date().getTime() - lastClientCheckin >
      global.clientCheckinInterval
    ) {
      socket.emit("client_checkin", canvasGameBoard.getUserInput());
      lastClientCheckin = new Date().getTime();
    }
  });

  // MỚI: Nhận gói cập nhật máu trực tiếp từ Server để cập nhật tức thì khi trúng đạn
  socket.on("hp_update", function (hp) {
    var hpElement = document.getElementById("hp-bar") || document.getElementById("hp");
    if (hpElement) {
      hpElement.style.width = hp + "%";
    }
  });

  /**
   * Server wants to calculate my ping,
   * emit back to server right away.
   */
  socket.on("pingcheck", function () {
    socket.emit("pongcheck");
  });

  /**
   * Tank has been destroyed, socket connection
   */
  socket.on("death", function () {
    console.log("Bạn đã hy sinh! Đang chờ hồi sinh tại vị trí mới...");
    clientGameObjects = {};
    // Reset thanh máu về 0 khi chết tạm thời
    var hpElement = document.getElementById("hp-bar") || document.getElementById("hp");
    if (hpElement) hpElement.style.width = "0%";
  });
}

function setupSpectateSocket(socket) {
  socket.on("welcome", function (clientInitData, gameConfig) {
    clientInitData.player.screenHeight = global.screenHeight;
    clientInitData.player.screenWidth = global.screenWidth;
    clientInitData.player.type = "SPECTATOR";
    global.playerType = "SPECTATOR";

    global.gameWidth = gameConfig.gameWidth;
    global.gameHeight = gameConfig.gameHeight;
    global.screenName = clientInitData.tank.screenName;

    socket.emit("welcome_received", clientInitData);
  });

  //server needs to draw what gets put into gameObjects
  socket.on("game_objects_update", function (gameObjects) {
    clientGameObjects = gameObjects;
    if (
      new Date().getTime() - lastClientCheckin >
      global.clientCheckinInterval
    ) {
      socket.emit("client_checkin", canvasGameBoard.getUserInput());
      lastClientCheckin = new Date().getTime();
    }
  });

  /**
   * Server wants to calculate my ping,
   * emit back to server right away.
   */
  socket.on("pingcheck", function () {
    socket.emit("pongcheck");
  });

  /**
   * Tank has been destroyed, socket connection
   */
  socket.on("death", function () {
    window.cancelAnimationFrame(requestedFrame);
    canvasGameBoard.clear();
    clientGameObjects = {};
    document.getElementById("leaderboard").style.display = "none";
    document.getElementById("boost").style.display = "none";
    setupStartScreen();
  });
}

/**
 * Store global screen dimensions, then send them to the server.
 * This function is bound to the browser's 'resize' event.
 */
function resize() {
  global.screenWidth = window.innerWidth;
  global.screenHeight = window.innerHeight;

  if (canvasGameBoard) {
    canvasGameBoard.setHeight(global.screenHeight);
    canvasGameBoard.setWidth(global.screenWidth);
  }

  if (socket) {
    socket.emit("windowResized", {
      screenWidth: global.screenWidth,
      screenHeight: global.screenHeight
    });
  }
}