const CONFIG={contactEmail:"ianschaefer11@yahoo.com"};

async function fetchPigs(dataUrl){
  const r=await fetch(dataUrl,{cache:"no-store"});
  if(!r.ok) throw new Error(`Unable to load inventory (${r.status})`);
  const pigs=await r.json();
  return [...pigs].sort((a,b)=>(a.sortOrder??999)-(b.sortOrder??999));
}

function statusClass(status=""){
  const s=status.toLowerCase();
  if(s.includes("pending")||s.includes("reserved")) return "pending";
  if(s.includes("sold")) return "sold";
  return "available";
}
function hasVideo(p){return Boolean((p.youtube||"").trim())}
function shortCopy(p){return p.title||p.description||"View photos, pedigree, breeder notes, and availability."}
function youtubeEmbedUrl(url){
  if(!url) return "";
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if(u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if(u.pathname.includes("/embed/")) return url;
    if(u.pathname.includes("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/shorts/")[1]}`;
  }catch(e){}
  return "";
}

async function buildCatalog(){
  const grid=document.getElementById("pig-grid");
  if(!grid) return;
  try{
    const pigs=await fetchPigs(document.body.dataset.dataUrl||"../data/pigs.json");
    grid.innerHTML="";
    pigs.forEach(p=>{
      const a=document.createElement("article");
      a.className="pig-card";
      a.innerHTML=`<div class="pig-card-media">
        <img src="../${p.photo}" alt="Lot ${p.lot}">
        ${hasVideo(p)?'<span class="video-pill">▶ Walk video</span>':""}
      </div>
      <div class="pig-card-content">
        <span class="badge ${statusClass(p.status)}">${p.status}</span>
        <h2>Lot ${p.lot}</h2>
        <p class="pig-card-meta">${[p.sex,p.breed].filter(Boolean).join(" • ")||"Show Pig"}</p>
        <p class="pig-card-copy">${shortCopy(p)}</p>
        <a class="button full" href="tag.html?lot=${encodeURIComponent(p.lot)}">View Lot</a>
      </div>`;
      grid.appendChild(a);
    });
    if(!pigs.length) grid.innerHTML='<div class="empty-state">No lots are currently listed.</div>';
  }catch(e){
    console.error(e);
    grid.innerHTML='<div class="empty-state">Inventory could not be loaded.</div>';
  }
}

async function buildFeatured(){
  const grid=document.getElementById("featured-grid");
  if(!grid) return;
  try{
    const pigs=await fetchPigs(document.body.dataset.dataUrl||"data/pigs.json");
    const f=pigs.filter(p=>p.featured).slice(0,3);
    const list=f.length?f:pigs.filter(p=>statusClass(p.status)==="available").slice(0,3);
    grid.innerHTML=list.map(p=>`<article class="pig-card">
      <div class="pig-card-media"><img src="${p.photo}" alt="Lot ${p.lot}">${hasVideo(p)?'<span class="video-pill">▶ Walk video</span>':""}</div>
      <div class="pig-card-content">
        <span class="badge ${statusClass(p.status)}">${p.status}</span>
        <h3>Lot ${p.lot}</h3>
        <p class="pig-card-meta">${[p.sex,p.breed].filter(Boolean).join(" • ")}</p>
        <a class="button full" href="pigs/tag.html?lot=${encodeURIComponent(p.lot)}">View Lot</a>
      </div>
    </article>`).join("");
  }catch(e){console.error(e)}
}

async function buildDetail(){
  const root=document.getElementById("lot-detail");
  if(!root) return;
  const lot=new URLSearchParams(location.search).get("lot");
  if(!lot){root.innerHTML='<div class="empty-state">No lot was selected.</div>';return}
  try{
    const pigs=await fetchPigs(document.body.dataset.dataUrl||"../data/pigs.json");
    const p=pigs.find(x=>String(x.lot)===String(lot));
    if(!p){root.innerHTML=`<div class="empty-state">Lot ${lot} could not be found.</div>`;return}
    document.title=`Lot ${p.lot} | Impact Livestock`;
    const embed=youtubeEmbedUrl(p.youtube);
    const interest=`../contact.html?lot=${encodeURIComponent(p.lot)}`;
    root.innerHTML=`<div class="detail-grid">
      <div class="detail-media">
        <img src="../${p.photo}" alt="Lot ${p.lot}">
        <div class="video-wrap">${embed?`<iframe class="video-frame" src="${embed}" title="Lot ${p.lot} walk video" allowfullscreen loading="lazy"></iframe>`:'<div class="no-video">Walk video coming soon.</div>'}</div>
      </div>
      <aside class="detail-panel">
        <span class="badge ${statusClass(p.status)}">${p.status}</span>
        <h1>Lot ${p.lot}</h1>
        <p class="detail-subtitle">${[p.sex,p.breed].filter(Boolean).join(" • ")}</p>
        <div class="quick-facts">
          <div class="fact"><span>Sire</span><strong>${p.sire||"—"}</strong></div>
          <div class="fact"><span>Dam</span><strong>${p.dam||"—"}</strong></div>
          <div class="fact"><span>DOB</span><strong>${p.dob||"—"}</strong></div>
          <div class="fact"><span>Video</span><strong>${hasVideo(p)?"Available":"Coming soon"}</strong></div>
        </div>
        ${p.price?`<div class="price">${p.price}</div>`:""}
        <div class="notes"><h2>Breeder's Notes</h2><p>${p.description||"Contact Impact Livestock for more information about this lot."}</p></div>
        ${statusClass(p.status)==="sold"?'<a class="button secondary full" href="../contact.html">Ask About Similar Pigs</a>':`<a class="button full" href="${interest}">I'm Interested in This Pig</a>`}
        <p class="cta-note">We'll confirm availability and next steps directly with you.</p>
      </aside>
    </div>`;
    if(statusClass(p.status)!=="sold"){
      document.body.classList.add("has-sticky-cta");
      const sticky=document.getElementById("sticky-cta");
      if(sticky) sticky.innerHTML=`<a class="button full" href="${interest}">I'm Interested in Lot ${p.lot}</a>`;
    }
  }catch(e){console.error(e);root.innerHTML='<div class="empty-state">This lot could not be loaded.</div>'}
}

function setupContactPage(){
  const form=document.getElementById("interest-form");
  if(!form) return;
  const lot=new URLSearchParams(location.search).get("lot")||"";
  document.getElementById("lot").value=lot;
  if(lot) document.getElementById("contact-intro").textContent=`Tell us how to reach you about Lot ${lot}.`;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    if(CONFIG.contactEmail.includes("YOUR_EMAIL")){alert("Add your email address to CONFIG.contactEmail in js/main.js.");return}
    const d=new FormData(form);
    const subject=lot?`Interest in Lot ${lot}`:"Impact Livestock Inquiry";
    const body=`Name: ${d.get("name")||""}\nPhone: ${d.get("phone")||""}\nEmail: ${d.get("email")||""}\nLot: ${d.get("lot")||""}\n\n${d.get("message")||""}`;
    location.href=`mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
document.addEventListener("DOMContentLoaded",()=>{buildCatalog();buildFeatured();buildDetail();setupContactPage()});