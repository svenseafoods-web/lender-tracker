#!/usr/bin/env python3
import urllib.request
import urllib.parse

# URL to encode - using the main production domain
url = "https://lender-tracker.vercel.app"

# Use a free QR code API to generate the QR code
qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={urllib.parse.quote(url)}"

# Download the QR code
output_file = "/home/venkataki/.gemini/antigravity/brain/9a08119c-4f21-4412-a51f-0d17568ff967/lender_tracker_qr_real.png"

print(f"Generating QR code for: {url}")
print(f"Downloading from: {qr_api_url}")

urllib.request.urlretrieve(qr_api_url, output_file)

print(f"QR code saved to: {output_file}")
