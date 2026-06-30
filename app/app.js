// spatial-viz/app.js - Fixed Version
const CELL_TYPES = [
    { id: 'L2/3 IT', color: '#6366f1', zh: 'L2/3 兴奋性' },
    { id: 'L5 IT', color: '#8b5cf6', zh: 'L5 兴奋性' },
    { id: 'L6 CT', color: '#a78bfa', zh: 'L6 皮质丘脑' },
    { id: 'L4', color: '#c084fc', zh: 'L4 星形' },
    { id: 'Pvalb', color: '#f472b6', zh: '小清蛋白抑制性' },
    { id: 'Sst', color: '#fb7185', zh: '生长抑素抑制性' },
    { id: 'Vip', color: '#fb923c', zh: '血管活性肠肽' },
    { id: 'Astrocyte', color: '#10b981', zh: '星形胶质' },
    { id: 'Oligo', color: '#34d399', zh: '少突胶质' },
    { id: 'Microglia', color: '#38bdf8', zh: '小胶质' },
    { id: 'Endo', color: '#60a5fa', zh: '内皮' },
    { id: 'Peri', color: '#818cf8', zh: '周细胞' }
];

const GENE_NAMES = ['GAD1', 'GAD2', 'SLC17A7', 'PVALB', 'SST', 'VIP', 'LAMP5', 'MEIS2'];

const state = {
    lang: 'zh',
    viewMode: 'spatial2d',
    colorBy: 'cell_type',
    selectedGene: GENE_NAMES[0],
    highlightedSlice: 'all',
    axisRanges: { x: [0, 1000], y: [0, 1000], z: [0, 20] },
    data: [],
    geneStats: []
};

let deckInstance = null;
let threeScene, threeCamera, threeRenderer, threeControls, threePoints;
let isCameraSet = false;

async function init() {

    showStatus('Loading dataset...');


    await loadDataset();


    calculateGeneStats();


    setupUI();

    updateSliceDropdown();

    updateGeneDropdown();

    updateLegend();


    renderView();


    updateStats(state.data.length);


    showStatus(
        `Ready (${state.data.length.toLocaleString()} cells loaded)`
    );
}
async function loadDataset(){

    try{

        // 读取 index.html 传入的数据名
        const params =
            new URLSearchParams(
                window.location.search
            );


        const dataset =
            params.get('data');


        if(!dataset){

            throw new Error(
                "No dataset specified"
            );

        }


        // 读取json配置
        const res =
            await fetch(
                './datasets.config.json'
            );


        const cfg =
            await res.json();


        const ds =
            cfg.datasets.find(
                d=>d.id===dataset
            );


        if(!ds){

            throw new Error(
                `Dataset ${dataset} not found`
            );

        }


        console.log(
            "Loading:",
            ds
        );


        const dataRes =
            await fetch(
                 `./datasets/${ds.data}/cells.json`
    );


        state.data =
            await dataRes.json();



        console.log(
            "Cells:",
            state.data.length
        );


    }
    catch(err){

        console.error(err);

        showStatus(
            "Dataset loading failed"
        );

        state.data=[];

    }

}

// function generateSimulatedData(n) {
//     const data = [];
//     const patches = [
//         { x: 300, y: 200, types: ['L2/3 IT', 'L4'], r: 150 },
//         { x: 500, y: 400, types: ['L5 IT', 'L6 CT'], r: 200 },
//         { x: 700, y: 300, types: ['Astrocyte', 'Oligo'], r: 120 },
//         { x: 400, y: 700, types: ['Pvalb', 'Sst', 'Vip'], r: 180 },
//         { x: 200, y: 600, types: ['Microglia', 'Endo'], r: 100 },
//         { x: 800, y: 600, types: ['Peri', 'L2/3 IT'], r: 130 }
//     ];
//     for (let i = 0; i < n; i++) {
//         const patch = patches[Math.floor(Math.random() * patches.length)];
//         const angle = Math.random() * Math.PI * 2;
//         const r = Math.sqrt(Math.random()) * patch.r;
//         const x = patch.x + Math.cos(angle) * r;
//         const y = patch.y + Math.sin(angle) * r;
//         const z = Math.random() * 20;
//         const slice = Math.floor((z / 20) * 14) + 1;
//         const type = patch.types[Math.floor(Math.random() * patch.types.length)];

//         const genes = {};
//         GENE_NAMES.forEach(g => { genes[g] = Math.random() < 0.7 ? 0 : Math.random() * 2; });

//         data.push({ id: `Cell_${i}`, type, x, y, z, slice, genes, nCount: Math.floor(Math.random() * 5000) });
//     }
//     return data;
// }

// function calculateGeneStats() {
//     state.geneStats = GENE_NAMES.map(name => ({ name, mean: Math.random() * 2 + 0.5 }));
// }

function calculateGeneStats(){

    if(state.data.length===0)
        return;


    const genes =
        Object.keys(
            state.data[0].genes || {}
        );


    state.geneStats =
        genes.map(name=>({

            name:name,

            mean:
            state.data.reduce(
                (a,b)=>
                a+(b.genes[name]||0),
                0
            )
            /
            state.data.length

        }));

}

function setupUI() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.viewMode = btn.dataset.view;
            document.getElementById('pageTitle').textContent = getLabel(btn.dataset.view);
            renderView();
            document.getElementById('axisControl').style.display = (state.viewMode.includes('3d')) ? 'block' : 'none';
        });
    });

    ['X', 'Y', 'Z'].forEach(axis => {
        const minSlider = document.getElementById(`range${axis}Min`);
        const maxSlider = document.getElementById(`range${axis}Max`);

        const updateAxis = () => {
            let min = parseFloat(minSlider.value);
            let max = parseFloat(maxSlider.value);
            if (min > max) [min, max] = [max, min];
            state.axisRanges[axis.toLowerCase()] = [min, max];
            if (state.viewMode.includes('3d')) updateThree();
        };

        minSlider.addEventListener('input', updateAxis);
        maxSlider.addEventListener('input', updateAxis);
    });

    document.getElementById('sliceSelect').addEventListener('change', (e) => {
        state.highlightedSlice = e.target.value;
        updateAllViews();
    });
    document.getElementById('geneSearch').addEventListener('input', (e) => updateGeneDropdown(e.target.value));
    document.getElementById('geneSelect').addEventListener('change', (e) => { state.selectedGene = e.target.value; updateAllViews(); });

    document.getElementById('legend').addEventListener('click', (e) => {
        const item = e.target.closest('.legend-item');
        if (item) {
            const type = item.dataset.type;
            state.highlightedCluster = (state.highlightedCluster === type) ? null : type;
            updateLegend();
            updateAllViews();
        }
    });

    document.getElementById('langToggle').addEventListener('click', () => {
        state.lang = state.lang === 'zh' ? 'en' : 'zh';
        document.getElementById('langToggle').textContent = state.lang === 'zh' ? 'EN' : '中文';
        updateLegend();
        document.getElementById('pageTitle').textContent = getLabel(state.viewMode);
    });
}

function updateSliceDropdown() {
    const select = document.getElementById('sliceSelect');
    select.innerHTML = '<option value="all">All Slices</option>';
    for(let i=1; i<=15; i++) {
        const opt = document.createElement('option');
        opt.value = i; opt.textContent = `Slice ${i}`;
        select.appendChild(opt);
    }
}

function updateGeneDropdown(filter = '') {
    const select = document.getElementById('geneSelect');
    select.innerHTML = '';
    const f = filter.toLowerCase();
    state.geneStats.forEach(g => {
        if (g.name.toLowerCase().includes(f)) {
            const opt = document.createElement('option');
            opt.value = g.name; opt.textContent = g.name;
            if (g.name === state.selectedGene) opt.selected = true;
            select.appendChild(opt);
        }
    });
}

function setColorMode(mode) {
    state.colorBy = mode;
    document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
    document.querySelector(`.btn-toggle[onclick*="${mode}"]`).classList.add('active');
    document.getElementById('geneControl').classList.toggle('hidden', mode !== 'gene_expression');
    updateAllViews();
}

function updateLegend() {
    const container = document.getElementById('legend');
    container.innerHTML = '';
    CELL_TYPES.forEach(type => {
        const div = document.createElement('div');
        div.className = 'legend-item'; div.dataset.type = type.id;
        if (state.highlightedCluster && state.highlightedCluster !== type.id) div.style.opacity = '0.3';
        div.innerHTML = `<div class="legend-dot" style="background:${type.color}"></div>
                         <span>${getLabel(type.id)}</span>`;
        container.appendChild(div);
    });
}

function renderView() {
    const deckContainer = document.getElementById('deckgl-container');
    const threeContainer = document.getElementById('three-container');
    if (state.viewMode.includes('3d')) {
        deckContainer.style.display = 'none';
        threeContainer.style.display = 'block';
        initThree();
    } else {
        deckContainer.style.display = 'block';
        threeContainer.style.display = 'none';
        initDeck();
    }
}

function updateAllViews() {
    if (state.viewMode.includes('3d')) updateThree();
    else initDeck();
}

// ========================
// 2D View Logic (Deck.gl)
// ========================
function initDeck() {
    const container = document.getElementById('deckgl-container');
    container.style.width = '100%'; container.style.height = '100%';

    const visibleData = state.data.filter(d => {
        if (state.highlightedSlice !== 'all' && d.slice != state.highlightedSlice) return false;
        return true;
    });

    if (deckInstance) deckInstance.finalize();

    deckInstance = new deck.DeckGL({
        container: container,
        controller: true,
        initialViewState: { longitude: 0, latitude: 0, zoom: 1 },
        layers: [new deck.ScatterplotLayer({
            id: 'scatter-2d',
            data: visibleData,
            getPosition: d => [d.x, d.y, 0],
            getColor: d => getCellColor(d),
            getRadius: 3,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 0, 128],
            onHover: ({object}) => handleHover(object)
        })]
    });
    updateStats(visibleData.length);
}

// ========================
// 3D View Logic (Three.js)
// ========================
function initThree() {
    const container = document.getElementById('three-container');
    const w = container.clientWidth, h = container.clientHeight;

    if (!threeRenderer) {
        threeScene = new THREE.Scene();
        threeCamera = new THREE.PerspectiveCamera(60, w/h, 0.1, 10000);
        threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        threeRenderer.setSize(w, h);
        container.innerHTML = '';
        container.appendChild(threeRenderer.domElement);
        threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
        threeControls.enableDamping = true;

        animateThree();
        isCameraSet = false;
    } else {
        threeRenderer.setSize(w, h);
    }

    updateThreeGeometry();
}

function updateThreeGeometry() {
    const count = state.data.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;

    state.data.forEach((d, i) => {
        positions[i*3]   = (d.x - 500) * 0.1;
        positions[i*3+1] = (d.y - 500) * 0.1;
        positions[i*3+2] = (d.z - 10) * 2;

        const rgb = getCellColor(d);
        colors[i*3] = rgb[0]/255;
        colors[i*3+1] = rgb[1]/255;
        colors[i*3+2] = rgb[2]/255;

        if(d.x<minX) minX=d.x; if(d.x>maxX) maxX=d.x;
        if(d.y<minY) minY=d.y; if(d.y>maxY) maxY=d.y;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    if (threePoints) { 
        threeScene.remove(threePoints); 
        threePoints.geometry.dispose(); 
    }

    threePoints = new THREE.Points(geometry, new THREE.PointsMaterial({ 
        size: 4, 
        vertexColors: true, 
        sizeAttenuation: true 
    }));

    threeScene.add(threePoints);

    if (!isCameraSet) {
        const cx = (minX + maxX) / 2 - 500;
        const cy = (minY + maxY) / 2 - 500;
        threeCamera.position.set(cx, cy, 1000);
        threeControls.target.set(cx, cy, 0);
        threeControls.update();
        isCameraSet = true;
    }
}

function updateThree() {
    if (!threeRenderer || !threePoints) return;

    const positions = threePoints.geometry.attributes.position;
    const colors = threePoints.geometry.attributes.color;
    let visibleCount = 0;

    for (let i = 0; i < state.data.length; i++) {
        const d = state.data[i];

        const inSlice = (state.viewMode.includes('umap')) || (state.highlightedSlice === 'all' || d.slice == state.highlightedSlice);
        const inRange = !(d.x < state.axisRanges.x[0] || d.x > state.axisRanges.x[1] || 
                          d.y < state.axisRanges.y[0] || d.y > state.axisRanges.y[1] || 
                          d.z < state.axisRanges.z[0] || d.z > state.axisRanges.z[1]);
        const isHighlighted = !(state.highlightedCluster && d.type !== state.highlightedCluster);

        positions.setXYZ(i, (d.x - 500) * 0.1, (d.y - 500) * 0.1, (d.z - 10) * 2);

        if (inSlice && inRange && isHighlighted) {
            const rgb = getCellColor(d);
            colors.setXYZ(i, rgb[0]/255, rgb[1]/255, rgb[2]/255);
            visibleCount++;
        } else {
            colors.setXYZ(i, 0.98, 0.98, 0.98); 
        }
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    updateStats(visibleCount);
}

function animateThree() {
    requestAnimationFrame(animateThree);
    if (threeControls) threeControls.update();
    if (threeRenderer) threeRenderer.render(threeScene, threeCamera);
}

// ========================
// Helpers
// ========================
function getCellColor(d) {
    const isDimmed = (state.highlightedCluster && d.type !== state.highlightedCluster);
    let rgb;
    if (state.colorBy === 'cell_type') {
        const typeObj = CELL_TYPES.find(c => c.id === d.type);
        rgb = typeObj ? hexToRgb(typeObj.color) : [200, 200, 200];
    } else {
        const val = d.genes[state.selectedGene] || 0;
        rgb = geneToRgb(val, 2); 
    }
    return rgb;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return [r, g, b];
}

function geneToRgb(val, max) {
    const t = Math.min(1, val / max);
    if (t < 0.25) return [0, Math.floor(t*4*255), 255];
    if (t < 0.5) return [0, 255, Math.floor(255 - (t-0.25)*4*255)];
    if (t < 0.75) return [Math.floor((t-0.5)*4*255), 255, 0];
    return [255, Math.floor(255-(t-0.75)*4*255), 0];
}

function getLabel(id) {
    const t = CELL_TYPES.find(c => c.id === id);
    if (t) return state.lang === 'zh' ? t.zh : t.id;
    if (id === 'spatial2d') return 'Spatial 2D';
    if (id === 'spatial3d') return 'Spatial 3D';
    if (id === 'umap2d') return 'UMAP 2D';
    if (id === 'umap3d') return 'UMAP 3D';
    return id;
}

function showStatus(msg) { document.getElementById('dataStatus').textContent = msg; }
function updateStats(c) {
    document.getElementById('statCells').textContent = state.data.length.toLocaleString();
    document.getElementById('statVisible').textContent = c.toLocaleString();
}

window.addEventListener('DOMContentLoaded', init);