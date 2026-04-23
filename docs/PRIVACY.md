# Privacy Policy — AWS Access Portal Prettifier

**Last updated:** April 22, 2026

## Overview

AWS Access Portal Prettifier is a Chrome extension that restyling the AWS IAM Identity Center (SSO) access portal with a card-based interface. Your privacy is important to us.

## Data Collection

This extension does **not** collect, transmit, or store any personal data. Specifically:

- No user data is sent to any external server
- No analytics or tracking of any kind
- No cookies are created
- No authentication credentials are accessed or stored

## Local Storage

The extension stores the following preferences locally in your browser using `localStorage`:

- **Card size preference** (small/medium/large)
- **Last-used IAM role per account** (for convenience)

This data never leaves your browser and can be cleared at any time via Chrome's "Clear browsing data" settings.

## Permissions

The extension only runs on AWS access portal pages (`*.awsapps.com` and `*.awsapps.cn`). It reads the page DOM to extract account names, IDs, and IAM role links in order to render the card UI. No other websites are accessed.

## Third Parties

This extension does not use any third-party services, libraries, or APIs.

## Changes

If this policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/garyliu/aws-access-portal-prettifier).
