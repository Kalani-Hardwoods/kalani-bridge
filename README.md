# Sawmill app documentation

This site is a how-to guide for the Kalani Sawmill app.

## Overview

The app deals with three areas.

### AppSheet

A mobile app to manage inventory.

### AWS

AWS infrastructure that connects AppSheet to Shopify.


### Shopify

The Kalani Hardwoods ecommerce store.

## Version control

The source code is hosted on a public GitHub repository.

> [!WARNING]
> Do not hard-code production URLs and API keys.

## Deployment 

This website is deployed to Vercel. A Neon database is required for authentication. All sensitive values should be stored in the database and accessed through a valid user session with the required roles.
