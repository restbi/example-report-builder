import { Connection, DatabaseType, Table, ColumnDataType, Join, Model, Formula, ColumnType } from "restbi-sdk";

// Define the PostgreSQL connection
const PostgresConnection: Connection = {
    id: '1',
    name: 'Postgres',
    host: 'localhost',//'host.docker.internal',
    port: 5433,
    user: 'postgres',
    password: 'test',
    database: 'adventureworks',
    type: DatabaseType.POSTGRES,
};

// Define the Tables with display names
const salesOrderHeaderTable: Table = {
    id: '1',
    dbName: 'SalesOrderHeader',
    schema: 'sales',
    name: 'Sales Order Header',
    columns: [
        { id: '1', dbName: 'SalesOrderID', dataType: ColumnDataType.NUMBER, name: 'Sales Order ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'OrderDate', dataType: ColumnDataType.DATE, name: 'Order Date' },
        { id: '3', dbName: 'CustomerID', dataType: ColumnDataType.NUMBER, name: 'Customer ID' },
        { id: '4', dbName: 'TotalDue', dataType: ColumnDataType.NUMBER, name: 'Total Due' }
    ]
};

const productTable: Table = {
    id: '2',
    dbName: 'Product',
    schema: 'production',
    name: 'Product',
    columns: [
        { id: '1', dbName: 'ProductID', dataType: ColumnDataType.NUMBER, name: 'Product ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Name' },
        { id: '3', dbName: 'ProductNumber', dataType: ColumnDataType.STRING, name: 'Product Number' },
        { id: '4', dbName: 'ListPrice', dataType: ColumnDataType.NUMBER, name: 'List Price' },
        { id: '5', dbName: 'ProductSubcategoryID', dataType: ColumnDataType.NUMBER, name: 'Product Subcategory ID' },
    ]
};

const customerTable: Table = {
    id: '3',
    dbName: 'Customer',
    schema: 'sales',
    name: 'Customer',
    columns: [
        { id: '1', dbName: 'CustomerID', dataType: ColumnDataType.NUMBER, name: 'Customer ID', type: ColumnType.DIMENSION },
        { id: '2', dbName: 'FirstName', dataType: ColumnDataType.STRING, name: 'First Name' },
        { id: '3', dbName: 'LastName', dataType: ColumnDataType.STRING, name: 'Last Name' },
        { id: '4', dbName: 'EmailAddress', dataType: ColumnDataType.STRING, name: 'Email Address' }
    ]
};

const salesOrderDetailTable: Table = {
    id: '4',
    dbName: 'SalesOrderDetail',
    schema: 'sales',
    name: 'Sales Order Detail',
    columns: [
        { id: '1', dbName: 'SalesOrderID', dataType: ColumnDataType.NUMBER, name: 'Sales Order ID' },
        { id: '2', dbName: 'SalesOrderDetailID', dataType: ColumnDataType.NUMBER, name: 'Sales Order Detail ID' },
        { id: '4', dbName: 'OrderQty', dataType: ColumnDataType.NUMBER, name: 'Order Quantity' },
        { id: '5', dbName: 'UnitPrice', dataType: ColumnDataType.NUMBER, name: 'Unit Price' }
    ]
};

const productCategoryTable: Table = {
    id: '5',
    dbName: 'ProductCategory',
    schema: 'production',
    name: 'Product Category',
    columns: [
        { id: '1', dbName: 'ProductCategoryID', dataType: ColumnDataType.NUMBER, name: 'Product Category ID' },
        { id: '2', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Category Name' },
    ]
};

const productSubcategoryTable: Table = {
    id: '6',
    dbName: 'ProductSubcategory',
    schema: 'production',
    name: 'Product Subcategory',
    columns: [
        { id: '1', dbName: 'ProductSubcategoryID', dataType: ColumnDataType.NUMBER, name: 'Product Subcategory ID' },
        { id: '2', dbName: 'ProductCategoryID', dataType: ColumnDataType.NUMBER, name: 'Product Category ID' },
        { id: '3', dbName: 'Name', dataType: ColumnDataType.STRING, name: 'Sub-Category Name' },
    ]
};
const invoiceTable: Table =     {
    "id": "4",
    "dbName": "invoice",
    "schema": "public",
    "name": "Invoice",
    "columns": [
      {
        "id": "total",
        "dbName": "total",
        "name": "total",
        "dataType": ColumnDataType.NUMBER,
      }
    ],
}
// Update Joins to include ProductCategory and ProductSubcategory
const updatedJoins: Join[] = [
    {
        id: '1',
        table1: 'SalesOrderHeader',
        table2: 'Customer',
        clauses: [{
            column1: 'CustomerID',
            column2: 'CustomerID',
            operator: '='
        }]
    },
    {
        id: '2',
        table1: 'SalesOrderHeader',
        table2: 'SalesOrderDetail',
        clauses: [{
            column1: 'SalesOrderID',
            column2: 'SalesOrderID',
            operator: '='
        }]
    },
    {
        id: '3',
        table1: 'SalesOrderDetail',
        table2: 'Product',
        clauses: [{
            column1: 'ProductID',
            column2: 'ProductID',
            operator: '='
        }]
    },
    {
        id: '4',
        table1: 'Product',
        table2: 'ProductSubcategory',
        clauses: [{
            column1: 'ProductSubcategoryID',
            column2: 'ProductSubcategoryID',
            operator: '='
        }]
    },
    {
        id: '5',
        table1: 'ProductSubcategory',
        table2: 'ProductCategory',
        clauses: [{
            column1: 'ProductCategoryID',
            column2: 'ProductCategoryID',
            operator: '='
        }]
    }
];
const formulas: Formula[] = [
    { id: "1", name: 'Formula Bikes', expression: "SUM(CASE WHEN {{Category Name}} = 'Bikes' THEN {{Total Due}} ELSE NULL END)" },
    { id: "2", name: 'Average Sales', expression: "AVG({{Total Due}})" },
    { id: "3", name: 'Year', expression: "YEAR({{Order Date}})" },

];
// Define the updated Model
export const AdventureWorksModel: Model = {
    id: '1',
    name: 'AdventureWorksModel',
    displayName: 'Adventure Works Model',  // Added display name for the model
    connection: PostgresConnection,
    tables: [salesOrderHeaderTable, salesOrderDetailTable, productTable, customerTable, productCategoryTable, productSubcategoryTable, invoiceTable],
    joins: updatedJoins,
    formulas: formulas,
    filters: []
};
