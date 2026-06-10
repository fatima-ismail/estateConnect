$publishPath = Join-Path $PSScriptRoot "bin\Release\net10.0\publish"

if (-not (Test-Path (Join-Path $publishPath "ConnectApi.dll"))) {
    Write-Error "Published app not found. Run: dotnet publish -c Release"
    exit 1
}

$env:ASPNETCORE_ENVIRONMENT = "Development"
Set-Location $publishPath
dotnet ConnectApi.dll
