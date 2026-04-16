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

// 🔥 Regional variants list
const regionalVariants = {
    // Alolan
    19: ["Alolan"],
    20: ["Alolan"],
    26: ["Alolan"],
    27: ["Alolan"],
    28: ["Alolan"],
    37: ["Alolan"],
    38: ["Alolan"],
    50: ["Alolan"],
    51: ["Alolan"],
    52: ["Alolan", "Galarian"],
    53: ["Alolan"],
    74: ["Alolan"],
    75: ["Alolan"],
    76: ["Alolan"],
    88: ["Alolan"],
    89: ["Alolan"],
    103: ["Alolan"],
    105: ["Alolan"],

    // Galarian
    77: ["Galarian"],
    78: ["Galarian"],
    79: ["Galarian"],
    80: ["Galarian"],
    83: ["Galarian"],
    110: ["Galarian"],
    122: ["Galarian"],
    144: ["Galarian"],
    145: ["Galarian"],
    146: ["Galarian"],
    199: ["Galarian"],
    222: ["Galarian"],
    263: ["Galarian"],
    264: ["Galarian"],
    554: ["Galarian"],
    555: ["Galarian"],
    562: ["Galarian"],
    618: ["Galarian"],

    // Hisuian
    58: ["Hisuian"],   // Growlithe
    59: ["Hisuian"],   // Arcanine
    100: ["Hisuian"],
    101: ["Hisuian"],
    157: ["Hisuian"],  // Typhlosion
    211: ["Hisuian"],  // Qwilfish
    215: ["Hisuian"],  // Sneasel
    503: ["Hisuian"],  // Samurott
    549: ["Hisuian"],  // Lilligant
    570: ["Hisuian"],  // Zorua
    571: ["Hisuian"],  // Zoroark
    628: ["Hisuian"],  // Braviary
    705: ["Hisuian"],  // Sliggoo
    706: ["Hisuian"],  // Goodra
    713: ["Hisuian"],  // Braviary
    724: ["Hisuian"],  // Decidueye

    // Paldean
    128: ["Paldean"],  // Tauros
    194: ["Paldean"],  // Wooper
};

// 🔥 Form name mapping for sprite URLs
const formMap = {
    Alolan: "alola",
    Galarian: "galar",
    Hisuian: "hisui",
    Paldean: "paldea"
};

let pokemon = [];
let genStates = JSON.parse(localStorage.getItem(genStateKey)) || {};

const container = document.getElementById("pokedex");

// Load saved data first
const saved = localStorage.getItem("pokedex");

if (saved) {
    pokemon = JSON.parse(saved);

    pokemon = pokemon.map((p, index) => ({
        name: p.name,
        id: p.id ?? index + 1,
        caught: p.caught ?? false,
        variants: p.variants ?? []
    }));

    render();
} else {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=1025")
        .then(res => res.json())
        .then(data => {
            pokemon = data.results.map((p, index) => {
                const id = index + 1;

                return {
                    name: capitalize(p.name),
                    id: id,
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

function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function render() {
    container.innerHTML = "";

    let currentGen = "";

    pokemon.forEach((p, index) => {

        const genName = Object.keys(generations).find(g => {
            const range = generations[g];
            return p.id >= range.start && p.id <= range.end;
        });

        // 🔥 GEN HEADER
        if (genName !== currentGen) {
            currentGen = genName;

            const header = document.createElement("div");
            header.className = "gen-header";

            const range = generations[genName];

            const genPokemon = pokemon.filter(x =>
                x.id >= range.start && x.id <= range.end
            );

            let baseCaught = 0;
            let baseTotal = 0;

            let variantCaught = 0;
            let variantTotal = 0;

            genPokemon.forEach(p => {
                // 🔹 Base Pokémon
                baseTotal++;
                if (p.caught) baseCaught++;

                // 🔹 Variants
                if (p.variants && p.variants.length > 0) {
                    p.variants.forEach(v => {
                        variantTotal++;
                        if (v.caught) variantCaught++;
                    });
                }
            });
            const basePercent = baseTotal
                ? Math.round((baseCaught / baseTotal) * 100)
                : 0;

            const variantPercent = variantTotal
                ? Math.round((variantCaught / variantTotal) * 100)
                : 0;

            const title = document.createElement("span");
            title.textContent = genName;

            const progress = document.createElement("span");
            progress.textContent =
                `Base: ${baseCaught}/${baseTotal} (${basePercent}%) | ` +
                `Regional Forms: ${variantCaught}/${variantTotal} (${variantPercent}%)`;
            progress.style.opacity = "0.7";
            progress.style.fontSize = "14px";

            const toggleBtn = document.createElement("span");
            toggleBtn.className = "gen-toggle";

            let visible = genStates[genName] ?? true;
            toggleBtn.textContent = visible ? "−" : "+";

            const applyVisibility = () => {
                document
                    .querySelectorAll(`[data-gen="${genName}"]`)
                    .forEach(el => {
                        el.style.display = visible ? "flex" : "none";
                    });
            };

            setTimeout(applyVisibility, 0);

            toggleBtn.onclick = (e) => {
                e.stopPropagation();

                visible = !visible;
                genStates[genName] = visible;

                applyVisibility();

                toggleBtn.textContent = visible ? "−" : "+";

                save();
            };

            header.appendChild(title);
            header.appendChild(progress);
            header.appendChild(toggleBtn);

            container.appendChild(header);
        }

        // 🧱 Base Pokémon
        const div = document.createElement("div");
        div.className = "pokemon";
        div.setAttribute("data-gen", genName);

        const img = document.createElement("img");

        img.src = p.caught
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;

        div.appendChild(img);

        if (p.caught) div.classList.add("caught");

        div.onclick = () => toggle(index);

        container.appendChild(div);

        // 🔥 Variants
        if (p.variants && p.variants.length > 0) {

            const variantSprites = {
                // Alolan
                "19-Alolan": 10091,
                "20-Alolan": 10092,
                "26-Alolan": 10100,
                "27-Alolan": 10101,
                "28-Alolan": 10102,
                "37-Alolan": 10103,
                "38-Alolan": 10104,
                "50-Alolan": 10105,
                "51-Alolan": 10106,
                "52-Alolan": 10107,
                "53-Alolan": 10108,
                "74-Alolan": 10109,
                "75-Alolan": 10110,
                "76-Alolan": 10111,
                "88-Alolan": 10112,
                "89-Alolan": 10113,
                "103-Alolan": 10114,
                "105-Alolan": 10115,

                // Galarian
                "52-Galarian": 10161,
                "77-Galarian": 10162,
                "78-Galarian": 10163,
                "79-Galarian": 10164,
                "80-Galarian": 10165,
                "83-Galarian": 10166,
                "110-Galarian": 10167,
                "122-Galarian": 10168,
                "144-Galarian": 10169,
                "145-Galarian": 10170,
                "146-Galarian": 10171,
                "199-Galarian": 10172,
                "222-Galarian": 10173,
                "263-Galarian": 10174,
                "264-Galarian": 10175,
                "554-Galarian": 10176,
                "555-Galarian": 10177,
                "562-Galarian": 10179,
                "618-Galarian": 10180,

                // Hisuian
                "58-Hisuian": 10229,
                "59-Hisuian": 10230,
                "100-Hisuian": 10231,
                "101-Hisuian": 10232,
                "157-Hisuian": 10233,
                "211-Hisuian": 10234,
                "215-Hisuian": 10235,
                "503-Hisuian": 10236,
                "549-Hisuian": 10237,
                "570-Hisuian": 10238,
                "571-Hisuian": 10239,
                "628-Hisuian": 10240,
                "705-Hisuian": 10241,
                "706-Hisuian": 10242,
                "713-Hisuian": 10243,
                "724-Hisuian": 10244,

                //Paldean
                "128-Paldean": 10250,
                "194-Paldean": 10253
            };

            p.variants.forEach((v, vIndex) => {
                const variantDiv = document.createElement("div");
                variantDiv.className = "pokemon variant";
                variantDiv.setAttribute("data-gen", genName);

                const img = document.createElement("img");

                const key = `${p.id}-${v.form}`;
                const spriteId = variantSprites[key];

                if (!spriteId) return; // skip if missing

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

function toggle(index) {
    pokemon[index].caught = !pokemon[index].caught;
    save();
    render();
}

function toggleVariant(pIndex, vIndex) {
    const variant = pokemon[pIndex].variants[vIndex];
    variant.caught = !variant.caught;

    save();
    render();
}

function save() {
    localStorage.setItem("pokedex", JSON.stringify(pokemon));
    localStorage.setItem(genStateKey, JSON.stringify(genStates));
}

function updateGlobalProgress() {
    let baseCaught = 0;
    let baseTotal = 0;

    let variantCaught = 0;
    let variantTotal = 0;

    pokemon.forEach(p => {
        baseTotal++;
        if (p.caught) baseCaught++;

        if (p.variants) {
            p.variants.forEach(v => {
                variantTotal++;
                if (v.caught) variantCaught++;
            });
        }
    });

    const totalCaught = baseCaught + variantCaught;
    const total = baseTotal + variantTotal;

    const percent = total ? Math.round((totalCaught / total) * 100) : 0;

    document.getElementById("progress-text").textContent =
        `Overall: ${totalCaught}/${total} (${percent}%)`;

    document.getElementById("progress-fill").style.width = percent + "%";
}