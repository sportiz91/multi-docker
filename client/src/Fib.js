import React, { useEffect, useState } from "react";
import axios from "axios";

export const Fib = () => {
  const [state, setState] = useState({
    seenIndexes: [],
    values: {},
    index: "",
  });

  const renderSeenIndexes = () =>
    state.seenIndexes.map(({ number }) => number).join(", ");

  const renderValues = () => {
    const entries = [];

    for (let key in state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {state.values[key]}
        </div>
      );
    }

    return entries;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post("/api/values", {
      value: state.index,
    });

    setState({ ...state, index: "" });
  };

  useEffect(() => {
    (async () => {
      const fetchValues = await axios.get("/api/values/current");
      const fetchIndexes = await axios.get("/api/values/all");

      setState({
        ...state,
        values: fetchValues.data,
        seenIndexes: fetchIndexes.data,
      });
    })();
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Enter your index:</label>
        <input
          value={state.index}
          onChange={(e) => setState({ ...state, index: e.target.value })}
        />
        <button>submit</button>
      </form>

      <h3>Indexes I have seen:</h3>
      {renderSeenIndexes()}

      <h3>Calculated values:</h3>
      {renderValues()}
    </div>
  );
};
