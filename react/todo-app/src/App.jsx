import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState([]);

  const addTodo = () => {
    if (input.trim() === "") return;

    setTodos([...todos, { text: input, completed: false }]);
    setInput("");
  };

  const toggleTodo = (index) => {
    const updatedTodos = [...todos];
    updatedTodos[index].completed = !updatedTodos[index].completed;
    setTodos(updatedTodos);
  };

  const deleteTodo = (index) => {
    const filteredTodos = todos.filter((_, i) => i !== index);
    setTodos(filteredTodos);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h1>Todo App</h1>

      <input
        type="text"
        placeholder="Enter a task"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={addTodo} style={{ marginLeft: "10px" }}>
        Add
      </button>

      <ul style={{ paddingLeft: "20px", marginTop: "20px" }}>
        {todos.map((todo, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <span
              onClick={() => toggleTodo(index)}
              style={{
                cursor: "pointer",
                textDecoration: todo.completed ? "line-through" : "none"
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(index)}
              style={{ marginLeft: "10px" }}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
