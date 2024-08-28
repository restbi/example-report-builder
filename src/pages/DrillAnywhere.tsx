import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  Column,
  ColumnType,
  inferColumnType,
  Model,
  Query,
  RestBIClient,
  SQLResult,
  SortClause,
  Table,
  SortDirection,
  QueryFilter,
  ColumnDataType,
} from "restbi-sdk";
import { ChinookModel } from "../models/chinook";
import { FormControl, InputLabel, MenuItem, Select, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import Filter from "../Filter";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardProps {
  client: RestBIClient;
  activeModel: Model;
}

const DrillAnywhere = ({ client, activeModel }: DashboardProps) => {
  const [chartData, setChartData] = useState<SQLResult | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [openDrillDownModal, setOpenDrillDownModal] = useState<boolean>(false);
  const [drillDownValue, setDrillDownValue] = useState<string>("");
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  
  const drillDown = (newDimension: string) => {
    const newFilter = {
        column: selectedDimension,
        operator: "=",
        value: drillDownValue,
    };
    const updatedFilters = [...filters, newFilter];
    setSelectedDimension(newDimension);
    setFilters(updatedFilters);
 };
  useEffect(() => {
    if (selectedDimension && selectedMetric) {
      const query: Query = {
        columns: [selectedDimension, selectedMetric],
        filters: filters,
        limit: 50,
        sortBy: {
            name: selectedMetric,
            direction: SortDirection.DESC,
        },
      };

      client.executeQuery(query, activeModel).then((data) => {
        setChartData(data);
      });
    }
  }, [client, selectedDimension, selectedMetric]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        
        suggestedMin: 0,
        max:
          chartData &&
          Math.max(...chartData.rows.map((item) => item[selectedMetric])) * 1.2 || 0,
        ticks: {
          callback: function (value: any) {
            return "₺" + value.toLocaleString("tr-TR");
          },
        },
      },
    },
    onClick: function (e: any, elements: any) {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const label = chartData?.rows[elementIndex][selectedDimension];
            setDrillDownValue(label);
            setOpenDrillDownModal(true);
        }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            return "Custom Label Text: " + tooltipItem.formattedValue;
          },
        },
      },
      datalabels: {
        formatter: function (value: any) {
          return "₺" + new Intl.NumberFormat("tr-TR").format(value);
        },
        color: "white",
        font: {
          weight: "bold" as const,
          size: 14,
          family: "Poppins",
        },
      },
    },
  };

  const backgroundColors = ["#53D9D9", "#002B49", "#0067A0"];

  const data = chartData
    ? {
        labels: chartData.rows.map((item) => item[selectedDimension]),
        datasets: [
          {
            label: selectedMetric,
            data: chartData.rows.map((item) => item[selectedMetric]),
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      }
    : { labels: [], datasets: [] };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row w-full p-8">
        <FormControl variant="outlined" style={{ minWidth: 200, marginRight: 20 }}>
          <InputLabel>Dimension</InputLabel>
          <Select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value as string)}
            label="Dimension"
          >
            {activeModel && activeModel.tables
                .flatMap((table: Table) =>
                table.columns.map((column: Column) => {
                    if (inferColumnType(column) === ColumnType.DIMENSION) {
                        return (<MenuItem key={column.name} value={column.name}>
                            {column.name}
                        </MenuItem>);
                    }
                    return null;
                })
            )}
          </Select>
        </FormControl>
        <FormControl variant="outlined" style={{ minWidth: 200, marginRight: 20 }}>
          <InputLabel>Metric</InputLabel>
          <Select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as string)}
            label="Metric"
          >
            {activeModel && activeModel.tables
                .flatMap((table: Table) =>
                table.columns.map((column: Column) => {
                    if (inferColumnType(column) === ColumnType.MEASURE) {
                        return (<MenuItem key={column.name} value={column.name}>
                            {column.name}
                        </MenuItem>);
                    }
                    return null;
                })
            )}
          </Select>
        </FormControl>
      </div>
      <div className="flex flex-row px-8 pb-4 space-x-2">
            {filters.map((filter) => (
              <div className="flex flex-row p-1 border-2 rounded-md mt-2" key={filter.column}>
                <Filter
                  activeModel={activeModel}
                  filter={filter}
                  key={filter.column}
                  column={
                    activeModel.tables.flatMap((table: Table) => table.columns).find((col: Column) => col.name === filter.column) || { id: 'unknown', name: filter.column, dataType: ColumnDataType.STRING } as Column
                  }
                  onFilterChange={(newFilter) => {
                    setFilters(filters.map((f) => f.column === newFilter.column ? newFilter : f));
                  }}
                  onClose={() => {
                    setFilters(filters.filter((f) => f.column !== filter.column));
                  }}
                />
              </div>
            ))}
        </div>
      <div className="flex flex-row w-full h-1/2  px-8 py-4">
            <div className="flex flex-col w-full h-full px-4 py-8 border-2 rounded-lg">
            {chartData && selectedDimension && selectedMetric && (
              <div className="flex flex-col w-full h-full px-4 pb-4">
                  <h1 className="text-lg font-bold mb-8">
                      {selectedMetric} by {selectedDimension}
                  </h1>
                  <Bar data={data} options={options} />
              </div>
            )}
            {!chartData && (
              <div className="flex flex-col w-full h-full items-center justify-center">
                  <h1 className="text-xl font-bold text-center mb-4">
                      Select a Dimension and Metric to get started.
                  </h1>
              </div>
              )}
              </div>
      </div>
      <div className="flex px-8 py-0">
        Click on a bar to drill down into the data.
      </div>
      <Dialog open={openDrillDownModal} onClose={() => setOpenDrillDownModal(false)}>
        <DialogTitle>Select a Dimension to Drill Down Into</DialogTitle>
        <DialogContent>
            <FormControl variant="outlined" style={{ minWidth: 200, marginTop: 20 }}>
            <InputLabel>Drill-Down Dimension</InputLabel>
            <Select
                value=""  // Empty value, so it doesn't track a specific selection
                onChange={(e) => {
                  const newDimension = e.target.value as string;
                  drillDown(newDimension);
                  setOpenDrillDownModal(false);
                }}
                label="Drill-Down Dimension"
                displayEmpty
            >
                {activeModel && activeModel.tables
                    .flatMap((table: Table) =>
                    table.columns.map((column: Column) => {
                        if (inferColumnType(column) === ColumnType.DIMENSION) {
                            return (<MenuItem key={column.name} value={column.name}>
                                {column.name}
                            </MenuItem>);
                        }
                        return null;
                    })
                )}
            </Select>
            </FormControl>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenDrillDownModal(false)} color="secondary">
            Cancel
            </Button>
        </DialogActions>
        </Dialog>



    </div>
  );
};

export default DrillAnywhere;
