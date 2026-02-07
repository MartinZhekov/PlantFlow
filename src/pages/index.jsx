import Layout from "./Layout.jsx";
import Analytics from "./Analytics";
import Dashboard from "./Dashboard";
import PlantDetails from "./PlantDetails";
import Profile from "./Profile";
import Register from "./Register";
import Settings from "./Settings";
import SignIn from "./SignIn";
import LandingPage from "./LandingPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export default function Pages() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plant-details/:id" element={<PlantDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </Layout>
    </Router>
  );
}