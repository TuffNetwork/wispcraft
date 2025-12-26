@echo off
setlocal enabledelayedexpansion

REM Run build
npm run build
IF ERRORLEVEL 1 exit /b 1

REM Ensure dist directory exists
IF NOT EXIST dist (
    mkdir dist
)

cd dist || exit /b 1

REM Download zip
curl -L "https://bafybeidtmtattvhd2y45dbafncqmu52bxjr3kwyrftky552bpnomy2vzpu.ipfs.dweb.link/?filename=EaglercraftX_1.8_WASM-GC_Offline_Download.zip" -o eaglercraft.zip
IF ERRORLEVEL 1 exit /b 1

REM Extract zip (tar works on modern Windows)
tar -xf eaglercraft.zip
del eaglercraft.zip

REM Rename HTML
ren EaglercraftX_1.8_WASM-GC_Offline_Download.html index.html

REM Inject script tag (requires Git Bash sed or GnuWin32)
sed -i "s|<head>|<head><script src=\"index.js\"></script>|" index.html

REM Copy _headers if it exists
IF EXIST ..\_headers (
    copy ..\_headers . >nul
)

echo Done.
