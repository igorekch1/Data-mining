import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
function App() {
  return (
    <Router>
      <div>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/dashboard">
            <Dashboard />
          </Route>
          <Route path="/payment">
            <Payment />
          </Route>
        </Switch>
      </div>
    </Router>
    
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
        <ul>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
    </div>
  );
}

function About() {
  return (
    <div>
    <h2>About</h2>
      <ul>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/">Home</Link>
        </li>
      </ul>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <ul>
        <li>
          <Link to="/payment">Payment</Link>
        </li>
      </ul>
    </div>
  );
}

function Payment() {
  return (
    <div>
      <h2>Payment</h2>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
      </ul>
    </div>
  );
}

export default App;
