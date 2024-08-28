import React, { useEffect, useState } from 'react';
import { Column, ColumnDataType, ColumnType, Formula, Model, Query, QueryFilter, RestBIClient, SQLError, SQLResult, Table, inferColumnType } from 'restbi-sdk';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { FaFilter } from "react-icons/fa";
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import { FormControl } from '@mui/material';
import Filter from './Filter';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { EditorView, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

type ReportBuilderProps = {
  client: RestBIClient;
  activeModel: Model;
};

const ReportBuilder: React.FC<ReportBuilderProps> = ({ client, activeModel }) => {
  const [data, setData] = useState<SQLResult | null>(null);
  const [error, setError] = useState<SQLError | null>(null);
  const [searchString, setSearchString] = useState<string>('');
  const [query, setQuery] = useState<Query>({
    columns: [],
    limit: 100,
  });
  const [filters, setFilters] = useState<QueryFilter[]>([]);

  const executeQuery = () => {
    client.executeQuery(query, activeModel).then((data) => {
      setData(data);
      setError(null);
    }).catch((err) => {
      setError(err);
    });
  };

  useEffect(() => {
    setQuery({
      ...query,
      filters: filters,
    });
  }, [filters]);

  useEffect(() => {
    client.validateModel(activeModel).then((result) => {
      console.log(result);
    }).catch((err) => {
      console.error(err);
    });
    setQuery({
      columns: [],
      limit: 100,
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
          {activeModel && activeModel.tables.filter((table: Table) => {
            return table.columns.filter((column: Column) => {
              if (searchString === '') {
                return true;
              }
              return column.name?.toLowerCase().includes(searchString.toLowerCase());
            }).length > 0;
          }).map((table: Table) => (
            <div className="flex flex-col mb-4" key={table.id}>
              <h1 className="font-bold text-white mb-2">{table.name}</h1>
              {table.columns.filter((column: Column) => {
                if (searchString === '') {
                  return true;
                }
                return column.name?.toLowerCase().includes(searchString.toLowerCase());
              }).map((column: Column) => (
                <div className="flex flex-row items-center pr-2 py-2 hover:bg-gray-700" key={column.name}>
                  <Checkbox
                    checked={query.columns.includes(column.name)}
                    className="h-5"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setQuery({
                          ...query,
                          columns: [...query.columns, column.name ? column.name : '']
                        });
                      } else {
                        setQuery({
                          ...query,
                          columns: query.columns.filter((col) => col !== column.name)
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
                  <label style={{color:inferColumnType(column) === ColumnType.DIMENSION ? '#157ded' : '#1eba2b'}} className={`w-full text-sm`} htmlFor={column.name}>
                    {column.name}
                  </label>
                  <button
                    onClick={() => {
                      setFilters([...filters, {
                        column: column.name ? column.name : '',
                        operator: '=',
                        value: undefined,
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
            {activeModel.formulas.filter((formula: Formula) => {
              if (searchString === '') {
                return true;
              }
              return formula.name?.toLowerCase().includes(searchString.toLowerCase());
            }).map((formula: Formula) => (
              <div className="flex flex-row items-center pr-2 py-2 hover:bg-gray-700" key={formula.id}>
                <Checkbox
                  className="h-6"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setQuery({
                        ...query,
                        columns: [...query.columns, formula.name]
                      });
                    } else {
                      setQuery({
                        ...query,
                        columns: query.columns.filter((col) => col !== formula.name)
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
                  limit: parseInt(e.target.value)
                })}
                value={query.limit}
                placeholder="Enter limit"
              />
            </div>
          </div>
          <div className="flex flex-row p-4 space-x-2">
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
        </div>
        <div className="flex flex-col px-4 space-y-2">
          <h1 className="font-bold">Query</h1>
          <CodeMirror
                    value={stringify(query)}
                    extensions={[json()]}
                    theme={okaidia}
                    height="200px"
                    editable={false}
                />
        </div>
        <div className="flex flex-col p-4">
          <button onClick={executeQuery} style={{background:'#1D66B5'}} className="text-white p-2 rounded-md">Run Query</button>
        </div>
        <div
          className="w-full p-4 ag-theme-quartz"
          style={{ height: 500 }}
        >
          {data && !error && (
            <AgGridReact
              rowData={data.rows}
              columnDefs={data.columns.map((column) => ({ headerName: column, field: column }))}
            />
          )}
        </div>
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



export const stringify = (obj: {}, indent = 2) =>
  JSON.stringify(obj, (key, value) => {
    if (Array.isArray(value) && !value.some(x => x && typeof x === 'object')) {
      return `\uE000${JSON.stringify(value.map(v => typeof v === 'string' ? v.replace(/"/g, '\uE001') : v))}\uE000`;
    }
    return value;
  }, indent).replace(/"\uE000([^\uE000]+)\uE000"/g, match => match.slice(2, -2).replace(/\\"/g, '"').replace(/\uE001/g, '\\\"'));

export default ReportBuilder;
