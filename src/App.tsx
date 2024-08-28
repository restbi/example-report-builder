import React, { useState } from 'react';
import logo from './RestBear.png';
import './App.css';
import { Model, RestBIClient } from 'restbi-sdk';
import { AdventureWorksModel } from './models/adventureworks';
import { ChinookModel } from './models/chinook';
import ReportBuilder from './ReportBuilder';
import { Button, Select, MenuItem } from '@mui/material';
import ModelValidationPage from './ModelBuilder';
import ModelBuilder from './ModelBuilder';
import Dashboard from './Dashboard';

let client = new RestBIClient(process.env.RESTBI_SERVER_URL || "http://localhost:3000");

enum DemoPage {
  ReportBuilder = 'Report Builder',
  ModelBuilder = 'Model Helper',
  Dashboard = 'Simple Dashboard'
}

function App() {
  const [activeModel, setActiveModel] = useState<Model>(ChinookModel);
  const [currentView, setCurrentView] = useState<DemoPage>(DemoPage.ReportBuilder);

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex flex-row bg-white items-center pl-4 border-b-2" style={{ height: '70px' }}>
        <img src={logo} className="w-10 h-10" alt="logo" />
        <h1 className="text-2xl font-bold ml-2">RestBI</h1>
        <h1 className="ml-4">Demo App</h1>
        <Select
            className="w-48 ml-4 mr-2 my-2"
            value={currentView}
            onChange={(e) => {
              if (e)
              setCurrentView(e.target.value as DemoPage)
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
              },
          }}
          >
            <MenuItem value={DemoPage.ReportBuilder}>{DemoPage.ReportBuilder}</MenuItem>
            <MenuItem value={DemoPage.ModelBuilder}>{DemoPage.ModelBuilder}</MenuItem>
            <MenuItem value={DemoPage.Dashboard}>{DemoPage.Dashboard}</MenuItem>
        </Select>

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

        </div>
      </div>
      <div className="flex flex-row h-full w-full">
        {currentView === DemoPage.ReportBuilder && (
          <ReportBuilder client={client} activeModel={activeModel} />
        )}
        {currentView === DemoPage.ModelBuilder && (
          <ModelBuilder defaultModel={activeModel} key={JSON.stringify(activeModel)}/>
        )}
        {currentView === DemoPage.Dashboard && (
          <Dashboard client={client} activeModel={activeModel}/>
        )}
      </div>
    </div>
  );
}

export default App;
