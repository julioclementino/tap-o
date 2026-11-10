param([string]$MySqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin')
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$data = Join-Path $workspace '.local\mysql-data'
$configPath = Join-Path $workspace '.local\mysql.ini'
if (-not $data.StartsWith($workspace + [IO.Path]::DirectorySeparatorChar)) { throw 'Data must stay inside this project.' }
if (-not (Test-Path (Join-Path $MySqlBin 'mysqld.exe'))) { throw 'MySQL nao encontrado. Informe -MySqlBin com o caminho da pasta bin.' }
New-Item -ItemType Directory -Force (Join-Path $workspace '.local') | Out-Null
if (-not (Test-Path $data)) {
  & (Join-Path $MySqlBin 'mysqld.exe') --no-defaults --initialize-insecure "--basedir=$([IO.Path]::GetDirectoryName($MySqlBin))" "--datadir=$data" --console
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao inicializar MySQL isolado.' }
}
$configText = "[mysqld]`nbasedir=$($MySqlBin.Replace('\','/'))/..`ndatadir=$($data.Replace('\','/'))`nport=3307`nbind-address=127.0.0.1`nmysqlx=0`nlog-error=$($workspace.Replace('\','/'))/.local/mysql.log`npid-file=$($workspace.Replace('\','/'))/.local/mysql.pid`n"
[IO.File]::WriteAllText($configPath, $configText)
$listener = Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $pidFile = Join-Path $workspace '.local\mysql.pid'
  if (-not (Test-Path $pidFile) -or [int](Get-Content $pidFile) -ne $listener[0].OwningProcess) { throw 'A porta 3307 ja pertence a outro processo. Nao sera alterado.' }
} else {
  Start-Process -FilePath (Join-Path $MySqlBin 'mysqld.exe') -ArgumentList "--defaults-file=`"$configPath`"" -WindowStyle Hidden
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) { Start-Sleep -Milliseconds 500; if (Get-NetTCPConnection -LocalPort 3307 -State Listen -ErrorAction SilentlyContinue) { $ready = $true; break } }
  if (-not $ready) { throw 'MySQL nao iniciou. Consulte .local/mysql.log.' }
}
Push-Location $workspace
try { node scripts/setup-local-db.mjs; if ($LASTEXITCODE -ne 0) { throw 'Falha ao configurar a base local.' } } finally { Pop-Location }
Write-Host 'MySQL isolado em 127.0.0.1:3307. O servico MySQL existente nao foi alterado.'
