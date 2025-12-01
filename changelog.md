# Lab Reports & Patient API Guide

This living doc summarizes every lab report type, the endpoints that surface report metadata/reference data, and the patient/record APIs that consume them.

## 1. Report Types Catalog

### GET /api/lab-references/record-types
Returns the canonical list of report types. If `usesFreeformTemplate` is true (immunology/serology, misc), the frontend should render the free-form fields UI.

**Response 200**
```json
[
  { "recordType": "cbc", "displayName": "CBC", "usesFreeformTemplate": false },
  { "recordType": "urinalysis", "displayName": "Urinalysis", "usesFreeformTemplate": false },
  { "recordType": "fecalysis", "displayName": "Fecalysis", "usesFreeformTemplate": false },
  { "recordType": "chemistry", "displayName": "Chemistry", "usesFreeformTemplate": false },
  {
    "recordType": "chemistry_oral_glucose",
    "displayName": "Chemistry (Oral Glucose)",
    "usesFreeformTemplate": false
  },
  {
    "recordType": "immunoserro",
    "displayName": "Immunology/Serology",
    "usesFreeformTemplate": true
  },
  { "recordType": "misc", "displayName": "Misc", "usesFreeformTemplate": true }
]
```

## 2. Lab Reference Endpoints

### GET /api/lab-references/{recordType}
Fetches the ordered set of reference definitions for a report type. Empty `fields` means no references were set yet.

- **CBC** returns ranges + units instead of dropdown options.
- All other record types return the familiar `options` array.

**Response 200 – Urinalysis**
```json
{
  "recordType": "urinalysis",
  "fields": [
    {
      "field": "color",
      "label": "Color",
      "options": ["straw", "light yellow", "yellow", "dark yellow"]
    }
  ]
}
```

**Response 200 – CBC**
```json
{
  "recordType": "cbc",
  "fields": [
    {
      "field": "wbc",
      "label": "WBC",
      "unit": "x10^9/L",
      "range": {
        "male": { "low": "4.0", "high": "11.0" },
        "female": { "low": "4.0", "high": "11.0" },
        "child": { "low": "5.5", "high": "13.5" }
      }
    }
  ]
}
```

### PUT /api/lab-references/{recordType}
Overwrites all reference fields for a record type. Send every field in the desired order; missing keys are deleted.

**Request body** – `LabReferenceUpdateRequestDto`
```json
{
  "fields": [
    {
      "field": "color",
      "label": "Color",
      "options": ["straw", "light yellow", "yellow", "dark yellow"]
    }
  ]
}
```

**CBC update payload**
```json
{
  "fields": [
    {
      "field": "wbc",
      "label": "WBC",
      "unit": "x10^9/L",
      "range": {
        "male": { "low": "4.0", "high": "11.0" },
        "female": { "low": "4.0", "high": "11.0" },
        "child": { "low": "5.5", "high": "13.5" }
      }
    }
  ]
}
```

Rules: at least one field, field keys must be unique, and every entry must provide either a non-empty `options` array (dropdown-style reports) **or** a `range` object (CBC). Units are editable for CBC. The backend preserves the array order, so arrange the `fields` list exactly how you want it displayed. Option arrays are respected in the order they are provided, and missing range values can be set to an empty string.

## 3. Patient Record Payload Templates

`POST /api/patients/{id}/records` and `PUT /api/patients/{id}/records/{recordId}` require `resultData` to follow the template of the chosen `recordType`.

```json
{
  "recordType": "cbc",
  "testDate": "2025-11-24T08:00:00Z",
  "labNum": "LAB-001-2025",
  "physician": "Dr. Smith",
  "resultData": {},
  "performedById": "<guid>",
  "reviewedById": "<guid>"
}
```

### CBC (`recordType = "cbc"`)
```json
{
  "wbc": "",
  "rbc": "",
  "hemoglobin": "",
  "hematocrit": "",
  "platelet": "",
  "mcv": "",
  "mch": "",
  "mchc": "",
  "segmenters": "",
  "lymphocytes": "",
  "monocytes": "",
  "eosinophils": "",
  "basophils": "",
  "remarks": ""
}
```

### Urinalysis (`recordType = "urinalysis"`)
```json
{
  "color": "",
  "transparency": "",
  "protein": "",
  "pH": "",
  "specificGravity": "",
  "glucose": "",
  "wbc": "",
  "rbc": "",
  "epithelialCells": "",
  "mucusThreads": "",
  "bacteria": "",
  "urates": "",
  "phosphates": "",
  "calciumOxalates": "",
  "triplePhosphates": "",
  "hyaline": "",
  "finelyGranularCast": "",
  "coarselyGranularCast": "",
  "rbcCast": "",
  "wbcCast": "",
  "waxyCast": "",
  "cellularCast": ""
}
```

### Fecalysis (`recordType = "fecalysis"`)
```json
{
  "color": "",
  "consistency": "",
  "wbc": "",
  "rbc": "",
  "fatGlobules": "",
  "mucusThreads": "",
  "bacteria": "",
  "remarks": ""
}
```

### Clinical Chemistry (`recordType = "chemistry"`)
```json
{
  "fbs": { "value": "", "remarks": "" },
  "rbs": { "value": "", "remarks": "" },
  "cholesterol": { "value": "", "remarks": "" },
  "triglycerides": { "value": "", "remarks": "" },
  "hdl": { "value": "", "remarks": "" },
  "dld": { "value": "", "remarks": "" },
  "bloodUricAcid": { "value": "", "remarks": "" },
  "bloodUreaNitrogen": { "value": "", "remarks": "" },
  "sgpt": { "value": "", "remarks": "" },
  "sgot": { "value": "", "remarks": "" },
  "ggt": { "value": "", "remarks": "" },
  "creatine": { "value": "", "remarks": "" },
  "hba1c": { "value": "", "remarks": "" }
}
```

### Chemistry Oral Glucose (`recordType = "chemistry_oral_glucose"`)
```json
{
  "ogct50g": {
    "base": "",
    "firstHour": "",
    "secondHour": "",
    "thirdHour": ""
  },
  "ogtt50g": {
    "base": "",
    "firstHour": "",
    "secondHour": "",
    "thirdHour": ""
  },
  "ogtt75g": {
    "base": "",
    "firstHour": "",
    "secondHour": "",
    "thirdHour": ""
  },
  "ogtt100g": {
    "base": "",
    "firstHour": "",
    "secondHour": "",
    "thirdHour": ""
  }
}
```

### Immunoserology (`recordType = "immunoserro"`) and Misc (`recordType = "misc"`)
```json
{
  "fields": [
    { "label": "", "value": "" }
  ]
}
```

## 4. Patient API
All routes live under `/api/patients` and require `Authorization: Bearer <token>`.

### GET /api/patients
Paginated search + filters.

| Query | Notes |
| --- | --- |
| `search` | Matches first/last name/email |
| `age`, `minAge`, `maxAge` | Age filters |
| `sex` | `Male` \| `Female` \| `Other` |
| `sortBy`, `sortDirection` | default `firstName`, `asc` |
| `page`, `pageSize` | defaults 1, 20 (clamped 1–100) |

**Response 200** (truncated)
```json
{
  "data": [
    {
      "id": "4d9c7a96-3aab-4d18-9f7c-60c0f158402f",
      "firstName": "Jane",
      "lastName": "Doe",
      "fullName": "Jane Doe",
      "birthDate": "1990-02-14T00:00:00Z",
      "age": 35,
      "sex": "Female",
      "phone": "+639171234567",
      "email": "jane@example.com",
      "photoUrl": null,
      "hasPhoto": false,
      "recordCount": 3,
      "createdAt": "2025-11-24T08:32:19.121Z",
      "updatedAt": "2025-11-24T08:32:19.121Z",
      "createdBy": "user-123",
      "updatedBy": "user-123"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "sortBy": "firstName",
  "sortDirection": "asc"
}
```

### GET /api/patients/{id}
Returns a single patient profile (no embedded records).

### POST /api/patients
Creates a patient (`PatientRequestDto`).

### PUT /api/patients/{id}
Updates a patient (`PatientUpdateDto`).

### DELETE /api/patients/{id}
Soft delete the patient.

### GET /api/patients/{id}/exists
Existence probe.

### POST /api/patients/{id}/photo
Upload/replace a profile photo via `multipart/form-data` (`photo`, max 5 MB JPEG/PNG/GIF).

### DELETE /api/patients/{id}/photo
Remove stored photo.

### GET /api/patients/medtechs
Returns `MedTechResponseDto[]` for dropdowns.

## 5. Patient Record Endpoints

All routes are scoped under a patient resource.

### POST /api/patients/{id}/records
Creates a lab record. Body: `PatientRecordRequestDto`.

### GET /api/patients/{id}/records
Returns all non-deleted records ordered by `testDate` desc.

### GET /api/patients/{id}/records/{recordId}
Single record lookup.

### PUT /api/patients/{id}/records/{recordId}
Updates a record (`PatientRecordUpdateDto`).

### DELETE /api/patients/{id}/records/{recordId}
Soft delete.

**Sample response**
```json
{
  "id": "db6cbc71-30aa-4df1-a415-99b08f26c5be",
  "patientId": "4d9c7a96-3aab-4d18-9f7c-60c0f158402f",
  "recordType": "cbc",
  "testDate": "2025-11-24T08:00:00Z",
  "labNum": "LAB-001-2025",
  "physician": "Dr. Smith",
  "resultData": {
    "wbc": "7.0",
    "hemoglobin": "13.5"
  },
  "performedById": "5a68e16e-ef58-4c9a-84a8-1c056c1a5d7c",
  "performedByName": "medtech.alex",
  "reviewedById": "8d1b0939-8d0b-4f49-9c40-167a2adb90f9",
  "reviewedByName": "dr.luna",
  "createdAt": "2025-11-24T08:45:22.001Z",
  "updatedAt": "2025-11-24T08:45:22.001Z",
  "createdBy": "user-123",
  "updatedBy": "user-123"
}
```

## 6. Reagent Inventory API

These endpoints live under `/api/reagents` and all require `Authorization: Bearer <token>`.

### POST /api/reagents
Creates a reagent container definition. `initialVolume` and `currentVolume` represent per-container amounts in the chosen unit of measure. Cost tracking is intentionally omitted; only stock/volume data is stored.

**Body – `ReagentRequestDto`**
```json
{
  "name": "CBC Diluent",
  "quantity": 4,
  "minimumStock": 2,
  "expirationDate": "2026-06-30T00:00:00Z",
  "batchNumber": "BATCH-2025-11",
  "unitOfMeasure": "mL",
  "initialVolume": 500,
  "currentVolume": 500
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Reagent created successfully",
  "data": {
    "id": "c0a8014c-6e7a-4acf-9df9-2740d8bf0e3f",
    "name": "CBC Diluent",
    "unitOfMeasure": "mL",
    "quantity": 4,
    "minimumStock": 2,
    "initialVolume": 500,
    "currentVolume": 500,
    "isLowStock": false,
    "isExpired": false
  }
}
```

### GET /api/reagents/list
Paginated list with filtering.

| Query | Notes |
| --- | --- |
| `searchTerm` | fuzzy match on name |
| `page`, `pageSize` | default 1, 20 (max 100) |
| `sortBy`, `sortDirection` | defaults `name`, `asc` |
| `isLowStock`, `isExpired` | booleans |

**Response 200**
```json
{
  "data": [
    {
      "id": "c0a8014c-6e7a-4acf-9df9-2740d8bf0e3f",
      "name": "CBC Diluent",
      "unitOfMeasure": "mL",
      "quantity": 4,
      "minimumStock": 2,
      "expirationDate": "2026-06-30T00:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "sortBy": "name",
  "sortDirection": "asc"
}
```

### GET /api/reagents/{id}
Fetch a single reagent by GUID. `GET /api/reagents/by-name/{name}` is also available.

### POST /api/reagents/{id}/update-stock
Adjusts one reagent’s quantities/volumes after restock or a manual correction.

**Body – `ReagentStockUpdateDto`**
```json
{
  "operation": "add", // "set", "subtract"
  "quantity": 1,
  "currentVolume": 500,
  "notes": "Manual restock"
}
```

### POST /api/reagents/bulk-update-stock
Accepts an array of `ReagentStockUpdateDto` items keyed by `reagentId`.

### POST /api/reagents/maintenance-consumption
Logs preventative-maintenance usage. Backend validates stock and subtracts the requested volumes atomically.

**Body – `MaintenanceConsumptionDto`**
```json
{
  "maintenanceType": "Analyzer cleaning",
  "notes": "Weekly preventive maintenance",
  "reagentConsumption": [
    { "reagentId": "c0a8014c-6e7a-4acf-9df9-2740d8bf0e3f", "consumedAmount": 120 }
  ]
}
```

**Response 200**
```json
{ "success": true, "message": "Maintenance consumption recorded successfully" }
```

### POST /api/reagents/{id}/dispose-partial
Removes one container and resets the current-volume tracker (used for spills/wastage). Returns the updated quantity and remaining volume.

### GET /api/reagents/summary
Aggregated counts (total reagents, low stock, expiring soon, expired) for dashboard cards.

### GET /api/reagents/unit-of-measure
Static map of allowed unit enums: `{ "0": "mL", "1": "L", "2": "g", "3": "kg", "4": "units" }`.

### GET /api/reagents/exports
Generates a CSV/Excel payload. Query params: `filter` (`all|low-stock|expired|expiring`), `includeDeleted` (bool), `expiryDays` (int, defaults 30).

### POST /api/reagents/end-of-day-reports
Stores a daily snapshot of remaining reagent volumes plus replacement metadata. Submitting a report updates each reagent’s `currentVolume` and deducts `replacementCount` from `quantity` whenever `wasReplaced` is `true`.

**Body – `ReagentEodReportRequestDto`**
```json
{
  "reportDate": "2025-11-26",
  "calibrationTestCount": 12,
  "notes": "PM shift",
  "items": [
    {
      "reagentId": "c0a8014c-6e7a-4acf-9df9-2740d8bf0e3f",
      "amountLeft": 30,
      "wasReplaced": true,
      "replacementCount": 1
    }
  ]
}
```

`replacementCount` must be greater than zero whenever `wasReplaced` is `true`; omit/zero it otherwise.

**Response 200**
```json
{
  "success": true,
  "message": "End-of-day report created successfully",
  "data": {
    "id": "0cdd1a84-6db3-4a24-8307-2cf6db50acfd",
    "reportDate": "2025-11-26T00:00:00Z",
    "calibrationTestCount": 12,
    "items": [
      {
        "id": "98c12f9a-0e0a-46b5-b129-32c654a7cf53",
        "reagentId": "c0a8014c-6e7a-4acf-9df9-2740d8bf0e3f",
        "reagentName": "CBC Diluent",
        "amountLeft": 30,
        "wasReplaced": true,
        "replacementCount": 1
      }
    ]
  }
}
```

### GET /api/reagents/end-of-day-reports
Paginated list of submitted reports.

| Query | Notes |
| --- | --- |
| `fromDate`, `toDate` | Optional date range filters (UTC date strings) |
| `page`, `pageSize` | Standard pagination, defaults 1 / 20 |
| `sortBy`, `sortDirection` | `reportDate` (default) or `calibrationTestCount` |

### GET /api/reagents/end-of-day-reports/{id}
Returns a single report with its reagent line items.

## 7. Error Shapes
Unless noted otherwise, errors look like:
```json
{ "error": "Human readable message", "details": "Optional context" }
```
Validation problems return the standard ASP.NET ModelState payload.
