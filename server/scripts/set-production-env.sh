#!/bin/bash

# Set Firebase Functions environment variables for production
# Run this after deploying functions

echo "Setting Web Push VAPID keys for production..."
echo ""
echo "You'll be prompted to enter the keys. Use these values:"
echo "Public Key: BH6bb3iqhRVcZtLL8fxHWcou0WsmNlXxv_WkuGO6zIciCMBuGf3-2xbM2ITQmLOIfZmdnxlYs8zD9PdCcb1oVMA"
echo "Private Key: 0OlHyL1GXttN7zARdceGWIs6GQWnkb-dpiBvx3TQ3nA"
echo ""

cd "$(dirname "$0")/.."

firebase functions:secrets:set WEB_PUSH_VAPID_PUBLIC_KEY --project=topomatch-pwa
firebase functions:secrets:set WEB_PUSH_VAPID_PRIVATE_KEY --project=topomatch-pwa
firebase functions:config:set webpush.contact="mailto:support@topomatch.app" --project=topomatch-pwa

echo ""
echo "Done! Environment variables set for production."
echo "Redeploy functions with: npm run deploy:functions"

