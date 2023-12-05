import React from "react";
import "./style/bootstrap.min.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import AwsVmMgr from "./components/AwsVmMgr";

import styled from "styled-components";
const BarContainer = styled.nav`
  padding: 8px;
  // border-bottom: 1px solid #ccc;
  display: flex;
  // background-color: rgba(var(--bs-light-rgb), 1);
  background-color: rgba(var(--bs-primary-rgb), 1) !important;
  color: white !important;
`;

const Title = styled.h1`
  font-size: 1.5em;
  text-align: left;
  padding: 8px 20px 8px 10px;
  margin: 0;
`;

const BarLink = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  margin: 12px 14px 0 14px;
  color: #abc !important;
  &:hover {
    color: #66a593;
  }
`;

function App() {
  return (
    <Router>
      <BarContainer classname="navbar bg-primary">
        <Title>Dev Portal</Title>
        <Link to="/vms">
          <BarLink>Virtual Machines</BarLink>
        </Link>
      </BarContainer>

      <Routes>
        <Route exact path="/" element={<AwsVmMgr />}></Route>
        <Route exact path="/vms" element={<AwsVmMgr />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
