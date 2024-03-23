//Created by Tibor Boros

const recordRouteForm = document.getElementById("route-recording-form");
const requiredFields = ["regPlate", "vehicleType", "consumption", "dateTime", "fromCity", "fromStreet", "fromHouseNumber", "toCity", "toStreet", "toHouseNumber", "distance", "toPartnerName"];

const themeToggleBtn = document.getElementById("theme-toggle");


const firebaseConfig = {
	apiKey: "AIzaSyBvmWc76TCJUo5Cx1ta1OUgPDVorx_jcA8",
	authDomain: "solyomsoft-routetracker.firebaseapp.com",
	projectId: "solyomsoft-routetracker",
	storageBucket: "solyomsoft-routetracker.appspot.com",
	messagingSenderId: "521151547583",
	appId: "1:521151547583:web:fc26144d63b36f76e95e0a",
	measurementId: "G-N17Z7SVJMG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Access Firestore database
const db = firebase.firestore();

themeToggleBtn.addEventListener("click", function () {
	const currentTheme = document.body.dataset.bsTheme; // Get current theme
	const newTheme = currentTheme === "light" ? "dark" : "light"; // Toggle theme
	document.body.dataset.bsTheme = newTheme; // Set new theme
});


recordRouteForm.addEventListener("submit", function (event) {
	event.preventDefault(); // Prevent default form submission behavior

	// Check for empty required fields
	let hasEmptyField = false;
	for (const fieldId of requiredFields) {
		const fieldValue = document.getElementById(fieldId).value;
		if (!fieldValue) {
			hasEmptyField = true;
			break; // Exit the loop if an empty field is found
		}
	}

	if (hasEmptyField) {
		alert("Kérem töltse ki az összes szükséges mezöt!.");
		return;
	}
	// Capture form data
	const regPlate = document.getElementById("regPlate").value;
	const vehicleType = document.getElementById("vehicleType").value;
	const consumption = document.getElementById("consumption").value;
	const dateTime = document.getElementById("dateTime").value;
	const fromCity = document.getElementById("fromCity").value;
	const fromStreet = document.getElementById("fromStreet").value;
	const fromHouseNumber = document.getElementById("fromHouseNumber").value;
	const fromText = document.getElementById("fromText").value;
	const toCity = document.getElementById("toCity").value;
	const toStreet = document.getElementById("toStreet").value;
	const toHouseNumber = document.getElementById("toHouseNumber").value;
	const toText = document.getElementById("toText").value;
	const toPartnerName = document.getElementById("toPartnerName").value;
	const distance = parseFloat(document.getElementById("distance").value);

	// Data validation (example)
	if (distance <= 0) {
		alert("Kérem adjon meg valós adatot (Pozitív számot)!");
		return;
	}

	// Create route object
	const newRoute = {
		regPlate,
		vehicleType,
		consumption,

		from: {
			city: fromCity,
			street: fromStreet,
			houseNumber: fromHouseNumber,
			text: fromText,
		},
		to: {
			city: toCity,
			street: toStreet,
			houseNumber: toHouseNumber,
			text: toText,
			partnerName: toPartnerName,
		},
		dateTime,
		distance,
	};

	// Add route to Firestore 
	db.collection("Routes").add(newRoute)
		.then(function (docRef) {
			console.log("Document written with ID:", docRef.id);
			// Clear the form and display success message
			recordRouteForm.reset();
			alert("Sikeresen rögzített útvonal!");
		})
		.catch(function (error) {
			console.error("Error adding document:", error);
			// Display error message to the user
			alert("Hiba történt a mentés során. Kérem próbalja újra!");
		});
	getUniqueVehicles();
	displayRoutes();
	calculateSummary();
});

const vehicleFilter = document.getElementById("vehicleFilter");
vehicleFilter.addEventListener("change", function (event) {
	const selectedVehicle = event.target.value;
	displayRoutes(selectedVehicle);
});


function getUniqueVehicles() {
	db.collection("Routes")
		.where("regPlate", "!=", "") // Exclude empty regPlate
		.get()
		.then((querySnapshot) => {
			const existingOptions = new Set( // Store existing options
				Array.from(document.getElementById("vehicleFilter").options)
					.map((option) => option.value)
			);
			const vehicleSet = new Set(); // Use a Set to store unique values from routes

			querySnapshot.forEach((doc) => {
				const regPlate = doc.data().regPlate;
				if (!existingOptions.has(regPlate)) { // Check if not already an option
					vehicleSet.add(regPlate);
				}
			});

			const vehicleOptions = Array.from(vehicleSet); // Convert Set to array
			vehicleOptions.forEach((option) => {
				const optionElement = document.createElement("option");
				optionElement.value = option;
				optionElement.innerText = option;
				vehicleFilter.appendChild(optionElement);
			});
		})
		.catch((error) => {
			console.error("Error fetching registration plates:", error);
		});
}



// Function to fetch and display routes based on filter selection
function displayRoutes(selectedVehicle) {
	let query = db.collection("Routes"); // Base query
	if (selectedVehicle && selectedVehicle !== "") {
		query = query.where("regPlate", "==", selectedVehicle); // Filter by vehicle
	}
	query
		.get()
		.then((querySnapshot) => {
			const tableContainer = document.getElementById("routeTableContainer");
			tableContainer.innerHTML = ""; // Clear existing table content

			const table = document.createElement("table");
			table.classList.add("table", "table-striped");

			const tableHead = document.createElement("thead");
			const tableRow = document.createElement("tr");

			// Table headers
			["Rendszán", "Dátum", "Honnan", "Hova", "Tavolság", "Fogyasztás (L/100km)"].forEach((header) => {
				const tableHeaderCell = document.createElement("th");
				tableHeaderCell.innerText = header;
				tableRow.appendChild(tableHeaderCell);
			});
			tableHead.appendChild(tableRow);
			table.appendChild(tableHead);

			const tableBody = document.createElement("tbody");
			querySnapshot.forEach((doc) => {
				const routeData = doc.data();
				const tableRow = document.createElement("tr");

				// Table data cells
				[
					routeData.regPlate,
					routeData.dateTime,
					`${routeData.from.city}, ${routeData.from.street} ${routeData.from.houseNumber}`,
					`${routeData.to.city}, ${routeData.to.street} ${routeData.to.houseNumber}`,
					routeData.distance,
					routeData.consumption ? routeData.consumption : "", // Display consumption if available
				].forEach((cellData) => {
					const tableDataCell = document.createElement("td");
					tableDataCell.innerText = cellData;
					tableRow.appendChild(tableDataCell);
				});
				tableBody.appendChild(tableRow);
			});
			table.appendChild(tableBody);
			tableContainer.appendChild(table);
		})
		.catch((error) => {
			console.error("Error fetching routes:", error);
		});
}

function calculateSummary() {
	let totalDistance = 0;
	let totalFuelConsumption = 0;

	db.collection("Routes")
		.get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				const routeData = doc.data();
				totalDistance += routeData.distance;
				if (routeData.consumption) { // Check if consumption data exists
					totalFuelConsumption += (routeData.distance * routeData.consumption) / 100;
				}
			});

			const summaryPanel = document.getElementById("summary-panel");
			summaryPanel.innerHTML = ""; // Clear existing content

			// Create container element with container and mt-5 class
			const summaryContainer = document.createElement("div");
			summaryContainer.classList.add("container");
			summaryContainer.classList.add("mt-5");

			const summaryText = document.createElement("p");
			summaryText.innerText = `Összes megtett út: ${totalDistance.toFixed(2)} km`;
			summaryContainer.appendChild(summaryText);

			if (totalFuelConsumption > 0) { // Display fuel consumption if available
				const fuelConsumptionText = document.createElement("p");
				fuelConsumptionText.innerText = `Összesen elhasznált üzemanyag: ${totalFuelConsumption.toFixed(2)} L`;
				summaryContainer.appendChild(fuelConsumptionText);
			}

			summaryPanel.appendChild(summaryContainer); // Append container to panel
		})
		.catch((error) => {
			console.error("Error fetching routes:", error);
		});
}




getUniqueVehicles(); // Fetch and populate vehicle dropdown on load
displayRoutes(); // Display all vehicle statistics
calculateSummary(); // Call the function to calculate and display summary on page load

