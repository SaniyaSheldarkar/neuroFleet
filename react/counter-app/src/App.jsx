import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Counter App</h1>
      <h2>{count}</h2>

      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button
        onClick={() => setCount(count - 1)}
        disabled={count === 0}
        style={{ marginLeft: "10px" }}
      >
        Decrement
      </button>
      <button
        onClick={() => setCount(0)}
        style={{ marginLeft: "10px" }}
      >
        Reset
      </button>
    </div>
  );
}

export default App;
