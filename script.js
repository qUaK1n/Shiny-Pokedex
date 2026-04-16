import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

const generations = {
    "Gen 1 (Kanto)": { start: 1, end: 151 },
    "Gen 2 (Johto)": { start: 152, end: 251 },
    "Gen 3 (Hoenn)": { start: 252, end: 386 },
    "Gen 4 (Sinnoh)": { start: 387, end: 493 },
    "Gen 5 (Unova)": { start: 494, end: 649 },
    "Gen 6 (Kalos)": { start: 650, end: 721 },
    "Gen 7 (Alola)": { start: 722, end: 809 },
    "Gen 8 (Galar)": { start: 810, end: 905 },
    "Gen 9 (Paldea)": { start: 906, end: 1025 }
};

const genStateKey = "pokedex_gen_states";

const regionalVariants = {
    19: ["Alolan"], 20: ["Alolan"], 26: ["Alolan"], 27: ["Alolan"], 28: ["Alolan"],
    37: ["Alolan"], 38: ["Alolan"], 50: ["Alolan"], 51: ["Alolan"],
    52: ["Alolan", "Galarian"], 53: ["Alolan"],
    74: ["Alolan"], 75: ["Alolan"], 76: ["Alolan"],
    88: ["Alolan"], 89: ["Alolan"],
    103: ["Alolan"], 105: ["Alolan"],

    77: ["Galarian"], 78: ["Galarian"], 79: ["Galarian"], 80: ["Galarian"],
    83: ["Galarian"], 110: ["Galarian"], 122: ["Galarian"],
    144: ["Galarian"], 145: ["Galarian"], 146: ["Galarian"],
    199: ["Galarian"], 222: ["Galarian"], 263: ["Galarian"], 264: ["Galarian"],
    554: ["Galarian"], 555: ["Galarian"], 562: ["Galarian"], 618: ["Galarian"],

    58: ["Hisuian"], 59: ["Hisuian"], 100: ["Hisuian"], 101: ["Hisuian"],
    157: ["Hisuian"], 211: ["Hisuian"], 215: ["Hisuian"],
    503: ["Hisuian"], 549: ["Hisuian"], 570: ["Hisuian"], 571: ["Hisuian"],
    628: ["Hisuian"], 705: ["Hisuian"], 706: ["Hisuian"],
    713: ["Hisuian"], 724: ["Hisuian"],

    128: ["Paldean"], 194: ["Paldean"]
};

let pokemon = [];
let genStates = JSON.parse(localStorage.getItem(genStateKey)) || {};
const container = document.getElementById("pokedex");

// 🧠 cache DOM elements for speed
const pokemonElements = {};

// ---------------- LOAD ----------------

async function loadData() {
    const docRef = doc(db, "pokedex", "main");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        pokemon = data.pokemon;
        genStates = data.genStates || {};
        render();
    } else {
        fetch("https://pokeapi.co/api/v2/pokemon?limit=1025")
            .then(res => res.json())
            .then(data => {
                pokemon = data.results.map((p, index) => {
                    const id = index + 1;

                    return {
                        name: capitalize(p.name),
                        id,
                        caught: false,
                        variants: (regionalVariants[id] || []).map(v => ({
                            form: v,
                            caught: false
                        }))
                    };
                });

                save();
                render();
            });
    }
}

// ---------------- RENDER ----------------

function render() {
    container.innerHTML = "";
    pokemonElements = {};

    let currentGen = "";

    pokemon.forEach((p, index) => {

        const genName = Object.keys(generations).find(g => {
            const r = generations[g];
            return p.id >= r.start && p.id <= r.end;
        });

        if (genName !== currentGen) {
            currentGen = genName;

            const header = document.createElement("div");
            header.className = "gen-header";
            header.textContent = genName;

            container.appendChild(header);
        }

        const div = document.createElement("div");
        div.className = "pokemon";
        div.setAttribute("data-gen", genName);
        div.setAttribute("data-index", index);

        const img = document.createElement("img");

        const baseURL =
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

        img.src = p.caught
            ? `${baseURL}/shiny/${p.id}.png`
            : `${baseURL}/${p.id}.png`;

        div.appendChild(img);

        if (p.caught) div.classList.add("caught");

        div.onclick = () => toggle(index);

        pokemonElements[index] = div;
        container.appendChild(div);
    });
}

// ---------------- TOGGLE ----------------

function toggle(index) {
    const p = pokemon[index];
    if (!p) return;

    p.caught = !p.caught;

    const el = pokemonElements[index];
    if (!el) return;

    el.classList.toggle("caught", p.caught);

    const img = el.querySelector("img");

    const baseURL =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

    img.src = p.caught
        ? `${baseURL}/shiny/${p.id}.png`
        : `${baseURL}/${p.id}.png`;

    save();
}

// ---------------- SAVE ----------------

function save() {
    setDoc(doc(db, "pokedex", "main"), {
        pokemon,
        genStates
    });
}

// ---------------- HELPERS ----------------

function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

// ---------------- START ----------------

loadData();
