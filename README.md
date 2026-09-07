# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Integrador Final de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.
[Informe Completo](https://docs.google.com/document/d/1VEmq8IQWdE1cVnLsrtFOBDiN8HbyCjLl/edit?usp=drive_link&ouid=104223395228377711470&rtpof=true&sd=true)


Database - Mermaid -
---
config:
  layout: elk
---
erDiagram
    BUSINESSES ||--o{ USERS : "has"
    BUSINESSES ||--o{ PRODUCTS : "contains"
    BUSINESSES ||--o{ SALES : "registers"
    USERS ||--o{ SALES : "makes"
    SALES ||--|{ SALES_ITEMS : "embeds"
    PRODUCTS ||--o{ SALES_ITEMS : "references"

    BUSINESSES {
        ObjectId _id PK
        string name
        bool active
        ISODate createdAt
    }

    USERS {
        ObjectId _id PK
        ObjectId businessId FK
        string name
        string user UK 
        string password 
        string role "admin/employee"
        bool active
        ISODate createdAt
    }

    PRODUCTS {
        ObjectId _id PK
        ObjectId businessId FK
        string name
        string description
        string category "one single category per product"
        array tags "array of strings, multiple per product"
        float salePrice
        float cost
        int stock_current "subdocument stock.current"
        int stock_min "subdocument stock.min, restock alert"
        string status "active/inactive, soft delete"
        ISODate createdAt
        ISODate updatedAt
    }

    SALES {
        ObjectId _id PK
        ObjectId businessId FK
        int number UK "sequential per business, never reused"
        ISODate date
        ObjectId userId FK
        array items "embedded array, see SALES_ITEMS"
        float total "calculated and persisted by the backend"
        string status "completed/voided"
        ISODate voidedAt "null if not voided"
        ObjectId voidedByUserId FK "who voided the sale"
        string voidingReason "null if not voided"
    }

    SALES_ITEMS {
        ObjectId saleId PK
        ObjectId productId FK
        string name "SNAPSHOT of the name at the time of sale"
        int quantity
        float unitPrice "SNAPSHOT of the price at the time of sale"
        float subtotal
    }