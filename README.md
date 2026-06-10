# EstateConnect

EstateConnect is a full-stack ASP.NET Core and React application for property,
home-service, and job listings.

## Included Topics

- Registration and login with password hashing
- JWT authentication and protected API/UI routes
- Four related SQL Server tables: users, properties, home services, and jobs
- Full CRUD operations through ASP.NET Core controllers
- React Router routes, hooks, forms, and validation
- ASP.NET Core GET, POST, PUT, and DELETE endpoints
- Entity Framework Core migrations
- Responsive Bootstrap UI
- Layered folders for controllers, models, services, data, pages, and components
- Integrated React production build served and published by ASP.NET Core

## Development

Start the API:

```powershell
cd ConnectApi
dotnet run
```

Start the React development server in another terminal:

```powershell
cd ConnectApi\connect-client
npm.cmd install
npm.cmd run dev
```

## Database Migrations

Create or update the configured SQL Server database:

```powershell
cd ConnectApi
dotnet ef database update
```

Create a new migration after changing entity models:

```powershell
dotnet ef migrations add MigrationName
```

## Production Build

Publishing the ASP.NET Core project automatically builds React into `wwwroot`
and includes it in the deployment output:

```powershell
cd ConnectApi
dotnet publish -c Release
.\run-publish-local.ps1
```
