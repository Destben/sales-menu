# Daily Menu — Shared Online Sales Tracker

This is a single-page web app based on the uploaded Daily Menu / Sales Tracker layout. It lets people:
- enter chef names for the day
- click +/- buttons to add or remove tallies in each box
- see automatic daily totals
- save multiple days
- see cumulative totals in the Overall Tracker
- export the saved history to CSV

## Important: making it actually shared

A plain HTML file cannot synchronize changes between different people's browsers. The included page therefore has two modes:

1. **Local mode** — works immediately, but each browser has its own data.
2. **Shared live mode** — connect it to a Firebase Realtime Database, then publish the page. Everyone using the published URL will see the same data.

### Firebase setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App to the project and copy its Firebase configuration.
3. Create a Realtime Database.
4. For a simple internal tracker, use database rules that require authentication if you want access restricted to signed-in users. If the page is intended for unrestricted public entry, use an appropriate authenticated/controlled setup rather than exposing a writable database anonymously.
5. Open `index.html` and find:
   `const FIREBASE_CONFIG=null;`
6. Replace `null` with your Firebase Web App config object.
7. Publish the folder on a static host such as GitHub Pages, Firebase Hosting, Netlify, or Vercel.

## Suggested database structure

tracker/
  days/
    2026-08-26/
      date
      chefs/
        0/
          name
          XM
          Watches Tablets
          ...
      nps
      rank
      mobileClose
      fiscalClose
      xmGoal
      rguGoal
      gpGoal
      accGoal
      special
      specialGoal
      notes

The page uses the original categories from the uploaded sheet, including XM, Watches Tablets, XMC, Net, Vid, CDV, Smart Home, TP, QP, Accessory, and Mobile Quote Sheets.
