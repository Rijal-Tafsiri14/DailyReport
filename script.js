// ===== Elements =====
const navDashboard = document.getElementById('navDashboard');
const navInput = document.getElementById('navInput');
const dashboardPanel = document.getElementById('dashboard');
const inputPanel = document.getElementById('input');
const filterTanggal = document.getElementById('filterTanggal');
const refreshBtn = document.getElementById('refreshBtn');

const categorySelect = document.getElementById('categorySelect');
const dynamicForm = document.getElementById('dynamicForm');

// Cards elements
const orderLegend = document.getElementById('orderLegend');
const orderTable = document.getElementById('orderTable');
const paninLegend = document.getElementById('paninLegend');
const paninTable = document.getElementById('paninTable');
const tableOut = document.getElementById('tableOut');
const tableIn = document.getElementById('tableIn');

// Buttons for actions
const exportOrderBtn = document.getElementById('exportOrder');
const deleteAllOrderBtn = document.getElementById('deleteAllOrder');
const exportPaninBtn = document.getElementById('exportPanin');
const deleteAllPaninBtn = document.getElementById('deleteAllPanin');
const exportOutBtn = document.getElementById('exportOut');
const deleteAllOutBtn = document.getElementById('deleteAllOut');
const exportInBtn = document.getElementById('exportIn');
const deleteAllInBtn = document.getElementById('deleteAllIn');

const charts = {};

// ===== Storage Keys =====
const KEY_ORDER = 'order';
const KEY_PANIN = 'panin';
const KEY_OUT = 'irKeluar';
const KEY_IN = 'irMasuk';

// ===== Form definitions =====
const formDefs = {
  order: [
    {k:'Total SO', label:'Total SO (Released)', type:'number'},
    {k:'Qty Released', label:'Qty Released', type:'number'},
    {k:'Done (SO)', label:'Done (By SO)', type:'number'},
    {k:'Done (Qty)', label:'Done (By Qty)', type:'number'},
    {k:'Pending (SO)', label:'Pending (By SO)', type:'number'},
    {k:'%Done', label:'% Done', type:'percent', readonly:true},
    {k:'Note', label:'Keterangan (opsional)', type:'text'}
  ],
  panin: [
    {k:'Total SO', label:'Total SO (Released)', type:'number'},
    {k:'Qty Released', label:'Qty Released', type:'number'},
    {k:'Done (SO)', label:'Done (By SO)', type:'number'},
    {k:'Done (Qty)', label:'Done (By Qty)', type:'number'},
    {k:'Pending (SO)', label:'Pending (By SO)', type:'number'},
    {k:'%Done', label:'% Done', type:'percent', readonly:true},
    {k:'Note', label:'Keterangan (opsional)', type:'text'}
  ],
  irKeluar: [
    {k:'Jumlah IR', label:'Jumlah IR', type:'number'},
    {k:'WH Tujuan', label:'WH Tujuan', type:'text'},
    {k:'Qty SKU', label:'Qty SKU', type:'number'},
    {k:'Qty Pcs', label:'Qty Pcs', type:'number'},
    {k:'Note', label:'Keterangan (opsional)', type:'text'}
  ],
  irMasuk: [
    {k:'Jumlah IR', label:'Jumlah IR', type:'number'},
    {k:'WH Origin', label:'WH Origin', type:'text'},
    {k:'Qty SKU', label:'Qty SKU', type:'number'},
    {k:'Qty Pcs', label:'Qty Pcs', type:'number'},
    {k:'Note', label:'Keterangan (opsional)', type:'text'}
  ]
};

// ===== Helpers: load/save =====
function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

// ===== Navigation =====
navDashboard.addEventListener('click', ()=> {
  navDashboard.classList.add('active');
  navInput.classList.remove('active');
  dashboardPanel.classList.add('active');
  inputPanel.classList.remove('active');
  updateDashboard();
});
navInput.addEventListener('click', ()=> {
  navInput.classList.add('active');
  navDashboard.classList.remove('active');
  inputPanel.classList.add('active');
  dashboardPanel.classList.remove('active');
});

// ===== Dynamic Form generation & auto % =====
categorySelect.addEventListener('change', ()=> renderForm(categorySelect.value) );

function renderForm(cat){
  dynamicForm.innerHTML = '';
  if(!cat){ dynamicForm.innerHTML = '<div class="form-note">Pilih kategori untuk menampilkan form input.</div>'; return; }
  const defs = formDefs[cat];
  const formEl = document.createElement('div');
  formEl.className = 'form-card';
  const formTag = document.createElement('form');
  formTag.id = 'catForm';

  defs.forEach(def=>{
    const label = document.createElement('label'); label.textContent = def.label;
    let input = document.createElement('input');
    input.name = def.k;
    input.id = def.k.replace(/\s+/g, '_');
    input.placeholder = def.label;
    input.type = (def.type === 'number' || def.type === 'percent') ? 'number' : 'text';
    if(def.readonly) { input.readOnly = true; input.style.background = '#f0fdfa'; }
    formTag.appendChild(label);
    formTag.appendChild(input);
  });

  // form actions
  const actions = document.createElement('div'); actions.className='form-actions';
  const saveBtn = document.createElement('button'); saveBtn.type='submit'; saveBtn.className='btn'; saveBtn.textContent='💾 Simpan';
  const resetBtn = document.createElement('button'); resetBtn.type='button'; resetBtn.className='btn small'; resetBtn.textContent='✖ Reset';
  actions.appendChild(saveBtn); actions.appendChild(resetBtn);
  formTag.appendChild(actions);
  formEl.appendChild(formTag);
  dynamicForm.appendChild(formEl);

  // auto % calc for order & panin
  if(cat === 'order' || cat === 'panin'){
    const qty = formTag.querySelector('input[name="Qty Released"]');
    const done = formTag.querySelector('input[name="Done (Qty)"]');
    const pct = formTag.querySelector('input[name="%Done"]');
    const calc = ()=> {
      const qv = Number(qty?.value) || 0;
      const dv = Number(done?.value) || 0;
      if(pct) pct.value = qv ? ((dv / qv) * 100).toFixed(2) : 0;
    };
    if(qty && done){ qty.addEventListener('input', calc); done.addEventListener('input', calc); }
  }

  // handle submit
  formTag.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const fd = new FormData(formTag);
    const entry = { id: Date.now(), Tanggal: new Date().toLocaleDateString('id-ID') };
    for(const [k,v] of fd.entries()){
      // store numeric as numbers for number/percent fields
      const def = defs.find(d=> d.k === k);
      if(def && (def.type === 'number' || def.type === 'percent')) entry[k] = v === '' ? 0 : Number(v);
      else entry[k] = v;
    }
    // save to corresponding key
    if(cat === 'order'){ const arr = load(KEY_ORDER); arr.push(entry); save(KEY_ORDER, arr); }
    if(cat === 'panin'){ const arr = load(KEY_PANIN); arr.push(entry); save(KEY_PANIN, arr); }
    if(cat === 'irKeluar'){ const arr = load(KEY_OUT); arr.push(entry); save(KEY_OUT, arr); }
    if(cat === 'irMasuk'){ const arr = load(KEY_IN); arr.push(entry); save(KEY_IN, arr); }

    alert('✅ Data tersimpan');
    renderForm(cat); // reset
    populateTanggalOptions();
    updateDashboard();
  });

  resetBtn.addEventListener('click', ()=> renderForm(cat));
}

// ===== Populate tanggal options (from all categories) =====
function populateTanggalOptions(){
  const all = [...load(KEY_ORDER), ...load(KEY_PANIN), ...load(KEY_OUT), ...load(KEY_IN)];
  const dates = [...new Set(all.map(x => x.Tanggal))];
  filterTanggal.innerHTML = `<option value="all">📅 Semua Tanggal</option>` + dates.map(d => `<option value="${d}">${d}</option>`).join('');
}

// ===== Render Chart (Order & Panin) =====
function createPie(ctx, done, pending, colorDone='#26c6da', colorPend='#ffb74d'){
  return new Chart(ctx, {
    type:'pie',
    data: { labels:['Done','Pending'], datasets:[{ data:[done, pending], backgroundColor:[colorDone, colorPend] }]},
    options: {
      plugins: {
        legend:{ position:'right' },
        datalabels:{ color:'#fff', formatter:(val, ctx)=> {
          const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
          return total ? `${val} (${((val/total)*100).toFixed(1)}%)` : `${val} (0%)`;
        }, font:{ weight:'600', size:12 } }
      },
      maintainAspectRatio:false
    },
    plugins: [ChartDataLabels]
  });
}

function renderOrderCard(list){
  // chart
  const ctx = document.getElementById('chartOrder').getContext('2d');
  if(charts.order) charts.order.destroy();
  const done = list.reduce((s,r)=> s + (Number(r['Done (Qty)'])||0), 0);
  const total = list.reduce((s,r)=> s + (Number(r['Qty Released'])||0), 0);
  const pending = Math.max(0, total - done);
  charts.order = createPie(ctx, done, pending, '#26c6da', '#ffb74d');

  // legend + list
  orderLegend.innerHTML = '';
  const title = document.createElement('div'); title.innerHTML = '<strong>Legend & Detail</strong>'; orderLegend.appendChild(title);
  const doneItem = document.createElement('div'); doneItem.className='legend-item'; doneItem.innerHTML = `<div class="legend-color" style="background:#26c6da"></div><div>Done</div>`; orderLegend.appendChild(doneItem);
  const pendItem = document.createElement('div'); pendItem.className='legend-item'; pendItem.innerHTML = `<div class="legend-color" style="background:#ffb74d"></div><div>Pending</div>`; orderLegend.appendChild(pendItem);
  orderLegend.appendChild(document.createElement('hr'));

  if(!list.length){ const p=document.createElement('div'); p.textContent='Belum ada data untuk tanggal ini.'; orderLegend.appendChild(p); }
  else {
    list.slice().reverse().forEach(item=>{
      const li = document.createElement('div'); li.className='list-item';
      li.innerHTML = `<strong>${item.Note || '—'}</strong><div style="font-size:12px;color:#555;margin-top:4px">
        TotalSO: ${item['Total SO']||0} • Qty: ${item['Qty Released']||0} • Done: ${item['Done (Qty)']||0} • % ${item['%Done']||0}%</div>`;
      orderLegend.appendChild(li);
    });
  }

  // table
  const thead = orderTable.querySelector('thead');
  const tbody = orderTable.querySelector('tbody');
  if(!list.length){ thead.innerHTML=''; tbody.innerHTML=`<tr><td colspan="9">Belum ada data</td></tr>`; return; }
  const headers = ['Tanggal','Total SO','Qty Released','Done (SO)','Done (Qty)','Pending (SO)','%Done','Note'];
  thead.innerHTML = '<tr>' + headers.map(h=> `<th>${h}</th>`).join('') + '<th>Aksi</th></tr>';
  tbody.innerHTML = list.map(item=> {
    return `<tr>
      ${headers.map(h=> `<td>${item[h] || ''}</td>`).join('')}
      <td><button class="deleteBtn" data-cat="order" data-id="${item.id}">🗑️</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('.deleteBtn').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const id = Number(ev.currentTarget.dataset.id);
      let arr = load(KEY_ORDER);
      arr = arr.filter(r=> r.id !== id);
      save(KEY_ORDER, arr);
      populateTanggalOptions();
      updateDashboard();
      alert('🗑️ Entry dihapus.');
    });
  });
}

function renderPaninCard(list){
  const ctx = document.getElementById('chartPanin').getContext('2d');
  if(charts.panin) charts.panin.destroy();
  const done = list.reduce((s,r)=> s + (Number(r['Done (Qty)'])||0), 0);
  const total = list.reduce((s,r)=> s + (Number(r['Qty Released'])||0), 0);
  const pending = Math.max(0, total - done);
  charts.panin = createPie(ctx, done, pending, '#06b6a4', '#ffd27f');

  // legend + list
  paninLegend.innerHTML = '';
  const title = document.createElement('div'); title.innerHTML = '<strong>Legend & Detail</strong>'; paninLegend.appendChild(title);
  const doneItem = document.createElement('div'); doneItem.className='legend-item'; doneItem.innerHTML = `<div class="legend-color" style="background:#06b6a4"></div><div>Done</div>`; paninLegend.appendChild(doneItem);
  const pendItem = document.createElement('div'); pendItem.className='legend-item'; pendItem.innerHTML = `<div class="legend-color" style="background:#ffd27f"></div><div>Pending</div>`; paninLegend.appendChild(pendItem);
  paninLegend.appendChild(document.createElement('hr'));

  if(!list.length){ const p=document.createElement('div'); p.textContent='Belum ada data untuk tanggal ini.'; paninLegend.appendChild(p); }
  else {
    list.slice().reverse().forEach(item=>{
      const li = document.createElement('div'); li.className='list-item';
      li.innerHTML = `<strong>${item.Note || '—'}</strong><div style="font-size:12px;color:#555;margin-top:4px">
        TotalSO: ${item['Total SO']||0} • Qty: ${item['Qty Released']||0} • Done: ${item['Done (Qty)']||0} • % ${item['%Done']||0}%</div>`;
      paninLegend.appendChild(li);
    });
  }

  // table
  const thead = paninTable.querySelector('thead');
  const tbody = paninTable.querySelector('tbody');
  if(!list.length){ thead.innerHTML=''; tbody.innerHTML=`<tr><td colspan="9">Belum ada data</td></tr>`; return; }
  const headers = ['Tanggal','Total SO','Qty Released','Done (SO)','Done (Qty)','Pending (SO)','%Done','Note'];
  thead.innerHTML = '<tr>' + headers.map(h=> `<th>${h}</th>`).join('') + '<th>Aksi</th></tr>';
  tbody.innerHTML = list.map(item=> {
    return `<tr>
      ${headers.map(h=> `<td>${item[h] || ''}</td>`).join('')}
      <td><button class="deleteBtn" data-cat="panin" data-id="${item.id}">🗑️</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('.deleteBtn').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const id = Number(ev.currentTarget.dataset.id);
      let arr = load(KEY_PANIN);
      arr = arr.filter(r=> r.id !== id);
      save(KEY_PANIN, arr);
      populateTanggalOptions();
      updateDashboard();
      alert('🗑️ Entry dihapus.');
    });
  });
}

// ===== Render IR tables (out/in) =====
function renderIrTable(id, list, keyName){
  const table = document.getElementById(id);
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  if(!list.length){ thead.innerHTML=''; tbody.innerHTML=`<tr><td colspan="8">Belum ada data</td></tr>`; return; }

  // collect headers from object keys (preserve order)
  const headers = ['Tanggal', ...Object.keys(list[0]).filter(k=> k !== 'Tanggal' && k !== 'id')]; 
  thead.innerHTML = '<tr>' + headers.map(h=> `<th>${h}</th>`).join('') + '<th>Aksi</th></tr>';

  tbody.innerHTML = list.map(item=>{
    return `<tr>
      ${headers.map(h=> `<td>${item[h] || ''}</td>`).join('')}
      <td><button class="deleteBtn" data-key="${keyName}" data-id="${item.id}">🗑️</button></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.deleteBtn').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const id = Number(ev.currentTarget.dataset.id);
      const key = ev.currentTarget.dataset.key;
      let arr = load(key);
      arr = arr.filter(r=> r.id !== id);
      save(key, arr);
      populateTanggalOptions();
      updateDashboard();
      alert('🗑️ Entry dihapus.');
    });
  });
}

// ===== Update dashboard (filter by tanggal) =====
function updateDashboard(){
  const selected = filterTanggal.value || 'all';
  const getFiltered = (arrKey) => {
    const arr = load(arrKey);
    return selected === 'all' ? arr : arr.filter(x => x.Tanggal === selected);
  };

  const orderList = getFiltered(KEY_ORDER);
  const paninList = getFiltered(KEY_PANIN);
  const outList = getFiltered(KEY_OUT);
  const inList = getFiltered(KEY_IN);

  renderOrderCard(orderList);
  renderPaninCard(paninList);
  renderIrTable('tableOut', outList, KEY_OUT);
  renderIrTable('tableIn', inList, KEY_IN);
}

// ===== Delete all handlers & export handlers =====
deleteAllOrderBtn.addEventListener('click', ()=> {
  if(!confirm('Hapus semua Data Order?')) return;
  save(KEY_ORDER, []); populateTanggalOptions(); updateDashboard(); alert('Semua Data Order dihapus.');
});
deleteAllPaninBtn.addEventListener('click', ()=> {
  if(!confirm('Hapus semua Data Panin?')) return;
  save(KEY_PANIN, []); populateTanggalOptions(); updateDashboard(); alert('Semua Data Panin dihapus.');
});
deleteAllOutBtn.addEventListener('click', ()=> {
  if(!confirm('Hapus semua Data IR Keluar?')) return;
  save(KEY_OUT, []); populateTanggalOptions(); updateDashboard(); alert('Semua Data IR Keluar dihapus.');
});
deleteAllInBtn.addEventListener('click', ()=> {
  if(!confirm('Hapus semua Data IR Masuk?')) return;
  save(KEY_IN, []); populateTanggalOptions(); updateDashboard(); alert('Semua Data IR Masuk dihapus.');
});

// export simple CSV helper
function exportCSV(filename, headers, rows){
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${(r[h]||'')}"`).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

exportOrderBtn.addEventListener('click', ()=>{
  const arr = load(KEY_ORDER);
  if(!arr.length){ alert('Belum ada data Order.'); return; }
  const headers = ['Tanggal','Total SO','Qty Released','Done (SO)','Done (Qty)','Pending (SO)','%Done','Note'];
  exportCSV(`order_${new Date().toISOString().slice(0,10)}.csv`, headers, arr);
});
exportPaninBtn.addEventListener('click', ()=>{
  const arr = load(KEY_PANIN);
  if(!arr.length){ alert('Belum ada data Panin.'); return; }
  const headers = ['Tanggal','Total SO','Qty Released','Done (SO)','Done (Qty)','Pending (SO)','%Done','Note'];
  exportCSV(`panin_${new Date().toISOString().slice(0,10)}.csv`, headers, arr);
});
exportOutBtn.addEventListener('click', ()=>{
  const arr = load(KEY_OUT);
  if(!arr.length){ alert('Belum ada data IR Keluar.'); return; }
  // gather headers
  const headers = ['Tanggal', ...Object.keys(arr[0]).filter(k=> k!=='Tanggal' && k!=='id')];
  exportCSV(`irkeluar_${new Date().toISOString().slice(0,10)}.csv`, headers, arr);
});
exportInBtn.addEventListener('click', ()=>{
  const arr = load(KEY_IN);
  if(!arr.length){ alert('Belum ada data IR Masuk.'); return; }
  const headers = ['Tanggal', ...Object.keys(arr[0]).filter(k=> k!=='Tanggal' && k!=='id')];
  exportCSV(`irmasuk_${new Date().toISOString().slice(0,10)}.csv`, headers, arr);
});

// ===== Events: filter / refresh =====
filterTanggal.addEventListener('change', updateDashboard);
refreshBtn.addEventListener('click', updateDashboard);

// ===== INIT =====
populateTanggalOptions();
updateDashboard();
