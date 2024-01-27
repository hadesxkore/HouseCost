// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCsQAtoNeH9CPkyhG6MxsbsGFLICdgJQAQ",
    authDomain: "housecost-d0e54.firebaseapp.com",
    databaseURL: "https://housecost-d0e54-default-rtdb.firebaseio.com",
    projectId: "housecost-d0e54",
    storageBucket: "housecost-d0e54.appspot.com",
    messagingSenderId: "228493188408",
    appId: "1:228493188408:web:8b91ee35628fd5ce77b5cd"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Function to add cost to Firebase and update totals
function addCost(inputId, totalId) {
    var cost = parseFloat(document.getElementById(inputId).value) || 0;

    // Add cost to Firebase
    db.collection('costs').add({
        type: inputId.replace('Input', ''),
        cost: cost,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update total for the specific cost type
    var totalElement = document.getElementById(totalId);
    totalElement.innerText = parseFloat(totalElement.innerText) + cost;

    // Update overall total
    updateOverallTotal();

    // Clear input field
    document.getElementById(inputId).value = '';

    // Display entered data
    displayEnteredData();
}

// Function to update overall total
function updateOverallTotal() {
    var overallTotalElement = document.getElementById('overallTotal');
    var materialsTotal = parseFloat(document.getElementById('materialsTotal').innerText) || 0;
    var workersTotal = parseFloat(document.getElementById('workersTotal').innerText) || 0;
    var foodTotal = parseFloat(document.getElementById('foodTotal').innerText) || 0;
    var additionalTotal = parseFloat(document.getElementById('additionalTotal').innerText) || 0;

    var overallTotal = materialsTotal + workersTotal + foodTotal + additionalTotal;

    overallTotalElement.innerText = overallTotal;

    // Store overall total in local storage
    localStorage.setItem('overallTotal', overallTotal.toString());
}
async function displayEnteredData() {
    var displayContainer = document.getElementById('enteredData');
    var totalEnteredData = 0;
    var exchangeRate = 1; // Replace this with the actual exchange rate

    try {
        // Retrieve data from Firebase
        const querySnapshot = await db.collection('costs').orderBy('timestamp', 'desc').get();

        // Clear previous data
        displayContainer.innerHTML = '';

        // Process and display retrieved data
        querySnapshot.forEach((doc) => {
            var data = doc.data();
            var costInPesos = data.cost * exchangeRate;

            var entryElement = document.createElement('div');
            entryElement.innerHTML = `
                <p class="flex justify-between items-center">
                    <strong>${data.type}:</strong> ₱${costInPesos.toFixed(2)}
                    <div class="flex space-x-2">
                        <button onclick="editCost('${doc.id}', '${data.type}')" class="text-blue-500 hover:underline">Edit</button>
                        <button onclick="deleteCost('${doc.id}', '${data.type}', ${data.cost})" class="text-red-500 hover:underline">Delete</button>
                    </div>
                </p>`;
            displayContainer.appendChild(entryElement);

            // Accumulate the cost for the total entered data in pesos
            totalEnteredData += costInPesos;
        });

        // Display total for entered data in pesos
        var totalElement = document.createElement('div');
        totalElement.innerHTML = `<p class="text-xl font-bold mt-4">Total Entered Data: ₱${totalEnteredData.toFixed(2)}</p>`;
        displayContainer.appendChild(totalElement);

        // Update overall total after data is retrieved
        updateOverallTotal();
    } catch (error) {
        console.error('Error getting documents: ', error);

        // Clear overall total when there is an error
        document.getElementById('overallTotal').innerText = '0';
    }
}



// Function to edit cost
async function editCost(docId, costType) {
    var newCost = prompt(`Enter the new cost for ${costType}:`);

    if (newCost !== null) {
        newCost = parseFloat(newCost) || 0;

        // Update cost in Firebase
        await db.collection('costs').doc(docId).update({
            cost: newCost
        });

        // Refresh displayed data
        displayEnteredData();
    }
}

// Function to delete cost
function deleteCost(docId, costType, cost) {
    // Delete cost from Firebase
    db.collection('costs').doc(docId).delete()
        .then(() => {
            // Update total for the specific cost type
            var totalElement = document.getElementById(costType + 'Total');
            totalElement.innerText = parseFloat(totalElement.innerText) - cost;

            // Update overall total
            updateOverallTotal();

            // Display entered data
            displayEnteredData();
        })
        .catch((error) => {
            console.error('Error deleting document: ', error);
        });
}


// Function to clear all entered data
function clearAllData() {
    // Confirm before clearing all data
    var confirmClear = confirm("Are you sure you want to clear all entered data?");

    if (confirmClear) {
        // Clear all data from Firebase
        db.collection('costs').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                doc.ref.delete();
            });

            // Clear all displayed data
            displayEnteredData();
        }).catch((error) => {
            console.error('Error clearing data: ', error);
        });
    }
}


// Initial display of entered data
document.addEventListener('DOMContentLoaded', function () {
    // Load overall total from local storage
    var storedOverallTotal = localStorage.getItem('overallTotal');
    if (storedOverallTotal !== null) {
        document.getElementById('overallTotal').innerText = storedOverallTotal;
    }

    displayEnteredData();
});