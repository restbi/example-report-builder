import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, List, ListItem, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { RestBIClient, Model, Table, ValidationResult } from 'restbi-sdk';
import { EditorView, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

let client = new RestBIClient(process.env.REACT_APP_API_URL || "http://localhost:3000");
interface ModelBuilderProps {
    defaultModel: Model
}

const ModelBuilder: React.FC<ModelBuilderProps> = ({defaultModel}) => {
    const [modelInput, setModelInput] = useState<string>('');
    const [model, setModel] = useState<Model | null>(defaultModel);
    const [metadata, setMetadata] = useState<Table[] | null>(null);
    const [errorList, setErrorList] = useState<{ message: string, line: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [problematicTables, setProblematicTables] = useState<Set<string>>();
    useEffect(()=> {
        setModelInput(prettifyJson(JSON.stringify(defaultModel)))
    },[])
    useEffect(() => {
        try {
            const parsedModel = JSON.parse(modelInput);
            setModel(parsedModel);
        } catch (error) {
            console.error('Invalid JSON format', error);
            setModel(null);
        }
    }, [modelInput]);

    const handleValidation = async () => {
        if (!model) {
            console.error('Cannot validate. Model is invalid or not set.');
            return;
        }
        setLoading(true);
        setErrorList([]); // Clear previous errors
        try {
            const validationResult: ValidationResult = await client.validateModel(model);
            setMetadata(validationResult.dbTables);
            setModel(validationResult.model);
            setModelInput(prettifyJson(JSON.stringify(validationResult.model))); 
            const problematicTables = generateErrorList(validationResult.model.tables); // Generate the error list and get problematic tables
            setProblematicTables(problematicTables);
        } catch (error) {
            console.error('Validation error', error);
        } finally {
            setLoading(false);
        }
    };

    const generateErrorList = (tables: Table[]) => {
        const errors: { message: string, line: number, tableName: string }[] = [];
        const problematicTables: Set<string> = new Set();
    
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
    
        setErrorList(errors);
        return problematicTables;
    };

    const findLineNumber = (text: string, searchString: string, startLine = 0) => {
        const lines = text.split('\n');
        for (let i = startLine; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i;
            }
        }
        return -1;
    };

    const prettifyJson = (jsonString: string): string => {
        try {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch (error) {
            console.error('Invalid JSON format', error);
            return jsonString;
        }
    };
    const addColumnToModel = (tableDbName: string, column: Table["columns"][0]) => {
        if (!model) return;
        const newModel = { ...model };
        const tableIndex = newModel.tables.findIndex(t => t.dbName.toLowerCase() === tableDbName.toLowerCase());
        if (tableIndex !== -1) {
            const table = newModel.tables[tableIndex];
            const columnExists = table.columns.some(c => c.dbName.toLowerCase() === column.dbName.toLowerCase());
            if (!columnExists) {
                table.columns.push(column);
                setModel(newModel);
                setModelInput(prettifyJson(JSON.stringify(newModel)));
            }
        }
    }; 
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
                                backgroundColor: problematicTables.has(table.dbName) ? '#ffcccc' : 'transparent' 
                            }}
                        >
                            <div className="font-bold">
                                {table.name}
                            </div>
                            <div className='flex flex-wrap'>
                                {table.columns.map((column, colIndex) => {
                                    const isInModel = modelTable?.columns.some(mc => mc.dbName.toLowerCase() === column.dbName.toLowerCase());
    
                                    return (
                                        <div
                                            className='px-2 py-1 mr-2 mb-2 rounded-md'
                                            key={colIndex}
                                            style={{
                                                backgroundColor: isInModel ? '#cce5ff' : 'transparent', // Light blue if in model
                                                fontSize: 'small',
                                            }}
                                            onClick={() => addColumnToModel(table.dbName, column)}
                                            >
                                            {column.name}
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
                {loading && <CircularProgress className="mb-4" />}

                <CodeMirror
                    value={prettifyJson(modelInput)}
                    extensions={[json(), highlightLines]}
                    theme={okaidia}
                    height="600px"
                    onChange={(value) => setModelInput(value)}
                    editable={true}
                />
                <div className="w-1/2 pl-4 border-l">
                    <h2 className="text-xl font-semibold mb-4">Validation Summary</h2>
                    <Typography variant="body1">
                        {errorList.length} error(s) found.
                    </Typography>
                    <List>
                        {errorList.map((error, index) => (
                            <ListItem key={index}>
                                {error.message} (Line {error.line + 1})
                            </ListItem>
                        ))}
                    </List>
                </div>
            </div>
            <div className='flex flex-col w-1/2'>
                <div className='font-bold text-2xl mb-4'>Database Tables and Column</div>
                <div className='flex p-2 overflow-y-auto' style={{scrollbarWidth:'thin', height:'calc(100vh - 150px)'}}>
                {metadata && model && renderMetadata(metadata, model?.tables , problematicTables ? problematicTables: new Set())}
                </div>
            </div>

        </div>
    );
};

export default ModelBuilder;
