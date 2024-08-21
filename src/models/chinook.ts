import { Connection, DatabaseType, Table, ColumnDataType, Join, Model, Formula, ColumnType } from "restbi-sdk";

// Define the PostgreSQL connection for Chinook
const ChinookConnection: Connection = {
    id: '2',
    name: 'Chinook',
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'test',
    database: 'chinook',
    type: DatabaseType.POSTGRES,
};

// Define the Tables with display names
const albumTable: Table = {
    id: '1',
    dbName: 'album',
    schema: 'public',
    name: 'Album',
    columns: [
        { id: '1', dbName: 'AlbumId', dataType: ColumnDataType.NUMBER, name: 'Album ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'Title', dataType: ColumnDataType.STRING, name: 'Title' },
        { id: '3', dbName: 'ArtistId', dataType: ColumnDataType.NUMBER, name: 'Artist ID' }
    ]
};

const artistTable: Table = {
    id: '2',
    dbName: 'artist',
    schema: 'public',
    name: 'Artist',
    columns: [
        { id: '1', dbName: 'ArtistId', dataType: ColumnDataType.NUMBER, name: 'Artist ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Name' }
    ]
};

const customerTable: Table = {
    id: '3',
    dbName: 'customer',
    schema: 'public',
    name: 'Customer',
    columns: [
        { id: '1', dbName: 'CustomerId', dataType: ColumnDataType.NUMBER, name: 'Customer ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'FirstName', dataType: ColumnDataType.STRING, name: 'First Name' },
        { id: '3', dbName: 'LastName', dataType: ColumnDataType.STRING, name: 'Last Name' },
        { id: '4', dbName: 'Email', dataType: ColumnDataType.STRING, name: 'Email' }
    ]
};

const invoiceTable: Table = {
    id: '4',
    dbName: 'invoice',
    schema: 'public',
    name: 'Invoice',
    columns: [
        { id: '1', dbName: 'InvoiceId', dataType: ColumnDataType.NUMBER, name: 'Invoice ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'CustomerId', dataType: ColumnDataType.NUMBER, name: 'Customer ID' },
        { id: '3', dbName: 'InvoiceDate', dataType: ColumnDataType.DATE, name: 'Invoice Date' },
        { id: '4', dbName: 'Total', dataType: ColumnDataType.NUMBER, name: 'Total' }
    ]
};

const invoiceLineTable: Table = {
    id: '5',
    dbName: 'invoice_line',
    schema: 'public',
    name: 'Invoice Line',
    columns: [
        { id: '1', dbName: 'InvoiceLineId', dataType: ColumnDataType.NUMBER, name: 'Invoice Line ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'InvoiceId', dataType: ColumnDataType.NUMBER, name: 'Invoice ID' },
        { id: '3', dbName: 'TrackId', dataType: ColumnDataType.NUMBER, name: 'Track ID' },
        { id: '4', dbName: 'UnitPrice', dataType: ColumnDataType.NUMBER, name: 'Unit Price' },
        { id: '5', dbName: 'Quantity', dataType: ColumnDataType.NUMBER, name: 'Quantity' }
    ]
};

const trackTable: Table = {
    id: '6',
    dbName: 'track',
    schema: 'public',
    name: 'Track',
    columns: [
        { id: '1', dbName: 'TrackId', dataType: ColumnDataType.NUMBER, name: 'Track ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Name' },
        { id: '3', dbName: 'AlbumId', dataType: ColumnDataType.NUMBER, name: 'Album ID' },
        { id: '4', dbName: 'GenreId', dataType: ColumnDataType.NUMBER, name: 'Genre ID' },
        { id: '5', dbName: 'Composer', dataType: ColumnDataType.STRING, name: 'Composer' },
        { id: '6', dbName: 'Milliseconds', dataType: ColumnDataType.NUMBER, name: 'Milliseconds' },
        { id: '7', dbName: 'Bytes', dataType: ColumnDataType.NUMBER, name: 'Bytes' },
        { id: '8', dbName: 'UnitPrice', dataType: ColumnDataType.NUMBER, name: 'Unit Price' }
    ]
};

const genreTable: Table = {
    id: '7',
    dbName: 'genre',
    schema: 'public',
    name: 'Genre',
    columns: [
        { id: '1', dbName: 'GenreId', dataType: ColumnDataType.NUMBER, name: 'Genre ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Name' }
    ]
};

// Define the Joins between the tables
const chinookJoins: Join[] = [
    {
        id: '1',
        table1: 'Album',
        table2: 'Artist',
        clauses: [{
            column1: 'ArtistId',
            column2: 'ArtistId',
            operator: '='
        }]
    },
    {
        id: '2',
        table1: 'Invoice',
        table2: 'Customer',
        clauses: [{
            column1: 'CustomerId',
            column2: 'CustomerId',
            operator: '='
        }]
    },
    {
        id: '3',
        table1: 'InvoiceLine',
        table2: 'Invoice',
        clauses: [{
            column1: 'InvoiceId',
            column2: 'InvoiceId',
            operator: '='
        }]
    },
    {
        id: '4',
        table1: 'InvoiceLine',
        table2: 'Track',
        clauses: [{
            column1: 'TrackId',
            column2: 'TrackId',
            operator: '='
        }]
    },
    {
        id: '5',
        table1: 'Track',
        table2: 'Album',
        clauses: [{
            column1: 'AlbumId',
            column2: 'AlbumId',
            operator: '='
        }]
    },
    {
        id: '6',
        table1: 'Track',
        table2: 'Genre',
        clauses: [{
            column1: 'GenreId',
            column2: 'GenreId',
            operator: '='
        }]
    }
];

// Define some example formulas for the Chinook Model
const chinookFormulas: Formula[] = [
    { id: "1", name: 'Total Sales', expression: "SUM({{Total}})" },
    { id: "2", name: 'Average Track Duration', expression: "AVG({{Milliseconds}})" },
    { id: "3", name: 'Year of Invoice', expression: "YEAR({{Invoice Date}})" }
];

// Define the Chinook Model
export const ChinookModel: Model = {
    id: '2',
    name: 'ChinookModel',
    displayName: 'Chinook Music Store Model',
    connection: ChinookConnection,
    tables: [albumTable, artistTable, customerTable, invoiceTable, invoiceLineTable, trackTable, genreTable],
    joins: chinookJoins,
    formulas: chinookFormulas,
    filters: []
};
