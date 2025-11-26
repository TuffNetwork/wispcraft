#!/bin/sh

npm run build

cd dist
curl -L https://bafybeidtmtattvhd2y45dbafncqmu52bxjr3kwyrftky552bpnomy2vzpu.ipfs.dweb.link/?filename=EaglercraftX_1.8_WASM-GC_Offline_Download.zip -o eaglercraft.zip
unzip eaglercraft.zip
rm eaglercraft.zip
mv EaglercraftX_1.8_WASM-GC_Offline_Download.html index.html
sed -i 's/<head>/<head>\<script src="index.js"><\/script>/' index.html
cp ../ci/_headers .