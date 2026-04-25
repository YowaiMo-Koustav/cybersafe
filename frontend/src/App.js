import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Extension from "./pages/Extension";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/extension" element={<Extension />} />
        </Routes>
        <Toaster theme="dark" position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
