async function loadPigs() {

    try {

        const response = await fetch("../data/pigs.json");

        const pigs = await response.json();

        buildCatalog(pigs);

    }

    catch (error) {

        console.error(error);

    }

}

function buildCatalog(pigs) {

    const container = document.getElementById("pig-grid");

    if (!container) return;

    container.innerHTML = "";

    pigs.forEach(pig => {

        if (pig.status !== "Available") return;

        const card = document.createElement("article");

        card.className = "pig-card";

        card.innerHTML = `

            <img src="${pig.photo}" alt="Lot ${pig.lot}">

            <div class="pig-card-content">

                <div class="pig-status">${pig.status}</div>

                <h3>Lot ${pig.lot}</h3>

                <p><strong>${pig.sex}</strong> • ${pig.breed}</p>

                <p><strong>Sire:</strong> ${pig.sire}</p>

                <p><strong>Dam:</strong> ${pig.dam}</p>

                <p>${pig.description}</p>

                <div class="card-buttons">

                    <a class="button small"

                       href="tag241.html?lot=${pig.lot}">

                       View Details

                    </a>

                </div>

            </div>

        `;

        container.appendChild(card);

    });

}

loadPigs();
