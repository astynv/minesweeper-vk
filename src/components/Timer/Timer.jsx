
import React from "react";

const Timer = ({value}) => {
    return(
      <div className="Display">
      {value}
      <div>⏳</div>
    </div>
  )
  };

export default Timer;