# Smart Shopping Cart

A simple, responsive web-based shopping cart built with Node.js/Express and vanilla JavaScript.

## Features
- Fetches products from Fake Store API
- Add to cart, update quantity, remove items
- Cart persistence using Firebase
- Live cart badge and total calculation
- Bootstrap styling with modal cart view

## How to Run
1. Install dependencies:
   ```bash
   npm init -y
   npm install express

### Firebase Setup Steps
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing).
3. Enable **Firestore Database** (start in test mode for development).
4. Go to Project Settings → Service Accounts → Generate new private key → Download the JSON file.
5. Rename it to `serviceAccountKey.json` and place it in the project root (**add to .gitignore** – never commit it!).
