import React, { useState, useEffect, ChangeEventHandler } from 'react';
import { QueryFilter, Column, ColumnDataType, Query, SQLResult, RestBIClient } from 'restbi-sdk'; // Adjust import paths as necessary
import { AdventureWorksModel } from './models/adventureworks';
import { FormControl, InputLabel, MenuItem, OutlinedInput } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { IoClose } from "react-icons/io5";
type FilterProps = {
    column: Column;
    onFilterChange: (filter: QueryFilter) => void;
    onClose: () => void;
};
let client = new RestBIClient("http://localhost:3000");


const CACHED_VALUE_OPERATORS = ['NOT IN','IN','=','!=']
const MULTISELECT_OPERATORS = ['IN', 'NOT IN'];

const Filter: React.FC<FilterProps> = ({ column, onFilterChange, onClose }) => {
    const [operator, setOperator] = useState('=');
    const [value, setValue] = useState<string | number | boolean | Date | string[]>('');
    const [options, setOptions] = useState<string[]>([]);

    useEffect(() => {
        if (column.dataType == ColumnDataType.STRING && CACHED_VALUE_OPERATORS.includes(operator)) {
            fetchOptions();
        }
    }, [operator]);

    const fetchOptions = () => {
        client.executeQuery({
            columns: [column.name],
            limit: 100,
        }, AdventureWorksModel).then((data: SQLResult) => { 
            const options = data.rows.map(row => Object.values(row)[0].toString());
            setOptions(options);
        }).catch(err => console.error('Error fetching options:', err));
    };

    const handleValueChange = (e: any) => {
        console.log(e.target.value);
        let newValue: any;
        if (column.dataType === ColumnDataType.DATE) {
            newValue = new Date(e.target.value);
        } else if (column.dataType === ColumnDataType.NUMBER) {
            newValue = parseFloat(e.target.value);
        } else {
            newValue = e.target.value;
        }
        setValue(newValue);
        onFilterChange({ column: column.name , operator, value: newValue });
    };

    const handleMultiSelectChange = (e: any) => {
        console.log(e);
        if (!e.target.selectedOptions){
            setValue(e.target.value);
            onFilterChange({ column: column.name , operator, value: e.target.value });
        }else{
            const selectedOptions = Array.from(e.target.selectedOptions, (option:any) => option.value);
            setValue(selectedOptions);
            onFilterChange({ column: column.name , operator, value: selectedOptions });
        }
    };
    const handleOperatorChange = (e: SelectChangeEvent ) => {
        if (MULTISELECT_OPERATORS.includes(e.target.value)){
            setValue([]);
            console.log("here")
        }else{
            setValue('');
        }
        setOperator(e.target.value);
        onFilterChange({ column: column.name || column.name, operator: e.target.value, value });
    }

    return (
        <div className='flex flex-col w-48 p-2 space-y-4'>
            <div className='flex justify-between'>
                <div className='font-bold'>{column.name || column.name}</div>
                <IoClose  className='h-6 hover:cursor-pointer hover:text-red-400' onClick={onClose} />
            </div>
            {/* Operator dropdown */}
            <FormControl>
            <InputLabel id="operator-label"  >Operator</InputLabel >
            {column.dataType === ColumnDataType.STRING && (
                <Select labelId='operator-label' className='h-10' value={operator}  onChange={handleOperatorChange} input={<OutlinedInput label="Operator"/>}>
                    <MenuItem value="=">=</MenuItem>
                    <MenuItem value="!=">!=</MenuItem>
                    <MenuItem value="LIKE">LIKE</MenuItem>
                    <MenuItem value="IN">IN</MenuItem>
                    <MenuItem value="NOT IN">NOT IN</MenuItem>
                    <MenuItem value="IS NULL">IS NULL</MenuItem>
                    <MenuItem value="IS NOT NULL">IS NOT NULL</MenuItem>
                </Select>
            )}
            {column.dataType === ColumnDataType.NUMBER && (
                <Select labelId='operator-label' className='h-10' value={operator}  onChange={handleOperatorChange} input={<OutlinedInput label="Operator"/>}>
                    <MenuItem value="=">=</MenuItem>
                    <MenuItem value=">">{'>'}</MenuItem>
                    <MenuItem value="<">{'<'}</MenuItem>
                </Select>
            )}
            {column.dataType === ColumnDataType.DATE && (
                <Select labelId='operator-label' className='h-10' value={operator}  onChange={handleOperatorChange} input={<OutlinedInput label="Operator"/>}>
                    <MenuItem value="=">=</MenuItem>
                    <MenuItem value="BETWEEN">BETWEEN</MenuItem>
                    <MenuItem value=">">{'>'}</MenuItem>
                    <MenuItem value="<">{'<'}</MenuItem>
                </Select>
            )}
            {column.dataType === ColumnDataType.BOOLEAN && (
                <Select labelId='operator-label' className='h-10' value={operator}  onChange={handleOperatorChange} input={<OutlinedInput label="Operator"/>}>
                    <MenuItem value="=">=</MenuItem>
                </Select>
            )}
            </FormControl>
            
            {/* Value input */}
            <FormControl>
            <InputLabel id="value-label"  >{column.name}</InputLabel >
            {column.dataType === ColumnDataType.DATE && operator === 'BETWEEN' && (
                <div>
                    <input type="date" onChange={handleValueChange} />
                    <input type="date" onChange={handleValueChange} />
                </div>
            )}

            {column.dataType === ColumnDataType.DATE && operator !== 'BETWEEN' && (
                <TextField  type="date"  onChange={handleValueChange} />
            )}

            {column.dataType === ColumnDataType.NUMBER && (
                <TextField  type="number" value={value.toString()} onChange={handleValueChange} />
            )}

            {column.dataType === ColumnDataType.BOOLEAN && (
                <Select labelId='value-label' value={value.toString()} onChange={handleValueChange}>
                    <MenuItem value="true">True</MenuItem>
                    <MenuItem value="false">False</MenuItem>
                </Select>
            )}
            {column.dataType === ColumnDataType.STRING && CACHED_VALUE_OPERATORS.includes(operator) && (
                <Select labelId='value-label' multiple={MULTISELECT_OPERATORS.includes(operator)} value={value} onChange={handleMultiSelectChange}  input={<OutlinedInput label={column.name}/>}>
                    {options.map(option => (
                        <MenuItem key={option} value={option}>
                            {option.toString()}
                        </MenuItem>
                    ))}
                </Select>
            )}

            {column.dataType === ColumnDataType.STRING && !CACHED_VALUE_OPERATORS.includes(operator) && (
                <input type="text" value={value.toString()} onChange={handleValueChange} />
            )}
            </FormControl>
        </div>
    );
};

export default Filter;
