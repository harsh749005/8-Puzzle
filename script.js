/////////////////////////////////////////////////////////////////////////////
// The M of MVC: Model

// SlidingTilePuzzle represents the puzzle's state and some basic methods
// relating to the position of the tiles.

function SlidingTilePuzzle(columns, rows) {
    // Local iterator
    var i;
    
    // Raw puzzle state
    var puzzleColumns = (columns===undefined) ? 4 : columns;
    var puzzleRows = (rows===undefined) ? 4 : rows;
    var puzzleLength = puzzleColumns * puzzleRows;
    var puzzleState = new Array(puzzleLength);
    
    for (i = 1; i < puzzleLength; i++) {
      puzzleState[i-1] = i;
    }
    var indexBlank = puzzleLength-1;
    puzzleState[indexBlank] = 0;
  
    // Auxiliary statistics
    var validAux = false;
    var displacedTiles = 0;
    var manhattanDistance = 0;
    
    // Scratchpad to avoid frequent allocation/deallocation
    var scratchpad = new Array(puzzleLength);
    
    /////////////////////////////////////////////////////////////////////////////
    // Factorial lookup table
    var F = [1];
    
    for (i = 1; i < puzzleLength; i++) {
      F[i] = F[i-1]*i;
    }
  
    /////////////////////////////////////////////////////////////////////////////
    // Generate the auxiliary statistics
    // * Displaced Tiles
    // * Manhattan Distance
    // Calculation only occurs on-demand, so we don't waste time computing them
    // when they are irrelevant.
    var ensureAuxStats = function() {
      if (validAux) {
        return;
      }
  
      // Calculate the Manhattan Distance of the tile at the specified index.
      var calculateManhattanDistance = function(index) {
        var tileAtIndex = puzzleState[index];
        var desiredIndex = 0;
        
        if (tileAtIndex == 0 ) {
          desiredIndex = puzzleLength-1;
        } else {
          desiredIndex = puzzleState[index]- 1;
        }
      
        var actualRow = Math.floor(index/puzzleColumns);
        var desiredRow= Math.floor(desiredIndex/puzzleColumns);
        
        var actualColumn = Math.abs(index%puzzleColumns);
        var desiredColumn = Math.abs(desiredIndex%puzzleColumns);
        
        return  Math.abs(actualRow-desiredRow) + 
                Math.abs(actualColumn-desiredColumn);
      };
  
      displacedTiles = 0;
      manhattanDistance = 0;
    
      for( var i = 0; i < puzzleLength; i++) {
        if (puzzleState[i] == 0) {
          indexBlank = i;
        } else if (puzzleState[i] != i+1) {
          displacedTiles++;
          manhattanDistance += calculateManhattanDistance(i);
        }
      }
      validAux = true;
    };
    
    var invalidateAuxStats = function() {
      validAux = false;
    };
    
    /////////////////////////////////////////////////////////////////////////////
    // Tile movment methods
    
    // This private function does not perform any validation of the two tile
    // indices, the caller is responsible for checking validity OR deliberately
    // making an illegal move.
    var swapTileNoValidation = function(tile1, tile2) {
      var tileTemp = puzzleState[tile1];
      puzzleState[tile1] = puzzleState[tile2];
      puzzleState[tile2] = tileTemp;
      
      if (indexBlank==tile1) {
        indexBlank = tile2;
      } else if (indexBlank==tile2) {
        indexBlank = tile1;
      }
      invalidateAuxStats();
    };
    
    // This function takes an index of a tile to swap with the blank tile.
    // It will check to make sure it is a valid move. If valid, makes the move and
    // returns true. If invalid, nothing is moved and it returns false.
    var trySwapTile = function(indexSwap) {
      var validSwap = false;
      
      if (indexSwap == indexBlank + 1 &&
          indexSwap%puzzleColumns > 0) {
        // Valid move with indexSwap on the right, indexBlank on the left.
        validSwap = true;
      } else if (indexSwap == indexBlank - 1 &&
          indexBlank%puzzleColumns > 0) {
        // Valid move with indexSwap on the left, indexBlank on the right.
        validSwap = true;
      } else if (indexSwap == indexBlank + puzzleColumns &&
          indexSwap < puzzleLength) {
        // Valid move with indexSwap below indexBlank
        validSwap = true;
      } else if (indexSwap == indexBlank - puzzleColumns &&
          indexSwap >= 0) {
        // Valid move with indexSwap above indexBlank
        validSwap = true;
      }
      
      if (validSwap) {
        // Make the swap and update stats
        swapTileNoValidation(indexBlank, indexSwap);
      }
      
      return validSwap;
    };
    
    /////////////////////////////////////////////////////////////////////////////
    // Public methods
    /////////////////////////////////////////////////////////////////////////////
    
    /////////////////////////////////////////////////////////////////////////////
    // Some people think of a puzzle move as "moving a tile", others think of it
    // as "moving the blank". So we support both conventions. In all cases, if
    // the move succeeds, the return value is true. If the move is invalid,
    // nothing changes and the return value is false.
    
    // Try to move a tile down/blank up
    this.blankUp = function() { return trySwapTile(indexBlank-puzzleColumns); };
    this.tileDown = function() { return this.blankUp(); };
    
    // Try to move a tile up/blank down
    this.blankDown = function() { return trySwapTile(indexBlank+puzzleColumns); };
    this.tileUp = function() { return this.blankDown(); };
    
    // Try to move a tile right/blank left
    this.blankLeft = function() { return trySwapTile(indexBlank-1); };
    this.tileRight = function() { return this.blankLeft(); };
    
    // Try to move a tile left/blank right. 
    this.blankRight = function() { return trySwapTile(indexBlank+1); };
    this.tileLeft = function() { return this.blankRight(); };
    
    // Try to move the specified numbered tile. Will look up the position and see
    // if it is adjacent to the blank space. If true, moves the tile and returns
    // true. If not adjacent to blank, returns false.
    this.moveTile = function(tileNum) {
      var tileIndex = -1;
      
      for (var i = 0; i < puzzleLength && tileIndex == -1; i++) {
        if (puzzleState[i] == tileNum) {
          tileIndex = i;
        }
      }
      
      if (tileIndex >= 0) {
        return trySwapTile(tileIndex);
      }
      
      return false;
    };
    
    // Completely rearrange our board to match the given encoded board number
    this.decode = function(encodedValue) {
      var digitBase = puzzleLength-1;
      var decodeCurrent = 0;
      var decodeRemainder = encodedValue;
      var i = 0;
      var tileNum = 0;
    
      for (i = 0; i < puzzleLength; i++) {
        scratchpad[i] = false;
      }
      
      for (i = 0; i < puzzleLength; i++) {
        tileNum = 0;
        decodeCurrent = Math.floor(decodeRemainder/F[digitBase]);
        decodeRemainder = decodeRemainder % F[digitBase];
        digitBase--;
        
        while (decodeCurrent > 0 || scratchpad[tileNum]) {
          if (!scratchpad[tileNum]) {
            decodeCurrent--;
          }
          tileNum++;
        }
        
        puzzleState[i] = tileNum;
        scratchpad[tileNum] = true;
        if (tileNum==0) {
          indexBlank = i;
        }
      }
      
      invalidateAuxStats();
    };
    
    /////////////////////////////////////////////////////////////////////////////
    // Puzzle state representation methods
  
    // Encode the puzzle state into a single number
    this.encode = function() {
      var digitBase = puzzleLength-1;
      var encodeValue = 0;
      
      for (var i = 0; i < puzzleLength; i++) {
        scratchpad[i] = false;
      }
      
      for (var i = 0; i < puzzleLength; i++) {
        var tileNum = puzzleState[i];
        var encodeNum = tileNum;
        
        for (var j = 0; j < tileNum; j++) {
          if (scratchpad[j]) {
            encodeNum--;
          }
        }
        
        encodeValue += encodeNum * F[digitBase--];
        
        scratchpad[tileNum] = true;
      }
      
      /*
      var decodeVerify = decodeBoard(encodeValue);
      for (var i = 0; i < boardPositions.length; i++) {
        if (decodeVerify[i] != boardPositions[i]) {
          console.log("Expected: " + boardPositions + " but got:" + decodeVerify);
        }
      }
      */
      
      return encodeValue;
    };
    
    // Returns a string that represents the state of this puzzle
    this.printState = function() {
      var stringBuilder = "DT="+displacedTiles+" MD="+manhattanDistance+" B@"+indexBlank;
      
      for (var row = 0; row < puzzleRows; row++) {
        stringBuilder += "\n";
        for (var col = 0; col < puzzleColumns; col++) {
          stringBuilder += puzzleState[row*puzzleColumns + col];
          stringBuilder += " ";
        }
      }
      stringBuilder += "\n";
      
      return stringBuilder;
    };
    
    // Returns an array that represents the state of this puzzle
    this.asArray = function() {
      return Array.from(puzzleState);
    };
  
    /////////////////////////////////////////////////////////////////////////////
    // Public property getters
    /////////////////////////////////////////////////////////////////////////////
    
    // Determines if this puzzle is solvable.
    this.isSolvable = function() {
      var inversionCountIsEven = (this.getInversionCount() % 2)==0;
      
      if (puzzleColumns%2 == 0) {
        // Even number of columns - solvability will depend on position of the blank. 
        var blankIsEvenRowsFromDesired = ((puzzleRows - Math.floor(indexBlank/puzzleColumns)) % 2) == 1;
        
        // The below can be condensed into either of the following
        // (1) blankIsEvenRowsFromDesired XNOR inversionCountIsEven
        // (2) blankIsEvenRowsFromDesired == inversionCountIsEven
        // But I'm not doing it for the sake of code readability.
        // Not sure if JavaScript engines are smart enough to pick this up.
        if (blankIsEvenRowsFromDesired) {
          // If it is on the correct (bottom) row, or an even number of rows
          // from there, then the position is solvable if inversion is even.
          return inversionCountIsEven;
        } else {
          // If it is odd number of rows away from the correct row, the position
          // is solvable if the inversion is odd.
          return !inversionCountIsEven;
        }
      } else {
        // Odd number of columns - all even inversion configurations are solvable.
        return inversionCountIsEven;
      }
    };
    
    // The inversion count for the whole puzzle is the sum of inversion count for
    // all tiles. For each tile, the inversion count is the number of tiles that
    // are out of order relative to it. 
    // * A completely solved puzzle has inversion count of zero because the tiles 
    //   are in increasing order.
    // * Inversion count is at max when the tiles are arranged in decreasing order.
    this.getInversionCount = function() {
      var inversionCount = 0,
          currentTile = 0,
          compareTile = 0;
      
      for (var i = 0; i < puzzleLength; i++) {
        currentTile = puzzleState[i];
        
        if (currentTile > 0) {
          for (var j = i; j < puzzleLength; j++) {
            compareTile = puzzleState[j];
            if (compareTile != 0 && compareTile < currentTile) {
              inversionCount++;
            }
          }
        }
      }
      
      return inversionCount;
    };
    
    // Returns true if the puzzle is in the solved state
    this.isSolved = function() { ensureAuxStats(); return manhattanDistance==0; };
    
    // Returns the number of columns on the game board
    this.getColumns = function() { return puzzleColumns; };
    
    // Returns the number of rows on the game board
    this.getRows = function() { return puzzleRows; };
    
    // Returns the number of spaces on the game board
    this.getSize = function() { return puzzleLength; };
    
    // Returns the number of tiles displaced from their goal position
    this.getDisplacedTiles = function() { ensureAuxStats(); return displacedTiles; };
  
    // Returns the sum of the distances of all displaced tiles from their goals
    this.getManhattanDistance = function() { ensureAuxStats(); return manhattanDistance; };
  }
  
  /////////////////////////////////////////////////////////////////////////////
  // View - the V of MVC
  
  // Simple HTML viewer, theoretically easily switched to something more
  // sophisticated.
  
  function jQuerySimpleView(puzzle) {
    // Values based on the puzzle
    var viewColumns = puzzle.getColumns();
    var viewRows = puzzle.getRows();
  
    // Other values as constants
    
    // How much space to put between tiles, in fraction of maximum tile space. 
    // (0.05 = 5% space)
    var tileSpace = 0.05;
  
    // How long to take to animate a tile
    var tileSlideTime = 25;
    
    // Gets the length of a tile's side.
    // The item #tileBoard is told to lay itself out at 100% of available width.
    // We also query for the visible window's inner width and height.
    // The minimum of all of those is the maximum possible dimension to be entirely visible.
    // We divided that by number of rows/columns.
    // Further subtract by however much space we want to put between tiles.
    var getTileDim = function() {
      var tileBoard = $("#tileBoard");
    
      var minDim = Math.min(
        window.innerWidth, 
        window.innerHeight-$("#otherUI").outerHeight(), 
        tileBoard.innerWidth() );
    
      return (minDim / Math.max(viewRows, viewColumns)) * (1-tileSpace);
    };
  
    // Given a tile number, return its index in the array.
    // Returns -1 if not found.
    var indexOfTile = function(tileNum, gameBoard) {
      for (var i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] == tileNum) {
          return i;
        }
      }
    
      return -1;
    };
  
    // Given a tile number, starts an animation that moves the tile to its
    // corresponding location on screen. Call this after the tile has been
    // moved in the tilePosition[] array.
    this.updatePositionOfTile = function(tileNum, gameBoard) {
      var tileIndex = indexOfTile(tileNum, gameBoard);
    
      var tileRow = Math.floor(tileIndex / viewColumns);
      var tileColumn = tileIndex % viewColumns;
      var tileDim = getTileDim() * (1/(1-tileSpace));
      var tileLeft = Math.max(0, $("#tileBoard").innerWidth()-(viewColumns * tileDim)) / 2;
    
      $("#" + tileNum).animate({
        "left": tileColumn * tileDim + tileLeft,
        "top": tileRow * tileDim
      }, tileSlideTime);
    };
  
    // When the viewport is resized, update size of board accordingly.
    this.resizeTiles = function(event) {
      var boxes = $(".box");
      var boxLabels = $(".boxLabel");
      var tileDim = getTileDim();
    
      boxes.css({
        "width": tileDim,
        "height": tileDim,
        "border-radius": (tileDim * 0.15)
      });
    
      boxLabels.css({
        "font-size": tileDim / 2 + "px",
        "padding": tileDim / 6 + "px",
        "margin": 0
      });
    
      var view = event.data["view"];
      var puzzleAsArray = event.data["model"].asArray();
      for (var i = 1; i < (viewColumns*viewRows); i++) {
        view.updatePositionOfTile(i, puzzleAsArray);
      }
    
      $("#tileBoard").css("height", (tileDim * (1/(1-tileSpace))) * viewRows);
    };
  
    // Initial setup of game board. Take the HTML for ".box" under the
    // tileTemplateHost" and clone it 8 times for the game tile. 
    // For each tile, the tile text is updated and the ID set to the tile number.
    this.setupTiles = function(eventDataPackage) {
      var tileBoard = $("#tileBoard");
      var tileTemplate = $("#tileTemplateHost .box");
    
      for (var i = 1; i < (viewRows * viewColumns); i++) {
        var newTile = tileTemplate.clone(false, false);
        newTile.attr("id", i);
        newTile.children(".boxLabel").text(i);
        tileBoard.append(newTile);
      }
    
      this.resizeTiles({"data":eventDataPackage});
    };
  
    // Evaluates the board position and update the status text
    this.updateStatusBar = function(eventDataPackage) {
      var puzzle = eventDataPackage["model"];
      var controller = eventDataPackage["controller"];
      var solver = eventDataPackage["solver"];
      
      if (puzzle.isSolved()) {
        $("#boardState").text("All tiles in correct position");
        $("#progress").text(controller.getPlayerMoves() + " moves were taken. Press SCRAMBLE PUZZLE to start again.");
        $("#scrambleButton").css("background-color", "rgb(20, 20, 20)");
        $("#scrambleText").text("SCRAMBLE PUZZLE");
        $("#scrambleButton").on("click", eventDataPackage, controller.scramblePuzzle);
      } else {
        $("#boardState").text("Displaced : " + puzzle.getDisplacedTiles() + 
          " Distance : " + puzzle.getManhattanDistance() + 
          " Optimal : " + solver.getSteps(puzzle.encode()));
        $("#progress").text(controller.getPlayerMoves() + " moves so far.");
      }
    };
  }
  
  /////////////////////////////////////////////////////////////////////////////
  // Controllers - the C of MVC
  
  /////////////////////////////////////////////////////////////////////////////
  // Given the encoded value of a game board representing the solved position,
  // generate a complete lookup table of the optimal number of steps to solve
  // every solvable state.
  function OptimalSolver8Puzzle(encodedSolution) {
    // Iterator
    var i = 0;
    
    // Set up the factorial lookup table
    var F = [1];
    for (i = 1; i < 9; i++) { F[i] = F[i-1]*i; }
    
    // Intermediate information for problem space traversal
    var workingBoard = new SlidingTilePuzzle(3,3);
    var workerState = 1;
    var workerList = new Array(0);
    
    // Initialize the table to hold results of the traversal
    var optimalMovesTable = new Uint8Array(9 * F[8]);
    for(i = 0; i < optimalMovesTable.length; i++) {
      optimalMovesTable[i] = 255;
    }
    optimalMovesTable[encodedSolution] = 0;
  
    // Given a board layout, see if it's one we've already visited.
    // If not, add the steps it took to get there and add it to the open list so
    // we remember to go and look at all its neighbors later.
    var checkAddBoard = function(steps, encodedBoard, openList) {
      if (optimalMovesTable[encodedBoard] > steps) {
        optimalMovesTable[encodedBoard] = steps;
        openList.push(encodedBoard);
      }
    };
  
    // Given a board layout, try moving all four adjacent tiles to see if we've
    // visited those states. Every (1) valid and (2) new state is added to the
    // open list so we can repeat the process for all their neighbors.
    var addToOpenList = function(steps, encodedBoard, openList) {
      workingBoard.decode(encodedBoard);
  
      if (workingBoard.blankUp()) {
        checkAddBoard(steps, workingBoard.encode(), openList);
        workingBoard.blankDown();
      }
      
      if (workingBoard.blankDown()) {
        checkAddBoard(steps, workingBoard.encode(), openList);
        workingBoard.blankUp();
      }
      
      if (workingBoard.blankRight()) {
        checkAddBoard(steps, workingBoard.encode(), openList);
        workingBoard.blankLeft();
      }
      
      if (workingBoard.blankLeft()) {
        checkAddBoard(steps, workingBoard.encode(), openList);
        workingBoard.blankRight();
      }
    };
  
    // Kick off the search process by starting with the solved state.
    addToOpenList(workerState, encodedSolution, workerList);
  
    // Examine every board layout in the open list and check its neighbors.
    // Once we exhaust one open list, we yield execution with setTimeout()
    // to let other threads do their thing before we resume with the new
    // open list.
    // If the new open list is empty, walk through the array and mark every
    // unvisited node as an unsolvable configuration.
    var optimalMovesTableWorker = function() {
      var openList = new Array(0);
  
      if (workerList.length > 0) {
        for ( var i = 0; i < workerList.length; i++) {
          addToOpenList(workerState+1, workerList[i], openList);  
        }
        
        console.log("Processed " + workerList.length + " positions of length " + workerState);
        
        workerList = openList;
        workerState++;
        setTimeout(optimalMovesTableWorker, 5);
      } else {
        var unreached = 0;
        for(i = 0; i < optimalMovesTable.length; i++) {
          if (optimalMovesTable[i] == 255) {
            optimalMovesTable[i] = 254;
            unreached++;
          }
        }
        console.log("Never reached "+unreached+" states.");
      }
    };
    
    // Kick off the search
    console.log("Started OptimalSolver8Puzzle");
    optimalMovesTableWorker();
    
    //////////////////////////////////////////////////////////////////////////////
    // Public method to retrieve the optimal number of steps between the given
    // encoded state and the solved state.
    // * Returns string "[Calculating...]" if the search is still underway.
    // * Returns string "[Unsolvable]" if the given state has no solution.
    // * Returns number of steps if neither of the above.
    
    this.getSteps = function(encodedBoard) {
      var lookup = optimalMovesTable[encodedBoard];
      
      if (lookup == 255) {
        return "[Calculating...]";
      } else if (lookup == 254) {
        return "[Unsolvable]";
      } else {
        return lookup;
      }
    };
  }
  
  /////////////////////////////////////////////////////////////////////////////
  // A simple controller class to respond to click events to manipulate the
  // puzzle.
  
  function jQuerySimpleController() {
    var playerMoves = 0;
    
    // Scrambles the puzzle until the manhattan distance of the configuration is at
    // least twice that of the board size. (Every tile is at least 2 spaces out of
    // place.)
    this.scramblePuzzle = function(event) {
      var scrambleSteps = 0;
      var success = false;
      
      var puzzle = event.data["model"];
      var view = event.data["view"];
      
      if (puzzle===undefined) {
        console.log("scramblePuzzle failed to retrieve puzzle model from event data.");
      }
    
      while(puzzle.getManhattanDistance() < puzzle.getSize() * 2) {
        success = false;
        
        switch (Math.floor(Math.random()*4)) {
          case 0: // Try to move a tile down into the blank
            success = puzzle.blankUp();
            break;
          case 1: // Try to move a tile up into the blank
            success = puzzle.blankDown();
            break;
          case 2: // Try to move a tile left into the blank
            success = puzzle.blankRight();
            break;
          case 3: // Try to move a tile right into the blank
            success = puzzle.blankLeft();
            break;
          default:
            alert("Random number generation in scramblePuzzle did not behave as expected");
            break;
        }
    
        if (success) {
          scrambleSteps++;
        }
      }
    
      for( var i = 0; i < puzzle.getSize(); i++) {
        view.updatePositionOfTile(i, puzzle.asArray());
      }
        
      console.log("Scramble took " + scrambleSteps + " steps to meet criteria.");
    
      playerMoves = 0;
      view.updateStatusBar(event.data);
      
      $("#scrambleText").text("PUZZLE IN PROGRESS");
      $("#scrambleButton").off("click", this.scramblePuzzle);
    };
    
    // Click event handler for .box delegated on the #tileBoard. $(this) is the 
    // tile that got clicked on. Retrieve its index in the tilePosition array and
    // the index of the blank to determine if they are adjacent. If so, it is a 
    // valid move, and perform the swap.
    this.tileClicked = function(event) {
      var tileClick = $(this).attr("id");
      var puzzle = event.data["model"];
      var view = event.data["view"];
      
      if (puzzle===undefined) {
        console.log("tileClicked failed to retrieve puzzle model from event data.");
      }
      
      if (puzzle.moveTile(tileClick)) {
        view.updatePositionOfTile(tileClick,puzzle.asArray());
        playerMoves++;
        view.updateStatusBar(event.data);
      }
    };
    
    // Returns the number of times the human player has moved a tile
    this.getPlayerMoves = function() {
      return playerMoves;
    };
  }
  
  // Game board setup: generate tiles, size them correctly, and wait for the
  // user to click.
  $(document).ready(function() {
    var puzzleModel = new SlidingTilePuzzle(3, 3);
    var htmlView = new jQuerySimpleView(puzzleModel);
    var clickController = new jQuerySimpleController();
    var solver = new OptimalSolver8Puzzle(puzzleModel.encode());
    
    var eventDataPackage = { 
      "model" : puzzleModel, 
      "view" : htmlView,
      "controller" : clickController,
      "solver" : solver};
  
    htmlView.setupTiles(eventDataPackage);
    $(window).resize(eventDataPackage, htmlView.resizeTiles);
    $("#tileBoard").on("click", ".box", eventDataPackage, clickController.tileClicked);
    $(".PlayButton").on("click", eventDataPackage, clickController.scramblePuzzle);
  });
  
  // Play Button  
  const playButton = document.querySelector(".PlayButton");
  playButton.addEventListener("click",()=>{
    
      document.querySelector(".Main-div").style.display = "none";
      document.querySelector(".Main-div").style.transition = ".5s"
  })

  // Restart Game/Button
  const restartButton = document.querySelector("#Restart");
  restartButton.addEventListener("click",()=>{
    window.location.reload();
  })

