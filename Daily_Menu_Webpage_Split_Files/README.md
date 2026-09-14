# Daily Menu Sales Tracker — Split Files

Files:
- `index.html` — webpage structure
- `styles.css` — all styling
- `app.js` — people, tally buttons, daily totals, history, CSV export, and optional Firebase live synchronization

## Adding multiple people

The page now has:
- `+ Add Person` — adds one person/row
- `+ Add 5 People` — adds five rows at once
- `Remove Last Person` — removes the last row
- `×` beside each name — removes a specific person

Each person has independent tally boxes.

## Important: shared online mode

Opening `index.html` directly gives LOCAL MODE. That means different computers will NOT share data.

For everyone to see the same live tracker, connect Firebase Realtime Database in `app.js`:

1. Create a Firebase project.
2. Add a Web App.
3. Create a Realtime Database.
4. Copy the Web App configuration.
5. In `app.js`, replace:
   `const FIREBASE_CONFIG = null;`
   with your Firebase configuration object.
6. Publish `index.html`, `styles.css`, and `app.js` together on a web host.

Use Firebase Authentication / appropriate database security rules if the page should not be writable by the general public.

The original Daily Menu categories are preserved: XM, Watches Tablets, XMC, Net, Vid, CDV, Smart Home, TP, QP, Accessory, and Mobile Quote Sheets.

## Daily Excel sales reports

Use **Choose Excel File** in the selected day to attach an `.xlsx`, `.xls`, or `.csv` sales report. The page asks which store the report is for. If the first worksheet has a `Store`, `Store Name`, `Location`, `Retail Store`, or `Site` column, only rows for that store are imported and used for the calculations. The selected store and filtered report are stored with that day in local storage. Click **Save Day** after importing if Firebase is configured and the report should be shared with other users.

When the report contains recognizable labels, importing it fills Current NPS, Sales Ranker Position, Mobile Close Rate, Fiscal Close Rate, and Estimated Traffic Value. Enter the total XM target in **XM Goal by End of Fiscal Month**. The page calculates projected XM as `estimated traffic × mobile close rate`. XM needed is `max(0, fiscal-month XM goal - current XM tally - projected XM)`, rounded up to the next whole line. Common label variations are supported, but the report should use a label/value pair on the same row or in the row directly below.
