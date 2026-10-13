$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseVersion = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$outputDirectory = Join-Path $projectRoot 'output'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$archivePath = Join-Path $outputDirectory ("techdesk-$releaseVersion.zip")
# Whitelist source; never enumerate dependencies, local records, secrets, or Git.
$sourcePaths = @('src','scripts','tests','e2e','docs','.github','package.json','package-lock.json','tsconfig.json','next.config.ts','eslint.config.mjs','postcss.config.mjs','vitest.config.ts','playwright.config.ts','README.md','PROJECT_PLAN.md','skills.md','LICENSE','AGENTS.md','.gitignore','.env.example','.env.atlas.example')
$archiveStream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($archiveStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($sourcePath in $sourcePaths) {
        $absoluteSource = Join-Path $projectRoot $sourcePath
        $sourceItem = Get-Item -LiteralPath $absoluteSource -Force
        $sourceFiles = if ($sourceItem.PSIsContainer) { Get-ChildItem -LiteralPath $absoluteSource -Recurse -File -Force } else { @($sourceItem) }
        foreach ($sourceFile in $sourceFiles) {
            $entryName = 'TechDesk/' + $sourceFile.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $sourceFile.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
} finally {
    $archive.Dispose()
    $archiveStream.Dispose()
}
$releaseHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath ($archivePath + '.sha256') -Value ($releaseHash + '  ' + [System.IO.Path]::GetFileName($archivePath)) -Encoding ascii
[pscustomobject]@{ Path = $archivePath; SHA256 = $releaseHash } | ConvertTo-Json
