# IntelliSole App - IoT Architecture Audit Report

This report outlines the findings from an exhaustive review of the IntelliSole app following the IoT architecture update, focusing on the compatibility between the revised ESP32 firmware, the Supabase backend, and the Next.js UI frontend.

## 1. Findings & Integration Inconsistencies

### A. FSR Backwards Compatibility (Runtime Risk)
- **Issue**: The UI previously assumed all incoming payload arrays/objects had 6 `.fsr` readings. To compute average PSI and history rendering, `dashboard` coercing missing `fsr5` and `fsr6` properties to `0`, and unconditionally divided the sum by `6`.
- **Impact**: For older records that only contain `fsr1` to `fsr4`, the division by 6 causes a substantial false drop (-33%) in calculated average pressure, distorting historical accuracy.
- **Resolution**: Need to implement dynamic averaging that filters out null/undefined values and divides only by the exact count of reported active sensors. (Implemented in `dashboard/page.tsx`).

### B. Pump Control Command Drift (Integration Blocker)
- **Issue**: The UI's metrics dashboard was associating pump commands with the frontend session UUID (`device_id: session.user.id`). However, the rewritten ESP32 (`network.cpp`) polls the `device_commands` table for a hardcoded schema ID (`DEVICE_ID = esp32_node_01`) and reads a boolean `{ pump_on: true|false }` column.
- **Impact**: Pump control from the UI would insert rows the ESP32 would never see, and the ESP32 expected a different schema.
- **Resolution**: Reroute the UI pump event to use `device_id: 'esp32_node_01'` explicitly for the IoT device, and attach the boolean `pump_on: state === 'ON'` to the payload. (Implemented in `metrics/page.tsx`).

### C. Direct Device vs. Patient Mismatch (Schema Warning)
- **Issue**: `network.cpp` writes sensor readings directly via the Supabase REST endpoint, attaching `{ "device_id": "esp32_node_01" }`. It bypasses the `api/ingest/route.ts` API. Meanwhile, `dashboard` and `useStore` subscribe iteratively via `patient_id=eq.{user.id}`.
- **Impact**: For the dashboard to display real-time FSR streaming from ESP32, either the ESP32 payload must be modified to send a `patient_id` OR the database schema must include a trigger mapping hardware `device_id` rows directly to their assigned `patient_id`. Data bridging will fail until this database-level constraint is resolved.

### D. Stale References to Battery & Pump Keys
- **Issue**: The codebase suffered from alias drift over terminology (`battery` vs `battery_percentage`, and `pump` vs `pump_percentage`).
- **Resolution**: Updated UI components to safely coalesce `data.battery_percentage ?? data.battery ?? 0` operators to fully support diverse payload iterations. Cleaned up old dictionary aliases in mock data.

## 2. Required Fixes

The following modifications have been applied to address the findings:

* **[Fixed] `frontend/src/app/dashboard/page.tsx`**: Updated real-time metrics and historical array maps to iterate through FSR counts cleanly without implicit denominator 6 logic to unblock older IoT footprints safely. (Handles `fsr1..fsr4` gracefully).
* **[Fixed] `frontend/src/app/metrics/page.tsx`**: Altered schema `insert()` object to enforce `device_id: 'esp32_node_01'` bridging, and injected proper `pump_on` true/false columns satisfying ESP32 expectations.
* **[Fixed] `frontend/src/mock/mockSensorData.ts`**: Purged all generic `.battery` and `.pump` data keys in favor of structurally accurate `.battery_percentage` schema values.

## 3. Testing Checklist for Verification

**A. Manual Testing (App & Web)**
- [ ] Connect ESP32 and apply manual pressure to FSR5 and FSR6. Verify UI heatmap illuminates zones 5 & 6 dynamically without errors.
- [ ] Render historical analytics graph in Dashboard and visually confirm old datasets (4 sensors) lack sudden numerical drops compared to active 6-sensor readings.
- [ ] Login to UI Dashboard > Trigger 'Force Pump ON'. Visually inspect physical ESP32 to verify pin 25 LED or pump motor activates within `COMMAND_INTERVAL` (~2 seconds max).

**B. Automated / API Testing**
- [ ] POST a legacy payload missing `fsr5`/`fsr6` via Postman to `api/ingest`. Monitor web socket to ensure Dashboard displays the new record properly.
- [ ] Trigger mock payloads containing `battery: 50` versus `battery_percentage: 20` and assert the battery widget gauges update flawlessly.
- [ ] Ensure Supabase Database has a trigger function converting or defaulting incoming anonymous `device_id` submissions mapping explicitly into a relational `patient_id`.
