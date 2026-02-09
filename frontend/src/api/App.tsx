// ...existing code...
import { useEffect } from "react";
import { getDashboardSummary } from "./dashboard";

function App() {
  useEffect(() => {
    getDashboardSummary().then((data) => {
      console.log("FRONTEND GOT:", data);
    });
  }, []);

  return <h1>Check console</h1>;
}

export default App;