import React, { useEffect, useState } from "react";
import "./App.css";
import Clicker from "./components/Clicker/Clicker";
import Timer from "./components/Timer/Timer";
const MAX_ROWS = 16;
const MAX_COLUMNS = 16;
const BOMBS_AMOUNT = 40;
const emotions = {normal: "😉", scary: "😧", sad: "😫", satisfied: "😎"}

const createBoard = () => {
  const squares = [];
  for (let i = 0; i < MAX_ROWS; i++) {
    squares[i] = [];
    for (let j = 0; j < MAX_COLUMNS; j++) {
      squares[i].push({ bomb: false, state: 0 }); 
    }
  }

  
  for (let i = 0; i < BOMBS_AMOUNT; i++) {
    let mine = false;
    while (!mine) {
      let row = Math.floor(Math.random() * MAX_ROWS);
      let col = Math.floor(Math.random() * MAX_COLUMNS);

      if (!squares[row][col].isMined) {
        squares[row][col].isMined = true;
        mine = true;
      }
    }
  }

  
  for (let i = 0; i < MAX_ROWS; i++) {
    for (let j = 0; j < MAX_COLUMNS; j++) {
      const square = squares[i][j];
      if (square.isMined) {
        square.value = -1;
        continue;
      }

     
      let counter = 0;
      if (i > 0 && j > 0 && squares[i - 1][j - 1].isMined) {
        counter++;
      }
      if (i > 0 && squares[i - 1][j].isMined) {
        counter++;
      }
      if (i > 0 && j < 15 && squares[i - 1][j + 1].isMined) {
        counter++;
      }
      if (j > 0 && squares[i][j - 1].isMined) {
        counter++;
      }
      if (j < 15 && squares[i][j + 1].isMined) {
        counter++;
      }
      if (i < 15 && j > 0 && squares[i + 1][j - 1].isMined) {
        counter++;
      }
      if (i < 15 && squares[i + 1][j].isMined) {
        counter++;
      }
      if (i < 15 && j < 15 && squares[i + 1][j + 1].isMined) {
        counter++;
      }

      square.value = counter;
    }
  }

  return squares;
};

const squareProperty = (squares, row_i, row_j, property, value) => {
  return squares.map((row, rowNumber) =>
    row.map((square, colNumber) => {
      if (row_i === rowNumber && row_j === colNumber) {
        return {
          ...square,
          [property]: value
        };
      }
      return square;
    })
  );
};

let minutes = 40;


const App = () => {
 
  
  const [squares, setsquares] = useState(createBoard());
  const [mineCounter, setMineCounter] = useState(BOMBS_AMOUNT);
  const [seconds, setTime] = useState(0);
  const [emotion, setEmotion] = useState(emotions.normal);
  const [isOK, setIsOK] = useState(false);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  
  useEffect(() => {
    if (isOK && !win && !lose) {
      
      const interval = setInterval(() => {
          if (seconds < 1000) {
            setTime(seconds + 1);
            if (seconds % 60 == 0) {
            minutes = minutes - 1;
          }
          }}, 1000); 
       
      
      return () => {
        clearInterval(interval);
        
      };
    }
  }, [seconds, isOK, win, lose]);

  const handleMouseDown = e => {
    if (win || lose) {
      return;
    }

    setEmotion(emotions.scary);
  };

  const handleMouseUp = e => {
    if (win || lose) {
      return;
    }

    setEmotion(emotions.normal);
  };

  useEffect(() => {
    if (lose) {
      setEmotion(emotions.sad);
    }
  }, [lose]);

  useEffect(() => {
    if (win) {
      const newSquares = squares.map(row =>
        row.map(square =>
          square.value === -1
            ? {
                ...square,
                state: 1
              }
            : square
        )
      );
      setsquares(newSquares);
      setEmotion(emotions.satisfied);
    }
  }, [win]);

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [emotion, win, lose]);

  const renderRows = () => {
    return squares.map((row, rowNumber) => {
      return renderButtonsForRow(row, rowNumber);
    });
  };

  const renderButtonsForRow = (row, rowNumber) => {
    return row.map((square, colNumber) => (
      <Clicker
        state={square.state}
        value={square.value}
        red={square.red}
        key={`${rowNumber}-${colNumber}`}
        onClick={handleButtonClick}
        onContext={handleButtonContextMenu}
        row={rowNumber}
        col={colNumber}
      />
    ));
  };

  const handleButtonClick = (row_i, row_j) => e => {
    e.preventDefault();

    if (win || lose) {
      return;
    }

    let shuffledBoard = squares;
    let square = shuffledBoard[row_i][row_j];

    if (!isOK) {
      // первый клик не должен стать миной
      if (square.value === -1) {
        let isMined = true;
        let newSquares = shuffledBoard;
        while (isMined) {
          newSquares = createBoard();
          const newsquare = newSquares[row_i][row_j];
          if (newsquare.value !== -1) {
            isMined = false;
          }
        }
        shuffledBoard = newSquares;
        square = shuffledBoard[row_i][row_j];
      }

      setIsOK(true);
    }

    
    if (square.state !== 0) {
      return;
    }

    
    if (square.value === -1) {
      setLose(true);
      let newSquares = squareProperty(shuffledBoard, row_i, row_j, "red", true);
      newSquares = showHiddenBombs(newSquares);
      setsquares(newSquares);
      return;
    }

    
    if (square.value === 0) {
      shuffledBoard = openNearest(shuffledBoard, row_i, row_j);
    }
    // display number
    if (square.value > 0) {
      shuffledBoard = squareProperty(shuffledBoard, row_i, row_j, "state", 1);
    }
    // if all non-bomb spaces have been pressed, then won
    const emptySquares = shuffledBoard.reduce(
      (count, row) =>
        count +
        row.reduce(
          (count2, square) =>
            square.value !== -1 && square.state === 0 ? count2 + 1 : count2,
          0
        ),
      0
    );

    setsquares(shuffledBoard);

    if (emptySquares === 0) {
      shuffledBoard.map(row => row.map(square => ({ ...square, state: 1 })));
      setWin(true);
    }
  };

  const handleButtonContextMenu = (row_i, row_j) => e => {
    e.preventDefault();

    if (win || lose) {
      return;
    }

    if (!isOK) return;

    const square = squares[row_i][row_j];

    if (square.state === 1) {
      return;
    }

    
    if (square.state === 0) {
      let newSquares = squareProperty(squares, row_i, row_j, "state", 2);
      setsquares(newSquares);
      setMineCounter(mineCounter - 1);
      return;
    }

    
    const newSquares = squareProperty(squares, row_i, row_j, "state", 0);
    setsquares(newSquares);
    setMineCounter(mineCounter + 1);
  };

  const handleEmojiClick = e => {
    e.preventDefault();
    if (isOK) {
      setsquares(createBoard());
      setIsOK(false);
      setMineCounter(BOMBS_AMOUNT);
      setTime(0);
      setLose(false);
      setWin(false);
      setEmotion(emotions.normal);
    }
  };

  const showHiddenBombs = squaresInfo => {
    return squaresInfo.map(row =>
      row.map(square => {
        if (square.value === -1) {
          return {
            ...square,
            state: 1
          };
        }

        return square;
      })
    );
  };

  const openNearest = (squaresInfo, row_i, row_j) => {
    // open current square first
    let newSquares = squareProperty(squaresInfo, row_i, row_j, "state", 1);

    const topLeftsquare =
      row_i > 0 && row_j > 0
        ? squaresInfo[row_i - 1][row_j - 1]
        : null;
    const topsquare = row_i > 0 ? squaresInfo[row_i - 1][row_j] : null;
    const topRightsquare =
      row_i > 0 && row_j < 15
        ? squaresInfo[row_i - 1][row_j + 1]
        : null;
    const leftsquare = row_j > 0 ? squaresInfo[row_i][row_j - 1] : null;
    const rightsquare = row_j < 15 ? squaresInfo[row_i][row_j + 1] : null;
    const bottomLeftsquare =
      row_i < 15 && row_j > 0
        ? squaresInfo[row_i + 1][row_j - 1]
        : null;
    const bottomsquare = row_i < 15 ? squaresInfo[row_i + 1][row_j] : null;
    const bottomRightsquare =
      row_i < 15 && row_j < 15
        ? squaresInfo[row_i + 1][row_j + 1]
        : null;

    if (topLeftsquare && topLeftsquare.state === 0 && topLeftsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i - 1, row_j - 1);
    } else if (
      topLeftsquare &&
      topLeftsquare.state === 0 &&
      topLeftsquare.value > 0
    ) {
      newSquares = squareProperty(newSquares, row_i - 1, row_j - 1, "state", 1);
    }

    if (topsquare && topsquare.state === 0 && topsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i - 1, row_j);
    } else if (topsquare && topsquare.value > 0) {
      newSquares = squareProperty(newSquares, row_i - 1, row_j, "state", 1);
    }

    if (topRightsquare && topsquare.state === 0 && topRightsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i - 1, row_j + 1);
    } else if (topRightsquare && topRightsquare.value > 0) {
      newSquares = squareProperty(newSquares, row_i - 1, row_j + 1, "state", 1);
    }

    if (leftsquare && leftsquare.state === 0 && leftsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i, row_j - 1);
    } else if (leftsquare && leftsquare.state === 0 && leftsquare.value > 0) {
      newSquares = squareProperty(newSquares, row_i, row_j - 1, "state", 1);
    }

    if (rightsquare && rightsquare.state === 0 && rightsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i, row_j + 1);
    } else if (rightsquare && rightsquare.state === 0 && rightsquare.value > 0) {
      newSquares = squareProperty(newSquares, row_i, row_j + 1, "state", 1);
    }

    if (
      bottomLeftsquare &&
      bottomLeftsquare.state === 0 &&
      bottomLeftsquare.value === 0
    ) {
      newSquares = openNearest(newSquares, row_i + 1, row_j - 1);
    } else if (
      bottomLeftsquare &&
      bottomLeftsquare.state === 0 &&
      bottomLeftsquare.value > 0
    ) {
      newSquares = squareProperty(newSquares, row_i + 1, row_j - 1, "state", 1);
    }

    if (bottomsquare && bottomsquare.state === 0 && bottomsquare.value === 0) {
      newSquares = openNearest(newSquares, row_i + 1, row_j);
    } else if (bottomsquare && bottomsquare.state === 0 && bottomsquare.value > 0) {
      newSquares = squareProperty(newSquares, row_i + 1, row_j, "state", 1);
    }

    if (
      bottomRightsquare &&
      bottomRightsquare.state === 0 &&
      bottomRightsquare.value === 0
    ) {
      newSquares = openNearest(newSquares, row_i + 1, row_j + 1);
    } else if (
      bottomRightsquare &&
      bottomRightsquare.state === 0 &&
      bottomRightsquare.value > 0
    ) {
      newSquares = squareProperty(newSquares, row_i + 1, row_j + 1, "state", 1);
    }

    return newSquares;
  };

  return (
    <div className="App">
      <div className="Header">
        <Timer value={minutes} />
        <div className="emoji" onClick={handleEmojiClick}>
          <span role="img" aria-label="smiley">
            {emotion}
          </span>
        </div>
        <Timer value={seconds} />
      </div>
      <div className="Body">{renderRows()}</div>
    </div>
  );
};

export default App;
