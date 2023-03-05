import React from "react";
const redFlag = '🚩';
const bomb = '💣';

const Clicker = ({ onClick, onContext, row, col, state, value, red }) => {
    const displayContent = () => {
      if (state === 2) {
        return <span>{redFlag}</span>;
      }
  
      if (state === 1) {
        if (value === -1) {
          return <span>{bomb}</span>;
        }
  
        if (value > 0) {
          return value;
        }
      }
  
      return null;
    };
  
    return (
      <div
        className={`Button value-${value} ${state === 1 ? "visible" : ""} ${
          red ? "red" : ""
        }`}
        onClick={onClick(row, col)}
        onContextMenu={onContext(row, col)}
      >
        {displayContent()}
      </div>
    );
  };

  export default Clicker;