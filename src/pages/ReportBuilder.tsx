import React, { useEffect, useState } from 'react';
// Importing necessary types and classes from the RestBI SDK
import { Column, ColumnDataType, ColumnType, Formula, Model, Query, QueryFilter, RestBIClient, SQLError, SQLResult, Table, inferColumnType } from 'restbi-sdk';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { FaFilter } from "react-icons/fa";
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { FormControl } from '@mui/material';
import Filter from '../Filter';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { EditorView, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Defining the properties expected in the ReportBuilder component
type ReportBuilderProps = {
  client: RestBIClient; // RestBIClient instance for executing queries
  activeModel: Model; // The currently active data model used in the report
};

// Main ReportBuilder component
const ReportBuilder: React.FC<ReportBuilderProps> = ({ client, activeModel }) => {
  const [data, setData] = useState<SQLResult | null>(null); // State to hold the query results
  const [error, setError] = useState<SQLError | null>(null); // State to hold any errors from query execution
  const [searchString, setSearchString] = useState<string>(''); // State for handling column search
  const [query, setQuery] = useState<Query>({
    columns: [], // The columns selected in the query
    limit: 100,  // Limit on the number of rows returned by the query
  });
  const [filters, setFilters] = useState<QueryFilter[]>([]); // State for managing query filters

  // Function to execute the query using the RestBI client
  const executeQuery = () => {
    client.executeQuery(query, activeModel).then((data) => {
      setData(data); // Set the query results
      setError(null); // Clear any previous errors
    }).catch((err) => {
      setError(err); // Set the error if query execution fails
    });
  };

  // Effect to update the query whenever filters change
  useEffect(() => {
    setQuery({
      ...query,
      filters: filters, // Update the filters in the query
    });
  }, [filters]);

  // Effect to validate the model and reset the query when the active model changes
  useEffect(() => {
    client.validateModel(activeModel).then((result) => {
      console.log(result); // Log the validation result (could be used to show validation errors)
    }).catch((err) => {
      console.error(err); // Log any errors encountered during validation
    });
    setQuery({
      columns: [], // Reset columns in the query
      limit: 100,  // Reset the limit
    });
  }, [activeModel, client]);

  return (
    <div className="flex flex-row h-full w-full">
      <div className="flex flex-col border-r-2 p-2 overflow-y-auto overflow-x-hidden" style={{background:'#272822', scrollbarWidth: 'thin', width: '400px', height: 'calc(100vh - 70px)' }}>
        <div id="column-search" className="text-white flex w-full">
          <TextField
            label="Search Columns"
            className="w-full border-2 border-blue-600 bg-gray-700 rounded-md text-white"
            type="text"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            placeholder="Search Columns"
          />
        </div>
        <div className="flex flex-col mt-2 p-2">
          {/* Left Side Nav. Displaying the tables and columns from the active model. */}
          {activeModel && activeModel.tables.filter((table: Table) => {
            return table.columns.filter((column: Column) => {
              if (searchString === '') {
                return true; // Show all columns if there's no search string
              }
              return column.name?.toLowerCase().includes(searchString.toLowerCase()); // Filter columns by search string
            }).length > 0;
          }).map((table: Table) => (
            <div className="flex flex-col mb-4" key={table.id}>
              <h1 className="font-bold text-white mb-2">{table.name}</h1>
              {table.columns.filter((column: Column) => {
                if (searchString === '') {
                  return true; // Show all columns if there's no search string
                }
                return column.name?.toLowerCase().includes(searchString.toLowerCase()); // Filter columns by search string
              }).map((column: Column) => (
                <div className="flex flex-row items-center pr-2 py-2 hover:bg-gray-700" key={column.name}>
                  {/* Checkbox to select/deselect columns in the query */}
                  <Checkbox
                    checked={query.columns.includes(column.name)}
                    className="h-5"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setQuery({
                          ...query,
                          columns: [...query.columns, column.name ? column.name : ''] // Add column to query if checked
                        });
                      } else {
                        setQuery({
                          ...query,
                          columns: query.columns.filter((col) => col !== column.name) // Remove column from query if unchecked
                        });
                      }
                    }}
                    sx={{
                      '& .MuiSvgIcon-root': {
                          backgroundColor: '#454545', // Light gray background when unchecked
                          borderRadius: '4px', // Optional: for rounded corners
                          padding:'0px',
                          margin:'0px'
                      },
                      '&:hover .MuiSvgIcon-root': {
                          backgroundColor: '#e0e0e0', // Slightly darker gray on hover
                      },
                      '&.Mui-checked .MuiSvgIcon-root': {
                          backgroundColor: 'transparent', // Remove background when checked
                      },
                  }}
                    id={column.name}
                    name={column.name}
                    value={column.name}
                  />
                  {/* Displaying column names with color based on their type */}
                  <label style={{color:inferColumnType(column) === ColumnType.DIMENSION ? '#157ded' : '#1eba2b'}} className={`w-full text-sm`} htmlFor={column.name}>
                    {column.name}
                  </label>
                  {/* Button to add a filter for the selected column */}
                  <button
                    onClick={() => {
                      setFilters([...filters, {
                        column: column.name ? column.name : '',
                        operator: '=', // Default operator for the filter
                        value: undefined, // Placeholder for the filter value
                      }]);
                    }}
                    className="text-gray-400 p-1 rounded-md"
                  >
                    <FaFilter className="h-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-col mb-4">
            <h1 className="font-bold text-white mb-2">Formulas</h1>
            {/* Displaying formulas defined in the active model */}
            {activeModel.formulas.filter((formula: Formula) => {
              if (searchString === '') {
                return true; // Show all formulas if there's no search string
              }
              return formula.name?.toLowerCase().includes(searchString.toLowerCase()); // Filter formulas by search string
            }).map((formula: Formula) => (
              <div className="flex flex-row items-center pr-2 py-2 hover:bg-gray-700" key={formula.id}>
                {/* Checkbox to select/deselect formulas in the query */}
                <Checkbox
                  className="h-6"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setQuery({
                        ...query,
                        columns: [...query.columns, formula.name] // Add formula to query if checked
                      });
                    } else {
                      setQuery({
                        ...query,
                        columns: query.columns.filter((col) => col !== formula.name) // Remove formula from query if unchecked
                      });
                    }
                  }}
                  id={formula.name}
                  name={formula.name}
                  value={formula.name}
                />
                <label className="ml-2 text-gray-300" htmlFor={formula.name}>{formula.name}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full overflow-y-auto overflow-x-hidden" style={{ height: 'calc(100vh - 75px)', scrollbarWidth: 'thin' }}>
        <div className="flex flex-col px-4 mt-4">
          <div className="flex flex-row space-x-2">
            <FormControl>
              <div className="flex flex-col w-48">
                <TextField label="Sort By" className="border-2 border-blue-600" type="text" placeholder="Enter column name" />
              </div>
            </FormControl>
            <div className="flex flex-col w-48">
              <TextField
                label="Limit"
                className="border-2 border-blue-600"
                type="number"
                onChange={(e) => setQuery({
                  ...query,
                  limit: parseInt(e.target.value) // Update the limit in the query based on user input
                })}
                value={query.limit}
                placeholder="Enter limit"
              />
            </div>
          </div>
          <div className="flex flex-row p-4 space-x-2">
            {/* Displaying the filters applied to the query, breadcrumbs */}
            {filters.map((filter) => (
              <div className="flex flex-row p-1 border-2 rounded-md mt-2" key={filter.column}>
                <Filter
                  activeModel={activeModel} // Pass the active model to the filter component
                  filter={filter} // Pass the current filter to the filter component
                  key={filter.column}
                  column={
                    activeModel.tables.flatMap((table: Table) => table.columns).find((col: Column) => col.name === filter.column) || { id: 'unknown', name: filter.column, dataType: ColumnDataType.STRING } as Column
                  }
                  onFilterChange={(newFilter) => {
                    setFilters(filters.map((f) => f.column === newFilter.column ? newFilter : f)); // Update the filter when it changes
                  }}
                  onClose={() => {
                    setFilters(filters.filter((f) => f.column !== filter.column)); // Remove the filter if it's closed
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col px-4 space-y-2">
          <h1 className="font-bold">Query</h1>
          {/* Displaying the query in a read-only JSON editor using CodeMirror */}
          <CodeMirror
            value={stringify(query)}
            extensions={[json()]}
            theme={okaidia}
            height="200px"
            editable={false}
          />
        </div>
        <div className="flex flex-col p-4">
          {/* Button to execute the query */}
          <button onClick={executeQuery} style={{background:'#1D66B5'}} className="text-white p-2 rounded-md">Run Query</button>
        </div>
        <div
          className="w-full p-4 ag-theme-quartz"
          style={{ height: 500 }}
        >
          {/* Displaying the query results in an ag-Grid table if data is present */}
          {data && !error && (
            <AgGridReact
              rowData={data.rows} // Rows from the query result
              columnDefs={data.columns.map((column) => ({ headerName: column, field: column }))} // Columns from the query result
            />
          )}
        </div>
        {/* Displaying any errors encountered during query execution */}
        {error &&
          <div className="flex flex-col justify-center w-full h-38 p-16">
            <div className="font-bold w-full flex justify-center text-2xl margin-auto text-red-400">Error</div>
            <div className="mt-2 w-full flex justify-center">{error.message}</div>
            <div className="text-lg font-bold mt-8">Generated SQL Query</div>
            <div className="mt-4">{error.query}</div>
          </div>}
      </div>
    </div>
  );
};

// Function to safely stringify the query object for display
export const stringify = (obj: {}, indent = 2) =>
  JSON.stringify(obj, (key, value) => {
    if (Array.isArray(value) && !value.some(x => x && typeof x === 'object')) {
      return `\uE000${JSON.stringify(value.map(v => typeof v === 'string' ? v.replace(/"/g, '\uE001') : v))}\uE000`;
    }
    return value;
  }, indent).replace(/"\uE000([^\uE000]+)\uE000"/g, match => match.slice(2, -2).replace(/\\"/g, '"').replace(/\uE001/g, '\\\"'));

export default ReportBuilder;
