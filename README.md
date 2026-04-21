If you want to build this project step by step, feel free to follow along.

In case you face any issues or have questions, you can reach out to me on LinkedIn.  https://www.linkedin.com/in/itsshadab/

# Smart Attendance System Documentation & Setup Plan

This plan outlines the steps to document the Smart Attendance System for new users, define the database requirements, and organize the hardware configuration.

## 1. Project Initialization (New User Steps)
1. **Clone the Project**: `git clone <repo-url>`
2. **Install Frontend Dependencies**: Run `npm install` in the root directory.
3. **Configure Environment Variables**:
   - Create a `.env` file in the root.
   - Add the following keys (get these from Supabase Project Settings > API):
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
4. **Database Setup**: Manually create tables in Supabase (see section 2).
5. **Run the App**: Run `npm run dev` to start the frontend.

## 2. Database Schema (Supabase Tables)

### Table: `students`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `uid` | `Text` (Primary Key) | The RFID serial number (e.g., `A1B2C3D4`) |
| `name` | `Text` | Full Name of the student |
| `class` | `Text` | Class or Branch (e.g., `BCA`, `CS`) |
| `class_UID` | `Text` | University Roll No / Student ID |
| `created_at` | `Timestamp` | Default: `now()` |

### Table: `attendance`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `BigInt` (Primary Key) | Auto-incrementing identifier |
| `uid` | `Text` | RFID UID (Linked to `students.uid`) |
| `entery_time` | `Timestamp` | Recorded time of entry |
| `exist_tiem` | `Timestamp` | Recorded time of exit (Note: Typo preserved for code compatibility) |

### Table: `live_scans`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `BigInt` (Primary Key) | Auto-incrementing identifier |
| `uid` | `Text` | RFID UID of an unassigned/unknown card |
| `time` | `Timestamp` | Time of the scan |

> [!IMPORTANT]
> **Realtime Settings**: In Supabase, enable **Realtime** for all three tables (`students`, `attendance`, `live_scans`) to allow the dashboard to update instantly when a card is scanned.

## 3. Hardware (Arduino/NodeMCU) Setup
- **Code Location**: `firmware/sketch_apr18a.ino`
- **Controller**: NodeMCU (ESP8266) or ESP32.
- **Sensor**: RC522 RFID Reader.
- **Workflow**:
  1. Open the `.ino` file in Arduino IDE.
  2. Install required libraries: `MFRC522`, `ESP8266WiFi`, `ESP8266HTTPClient`.
  3. Update the `SSID` and `PASSWORD` in the code.
  4. Update the Supabase REST URL and API Key in the hardware code to match your `.env` values.
  5. Upload to the NodeMCU.

## 4. GitHub Documentation Status
- Updated `README.md` with branding, installation steps, and schema overview.
- Added link to firmware source.
- Included troubleshooting for Realtime sync.


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


