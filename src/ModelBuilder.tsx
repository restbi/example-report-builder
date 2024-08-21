import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, List, ListItem, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { RestBIClient, Model, Table } from 'restbi-sdk';

let client = new RestBIClient(process.env.REACT_APP_API_URL || "http://localhost:3000");

const ModelValidationPage: React.FC = () => {
    const [modelInput, setModelInput] = useState<string>('');
    const [model, setModel] = useState<Model | null>(null);
    const [validationResult, setValidationResult] = useState<Table[] | null>(null);
    const [errorList, setErrorList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

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
            const validatedModel: Model = await client.validateModel(model);
            console.log(validatedModel)
            setValidationResult(validatedModel.tables);
            setModel(validatedModel);
            generateErrorList(validatedModel.tables); // Generate the error list
        } catch (error) {
            console.error('Validation error', error);
        } finally {
            setLoading(false);
        }
    };

    const generateErrorList = (tables: Table[]) => {
        const errors: string[] = [];
        tables.forEach((table) => {
            if (!table.validated) {
                errors.push(`Invalid Table: ${table.name}`);
            }
            table.columns.forEach((column) => {
                if (!column.validated) {
                    errors.push(`Invalid Column: ${column.name} in Table: ${table.name}`);
                }
            });
        });
        setErrorList(errors);
    };

    const prettifyJson = (jsonString: string): string => {
        try {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } catch (error) {
            console.error('Invalid JSON format', error);
            return jsonString;
        }
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
                    extensions={[json()]}
                    theme={oneDark}
                    height="600px"
                    onChange={(value) => setModelInput(value)}
                    editable={true}
                />

                {model && validationResult && (
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold">Validated Model</h2>
                        <pre className="validated-model p-2 rounded bg-gray-100">
                            {JSON.stringify(model, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            <div className="w-1/2 pl-4 border-l">
                <h2 className="text-xl font-semibold mb-4">Validation Summary</h2>
                <Typography variant="body1">
                    {errorList.length} error(s) found.
                </Typography>
                <List>
                    {errorList.map((error, index) => (
                        <ListItem key={index}>
                            {error}
                        </ListItem>
                    ))}
                </List>
            </div>
        </div>
    );
};

export default ModelValidationPage;
