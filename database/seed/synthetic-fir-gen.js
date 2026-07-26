// database/seed/synthetic-fir-gen.js
const fs = require('fs');
const path = require('path');

// Core Lookup Data
const crimeSubHeads = ["Murder (BNS 103)", "Kidnapping (BNS 137)", "Theft (BNS 303)", "Cheating (BNS 318)"];
const firstNames = ["Anil", "Rahul", "Priya", "Kavya", "Arjun", "Neha", "Ravi", "Sneha", "Kiran"];
const lastNames = ["Kumar", "Sharma", "Gowda", "Patil", "Reddy", "Iyer", "Rao", "Desai", "Shetty"];

const loadGovtDivisions = () => {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, '../../config/karnataka-divisions.json'));
        return JSON.parse(rawData).divisions;
    } catch (e) {
        console.error("Warning: Could not load divisions file.");
        return [{ divisionName: "Default Division", pincodes: ["560001"] }];
    }
};

const getRandomName = () => {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${fName} ${lName}`;
};

// Generate the complete interconnected dataset
const generateFullRelationalDataset = (totalRecords = 300) => {
    const divisions = loadGovtDivisions();
    const caseMasterTable = [];
    const victimTable = [];
    const accusedTable = [];
    const complainantTable = [];

    for (let i = 1; i <= totalRecords; i++) {
        const caseId = 1000 + i;
        const randomDiv = divisions[Math.floor(Math.random() * divisions.length)];
        const randomPincode = randomDiv.pincodes[Math.floor(Math.random() * randomDiv.pincodes.length)];
        const crimeIndex = Math.floor(Math.random() * crimeSubHeads.length);

        // 1. Parent Record: CaseMaster
        caseMasterTable.push({
            CaseMasterID: caseId,
            CrimeNo: `1044300062026000${i.toString().padStart(3, '0')}`,
            CaseNo: `2026000${i.toString().padStart(3, '0')}`,
            CrimeRegisteredDate: new Date(2026, Math.floor(Math.random() * 6), i % 28 + 1).toISOString().split('T')[0],
            CrimeMajorHeadID: Math.floor(crimeIndex / 2) + 1,
            CrimeMinorHeadID: crimeIndex + 1,
            CaseStatusID: Math.floor(Math.random() * 4) + 1,
            BriefFacts: `Incident registered under ${randomDiv.divisionName} at pincode ${randomPincode} regarding alleged ${crimeSubHeads[crimeIndex]}.`,
            Pincode: randomPincode,
            DivisionName: randomDiv.divisionName
        });

        // 2. Child Records: Victims (1 to Many)
        const numVictims = Math.floor(Math.random() * 3) + 1;
        for (let v = 1; v <= numVictims; v++) {
            victimTable.push({
                VictimMasterID: parseInt(`${caseId}0${v}`),
                CaseMasterID: caseId, // The Foreign Key link
                VictimName: getRandomName(),
                AgeYear: Math.floor(Math.random() * 60) + 15,
                GenderID: Math.random() > 0.5 ? 1 : 2
            });
        }

        // 3. Child Records: Accused (1 to Many)
        const numAccused = Math.floor(Math.random() * 3) + 1;
        for (let a = 1; a <= numAccused; a++) {
            accusedTable.push({
                AccusedMasterID: parseInt(`${caseId}1${a}`),
                CaseMasterID: caseId, // The Foreign Key link
                AccusedName: getRandomName(),
                AgeYear: Math.floor(Math.random() * 40) + 18,
                GenderID: Math.random() > 0.8 ? 2 : 1
            });
        }

        // 4. Child Records: Complainants (1 to 1)
        complainantTable.push({
            ComplainantID: parseInt(`${caseId}21`),
            CaseMasterID: caseId, // The Foreign Key link
            ComplainantName: getRandomName(),
            AgeYear: Math.floor(Math.random() * 50) + 20
        });
    }

    return { caseMasterTable, victimTable, accusedTable, complainantTable };
};

// Execute and visualize the relational mapping in the terminal
if (require.main === module) {
    const { caseMasterTable, victimTable, accusedTable } = generateFullRelationalDataset(5);

    const targetCaseId = caseMasterTable[0].CaseMasterID;

    console.log("--- Relational Database Mock Snapshot ---");
    console.log("\n[1. Main CaseMaster Record]");
    console.log(JSON.stringify(caseMasterTable[0], null, 2));

    console.log(`\n[2. Victim(s) linked to Case ${targetCaseId}]`);
    console.log(JSON.stringify(victimTable.filter(v => v.CaseMasterID === targetCaseId), null, 2));

    console.log(`\n[3. Accused linked to Case ${targetCaseId}]`);
    console.log(JSON.stringify(accusedTable.filter(a => a.CaseMasterID === targetCaseId), null, 2));
}

module.exports = { generateFullRelationalDataset };