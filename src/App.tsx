import React, { useState } from 'react';
import logo from './RestBI-logo.png';
import './App.css';
import { Model, RestBIClient } from 'restbi-sdk';
import { AdventureWorksModel } from './models/adventureworks';
import { ChinookModel } from './models/chinook';
import ReportBuilder from './ReportBuilder';
import { Button, Select, MenuItem } from '@mui/material';
import ModelValidationPage from './ModelBuilder';

let client = new RestBIClient(process.env.RESTBI_SERVER_URL || "http://localhost:3000");

function App() {
  const [activeModel, setActiveModel] = useState<Model>(ChinookModel);
  const [currentView, setCurrentView] = useState<'reportBuilder' | 'otherComponent'>('reportBuilder');

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex flex-row bg-white items-center pl-4 border-b-2" style={{ height: '70px' }}>
        <img src={logo} className="w-10 h-10" alt="logo" />
        <h1 className="text-2xl font-bold ml-2">RestBI</h1>
        <h1 className="ml-4">Report Builder Demo App</h1>
        <div className="flex flex-row ml-auto">
          <Select
            className="w-48 mr-2 my-2"
            value={activeModel.name}
            onChange={(e) => {
              if (e.target.value === 'ChinookModel') {
                setActiveModel(ChinookModel);
              } else {
                setActiveModel(AdventureWorksModel);
              }
            }}
          >
            <MenuItem value="ChinookModel">Chinook</MenuItem>
            <MenuItem value="AdventureWorksModel">AdventureWorks</MenuItem>
          </Select>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCurrentView(currentView === 'reportBuilder' ? 'otherComponent' : 'reportBuilder')}
          >
            Switch to {currentView === 'reportBuilder' ? 'Other Component' : 'Report Builder'}
          </Button>
        </div>
      </div>
      <div className="flex flex-row h-full w-full">
        {currentView === 'reportBuilder' ? (
          <ReportBuilder client={client} activeModel={activeModel} />
        ) : (
          <ModelValidationPage />
        )}
      </div>
    </div>
  );
}

export default App;
