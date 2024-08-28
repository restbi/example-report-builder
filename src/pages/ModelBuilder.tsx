import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, List, ListItem, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
// Importing necessary types and classes from the RestBI SDK
import { RestBIClient, Model, Table, ValidationResult } from 'restbi-sdk';
import { EditorView, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Initializing the RestBI client with an API URL
let client = new RestBIClient(process.env.REACT_APP_API_URL || "http://localhost:3000");

interface ModelBuilderProps {
    defaultModel: Model; // The initial model to be loaded
}

const ModelBuilder: React.FC<ModelBuilderProps> = ({ defaultModel }) => {
    const [modelInput, setModelInput] = useState<string>(''); // State to hold the JSON input of the model
    const [model, setModel] = useState<Model | null>(defaultModel); // State to hold the model object
    const [metadata, setMetadata] = useState<Table[] | null>(null); // State to hold metadata from validation
    const [errorList, setErrorList] = useState<{ message: string, line: number }[]>([]); // State to hold validation errors
    const [loading, setLoading] = useState(false); // State to show loading indicator
    const [problematicTables, setProblematicTables] = useState<Set<string>>(); // State to track tables with validation issues

    // Effect to set the model input with a prettified JSON version of the default model
    useEffect(() => {
        setModelInput(prettifyJson(JSON.stringify(defaultModel)));
    }, []);

    // Effect to parse and set the model whenever the input changes
    useEffect(() => {
        try {
            const parsedModel = JSON.parse(modelInput);
            setModel(parsedModel);
        } catch (error) {
            console.error('Invalid JSON format', error);
            setModel(null); // Clear model if JSON is invalid
        }
    }, [modelInput]);

    // Function to handle the validation of the model
    const handleValidation = async () => {
        if (!model) {
            console.error('Cannot validate. Model is invalid or not set.');
            return;
        }
        setLoading(true);
        setErrorList([]); // Clear previous errors
        try {
            // Validate the model using the RestBI client
            const validationResult: ValidationResult = await client.validateModel(model);
            setMetadata(validationResult.dbTables); // Set metadata from the validation result
            setModel(validationResult.model); // Update the model with the validated version
            setModelInput(prettifyJson(JSON.stringify(validationResult.model))); // Update the input with the validated model
            const problematicTables = generateErrorList(validationResult.model.tables); // Generate the error list and get problematic tables
            setProblematicTables(problematicTables); // Set the problematic tables
        } catch (error) {
            console.error('Validation error', error);
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    // Function to generate the list of validation errors
    const generateErrorList = (tables: Table[]) => {
        const errors: { message: string, line: number, tableName: string }[] = [];
        const problematicTables: Set<string> = new Set();

        // Iterate over tables and columns to find and log validation errors
        tables.forEach((table) => {
            const tableLine = findLineNumber(modelInput, `"name": "${table.name}"`);
            if (!table.validated) {
                errors.push({ message: `Invalid Table: ${table.name}`, line: tableLine, tableName: table.name });
                problematicTables.add(table.dbName);
            }
            table.columns.forEach((column) => {
                const columnLine = findLineNumber(modelInput, `"name": "${column.name}"`, tableLine);
                if (!column.validated) {
                    errors.push({ message: `Invalid Column: ${column.name} in Table: ${table.name}`, line: columnLine, tableName: table.name });
                    problematicTables.add(table.dbName);
                }
            });
        });

        setErrorList(errors); // Set the error list state
        return problematicTables; // Return the set of problematic tables
    };

    // Utility function to find the line number of a specific string in the JSON input
    const findLineNumber = (text: string, searchString: string, startLine = 0) => {
        const lines = text.split('\n');
        for (let i = startLine; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i;
            }
        }
        return -1;
    };

    // Utility function to prettify a JSON string
    const prettifyJson = (jsonString: string): string => {
        try {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch (error) {
            console.error('Invalid JSON format', error);
            return jsonString;
        }
    };

    // Function to add a column to a table in the model
    const addColumnToModel = (tableDbName: string, column: Table["columns"][0]) => {
        if (!model) return;
        const newModel = { ...model };
        const tableIndex = newModel.tables.findIndex(t => t.dbName.toLowerCase() === tableDbName.toLowerCase());
        if (tableIndex !== -1) {
            const table = newModel.tables[tableIndex];
            const columnExists = table.columns.some(c => c.dbName.toLowerCase() === column.dbName.toLowerCase());
            if (!columnExists) {
                table.columns.push(column); // Add the column to the table if it doesn't already exist
                setModel(newModel); // Update the model state
                setModelInput(prettifyJson(JSON.stringify(newModel))); // Update the input with the new model
            }
        }
    };

    // Function to highlight lines with errors in the CodeMirror editor
    const highlightLines = EditorView.decorations.of((view) => {
        let builder = new RangeSetBuilder<Decoration>();
        errorList.forEach(error => {
            if (error.line >= 0) {
                const decoration = Decoration.line({ class: 'line-error' });
                builder.add(view.state.doc.line(error.line + 1).from, view.state.doc.line(error.line + 1).from, decoration);
            }
        });
        return builder.finish();
    });

    // Function to render metadata for database tables and their columns
    const renderMetadata = (tables: Table[], modelTables: Table[], problematicTables: Set<string>) => {
        // Sort tables based on the number of columns in modelTables
        tables.sort((a, b) => {
            const modelA = modelTables.find(mt => mt.dbName.toLowerCase() === a.dbName.toLowerCase());
            const modelB = modelTables.find(mt => mt.dbName.toLowerCase() === b.dbName.toLowerCase());
            return (modelB?.columns.length || 0) - (modelA?.columns.length || 0);
        });

        return (
            <div className='flex flex-col space-y-2'>
                {tables.map((table, index) => {
                    const modelTable = modelTables.find(mt => mt.dbName.toLowerCase() === table.dbName.toLowerCase());

                    return (
                        <div
                            className='flex flex-col'
                            key={index} 
                            style={{ 
                                backgroundColor: problematicTables.has(table.dbName) ? '#ffcccc' : 'transparent' // Highlight problematic tables
                            }}
                        >
                            <div className="font-bold">
                                {table.name} {/* Display table name */}
                            </div>
                            <div className='flex flex-wrap'>
                                {table.columns.map((column, colIndex) => {
                                    const isInModel = modelTable?.columns.some(mc => mc.dbName.toLowerCase() === column.dbName.toLowerCase());

                                    return (
                                        <div
                                            className='px-2 py-1 mr-2 mb-2 rounded-md'
                                            key={colIndex}
                                            style={{
                                                backgroundColor: isInModel ? '#cce5ff' : 'transparent', // Light blue if column is in the model
                                                fontSize: 'small',
                                            }}
                                            onClick={() => addColumnToModel(table.dbName, column)} // Add column to model on click
                                        >
                                            {column.name} {/* Display column name */}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 flex w-full">
            <div className="w-1/2 pr-4 flex flex-col">
                <h1 className="text-2xl font-bold mb-4">Model Validation Page</h1>
                <div className="flex flex-row space-x-2">
                    {/* Button to trigger model validation */}
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleValidation}
                        disabled={!model || loading}
                        className="mb-4"
                    >
                        Validate Model
                    </Button>
                </div>
                {loading && <CircularProgress className="mb-4" />} {/* Loading indicator */}

                <CodeMirror
                    value={prettifyJson(modelInput)} // Display the prettified model input in the CodeMirror editor
                    extensions={[json(), highlightLines]} // Use JSON language mode and line highlighting
                    theme={okaidia} // Set the theme for the editor
                    height="600px" // Set the height of the editor
                    onChange={(value) => setModelInput(value)} // Update model input on change
                    editable={true} // Make the editor editable
                />
                <div className="w-1/2 pl-4 border-l">
                    <h2 className="text-xl font-semibold mb-4">Validation Summary</h2>
                    <Typography variant="body1">
                        {errorList.length} error(s) found.
                    </Typography>
                    <List>
                        {errorList.map((error, index) => (
                            <ListItem key={index}>
                                {error.message} (Line {error.line + 1}) {/* Display each error and its line number */}
                            </ListItem>
                        ))}
                    </List>
                </div>
            </div>
            <div className='flex flex-col w-1/2'>
                <div className='font-bold text-2xl mb-4'>Database Tables and Column</div>
                <div className='flex p-2 overflow-y-auto' style={{scrollbarWidth:'thin', height:'calc(100vh - 150px)'}}>
                    {/* Render metadata for tables and columns */}
                    {metadata && model && renderMetadata(metadata, model?.tables , problematicTables ? problematicTables : new Set())}
                </div>
            </div>
        </div>
    );
};

export default ModelBuilder;
