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

const regionalVariants = { /* unchanged - keep your full object */ };

let pokemon = [];
let genStates = JSON.parse(localStorage.getItem(genStateKey)) || {};

const container = document.getElementById("pokedex");

/* ---------------- FIREBASE LOAD ---------------- */

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
                pokemon = data.results.map((p, index) => ({
                    name: capitalize(p.name),
                    id: index + 1,
                    caught: false,
                    variants: (regionalVariants[index + 1] || []).map(v => ({
                        form: v,
                        caught: false
                    }))
                }));

                save();
                render();
            });
    }
}

loadData();

function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/* ---------------- RENDER ---------------- */

function render() {
    container.innerHTML = "";

    let currentGen = null;

    pokemon.forEach((p, index) => {

        const genName = Object.keys(generations).find(g => {
            const r = generations[g];
            return p.id >= r.start && p.id <= r.end;
        });

        const isVisible = genStates[genName] ?? true;

        /* -------- GEN HEADER -------- */
        if (genName !== currentGen) {
            currentGen = genName;

            const header = document.createElement("div");
            header.className = "gen-header";

            const range = generations[genName];
            const genPokemon = pokemon.filter(x =>
                x.id >= range.start && x.id <= range.end
            );

            let baseCaught = 0, baseTotal = 0;
            let variantCaught = 0, variantTotal = 0;

            genPokemon.forEach(p => {
                baseTotal++;
                if (p.caught) baseCaught++;

                p.variants?.forEach(v => {
                    variantTotal++;
                    if (v.caught) variantCaught++;
                });
            });

            const basePercent = baseTotal ? Math.round((baseCaught / baseTotal) * 100) : 0;
            const variantPercent = variantTotal ? Math.round((variantCaught / variantTotal) * 100) : 0;

            const title = document.createElement("span");
            title.textContent = genName;

            const progress = document.createElement("span");
            progress.textContent =
                `Base: ${baseCaught}/${baseTotal} (${basePercent}%) | ` +
                `Forms: ${variantCaught}/${variantTotal} (${variantPercent}%)`;

            progress.style.opacity = "0.7";
            progress.style.fontSize = "14px";

            const toggleBtn = document.createElement("span");
            toggleBtn.className = "gen-toggle";
            toggleBtn.textContent = isVisible ? "−" : "+";

            toggleBtn.onclick = (e) => {
                e.stopPropagation();

                genStates[genName] = !genStates[genName];

                save();
                render(); // safe full refresh for headers only
            };

            header.appendChild(title);
            header.appendChild(progress);
            header.appendChild(toggleBtn);

            container.appendChild(header);
        }

        /* -------- BASE POKEMON -------- */

        const div = document.createElement("div");
        div.className = "pokemon";
        div.dataset.index = index;
        div.dataset.gen = genName;

        div.style.display = isVisible ? "flex" : "none";

        const img = document.createElement("img");

        img.loading = "lazy";

        img.src = p.caught
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;

        div.appendChild(img);

        if (p.caught) div.classList.add("caught");

        div.onclick = () => toggle(index);

        container.appendChild(div);

        /* -------- VARIANTS -------- */

        if (p.variants?.length) {

            const variantSprites = { /* keep your full mapping */ };

            p.variants.forEach((v, vIndex) => {

                const key = `${p.id}-${v.form}`;
                const spriteId = variantSprites[key];
                if (!spriteId) return;

                const variantDiv = document.createElement("div");
                variantDiv.className = "pokemon variant";
                variantDiv.dataset.gen = genName;
                variantDiv.style.display = isVisible ? "flex" : "none";

                const img = document.createElement("img");
                img.loading = "lazy";

                img.src = v.caught
                    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${spriteId}.png`
                    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`;

                variantDiv.appendChild(img);

                if (v.caught) variantDiv.classList.add("caught");

                variantDiv.onclick = () => toggleVariant(index, vIndex);

                container.appendChild(variantDiv);
            });
        }
    });
}

/* ---------------- TOGGLES (FAST - NO FULL REBUILD NEEDED) ---------------- */

function toggle(index) {
    const p = pokemon[index];
    p.caught = !p.caught;

    const el = document.querySelector(`[data-index="${index}"] img`);
    if (el) {
        el.src = p.caught
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    }

    save();
}

function toggleVariant(pIndex, vIndex) {
    const v = pokemon[pIndex].variants[vIndex];
    v.caught = !v.caught;

    save();
}

/* ---------------- THROTTLED SAVE (IMPORTANT PERFORMANCE FIX) ---------------- */

let saveTimeout;

function save() {
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
        await setDoc(doc(db, "pokedex", "main"), {
            pokemon,
            genStates
        });
    }, 500);
}
