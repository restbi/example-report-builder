import { Connection, DatabaseType, Table, ColumnDataType, Join, Model, Formula, ColumnType } from "restbi-sdk";

export const ChinookModel: Model = {
    "id": "2",
    "name": "ChinookModel",
    "displayName": "Chinook Music Store Model",
    "connection": {
        "id": "2",
        "name": "Chinook",
        "host": "host.docker.internal",
        "port": 5433,
        "user": "postgres",
        "password": "test",
        "database": "chinook",
        "type": DatabaseType.POSTGRES
    },
    "tables": [
        {
            "id": "1",
            "dbName": "album",
            "schema": "public",
            "name": "Album",
            "columns": [
                {
                    "id": "title",
                    "dbName": "title",
                    "name": "Album Title",
                    "dataType": ColumnDataType.STRING
                }
            ],
            "validated": true
        },
        {
            "id": "2",
            "dbName": "artist",
            "schema": "public",
            "name": "Artist",
            "columns": [
                {
                    "id": "name",
                    "dbName": "name",
                    "name": "Artist Name",
                    "dataType": ColumnDataType.STRING
                }
            ],
            "validated": true
        },
        {
            "id": "3",
            "dbName": "customer",
            "schema": "public",
            "name": "Customer",
            "columns": [
                {
                    "id": "company",
                    "dbName": "company",
                    "name": "Company Name",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "country",
                    "dbName": "country",
                    "name": "Country",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "state",
                    "dbName": "state",
                    "name": "State",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "city",
                    "dbName": "city",
                    "name": "City",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "first_name",
                    "dbName": "first_name",
                    "name": "First Name",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "last_name",
                    "dbName": "last_name",
                    "name": "Last Name",
                    "dataType": ColumnDataType.STRING
                }
            ],
            "validated": true
        },
        {
            "id": "4",
            "dbName": "invoice",
            "schema": "public",
            "name": "Invoice",
            "columns": [
                {
                    "id": "total",
                    "dbName": "total",
                    "name": "Total",
                    "dataType": ColumnDataType.NUMBER
                },
                {
                    "id": "invoice_date",
                    "dbName": "invoice_date",
                    "name": "Invoice Date",
                    "dataType": ColumnDataType.DATE
                }
            ],
            "validated": true
        },
        {
            "id": "5",
            "dbName": "invoice_line",
            "schema": "public",
            "name": "Invoice Line",
            "columns": [
                {
                  "id": "unit_price",
                  "dbName": "unit_price",
                  "name": "unit_price",
                  "dataType": ColumnDataType.NUMBER
                }
            ],
            "validated": true
        },
        {
            "id": "6",
            "dbName": "track",
            "schema": "public",
            "name": "Track",
            "columns": [
                {
                    "id": "name",
                    "dbName": "name",
                    "name": "Track Name",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "composer",
                    "dbName": "composer",
                    "name": "Composer",
                    "dataType": ColumnDataType.STRING
                },
                {
                    "id": "unit_price",
                    "dbName": "unit_price",
                    "name": "Unit Price",
                    "dataType": ColumnDataType.NUMBER
                }
            ],
            "validated": true
        },
        {
            "id": "7",
            "dbName": "genre",
            "schema": "public",
            "name": "Genre",
            "columns": [
                {
                    "id": "name",
                    "dbName": "name",
                    "name": "Genre Name",
                    "dataType": ColumnDataType.STRING
                }
            ],
            "validated": true
        }
    ],
    "joins": [
        {
            "id": "1",
            "table1": "Album",
            "table2": "Artist",
            "clauses": [
                {
                    "column1": "artist_id",
                    "column2": "artist_id",
                    "operator": "="
                }
            ]
        },
        {
            "id": "2",
            "table1": "Invoice",
            "table2": "Customer",
            "clauses": [
                {
                    "column1": "customer_id",
                    "column2": "customer_id",
                    "operator": "="
                }
            ]
        },
        {
            "id": "3",
            "table1": "Invoice Line",
            "table2": "Invoice",
            "clauses": [
                {
                    "column1": "invoice_id",
                    "column2": "invoice_id",
                    "operator": "="
                }
            ]
        },
        {
            "id": "4",
            "table1": "Invoice Line",
            "table2": "Track",
            "clauses": [
                {
                    "column1": "track_id",
                    "column2": "track_id",
                    "operator": "="
                }
            ]
        },
        {
            "id": "5",
            "table1": "Track",
            "table2": "Album",
            "clauses": [
                {
                    "column1": "album_id",
                    "column2": "album_id",
                    "operator": "="
                }
            ]
        },
        {
            "id": "6",
            "table1": "Track",
            "table2": "Genre",
            "clauses": [
                {
                    "column1": "genre_id",
                    "column2": "genre_id",
                    "operator": "="
                }
            ]
        }
    ],
    "formulas": [
        {
            "id": "1",
            "name": "Total Sales",
            "expression": "SUM({{Total}})"
        },
        {
            "id": "2",
            "name": "Average Track Duration",
            "expression": "AVG({{Milliseconds}})"
        },
        {
            "id": "3",
            "name": "Year of Invoice",
            "expression": "YEAR({{Invoice Date}})"
        }
    ],
    "filters": []
};
