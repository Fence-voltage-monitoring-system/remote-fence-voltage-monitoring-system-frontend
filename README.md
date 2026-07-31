# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.7.

## Development server

The dashboard uses `GET /api/dashboard` for overview totals and `GET /api/dashboard/devices/{deviceId}` for alerts and voltage history. In development, `proxy.conf.json` forwards `/api` to `http://localhost:8080`; change its target if the backend uses another port. Response contracts are defined in `src/app/core/models/dashboard-api.ts`.

Until the backend is available, failed requests automatically use the sample dataset in `src/app/core/data/dashboard-mock-data.ts`. The dashboard displays a **Demo mode** notice whenever this fallback is active.

Example overview response:

```json
{
  "summary": { "totalFences": 5, "totalDevices": 10, "activeDevices": 8, "criticalAlerts": 2, "lowVoltageFences": 2 },
  "selectedDevice": { "fenceId": "monaragala", "fenceName": "Monaragala Elephant Protection Fence", "sectionId": "SEC-005", "deviceId": "GTW-MNR-01-005", "voltage": 5.9, "battery": 91, "status": "healthy" }
}
```

Example device analytics response:

```json
{
  "device": { "fenceId": "monaragala", "fenceName": "Monaragala Elephant Protection Fence", "sectionId": "SEC-005", "deviceId": "GTW-MNR-01-005", "voltage": 5.9, "battery": 91, "status": "healthy" },
  "voltageHistory": [{ "recordedAt": "2026-07-24T03:00:00Z", "voltage": 5.9 }],
  "alerts": [{ "id": "alert-1", "title": "Reading Restored", "reference": "SEC-005 · GTW-MNR-01-005", "occurredAt": "2026-07-24T02:56:00Z", "status": "healthy" }],
  "alertCounts": { "critical": 0, "warning": 0, "offline": 0, "resolved": 18 }
}
```

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
