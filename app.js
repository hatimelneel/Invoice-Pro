
const KEY="invoicepro_rebuilt_v2";
let db=JSON.parse(localStorage.getItem(KEY)||'{"invoices":[],"quotes":[],"customers":[],"products":[],"expenses":[],"settings":{}}');
let lang=localStorage.getItem("invoicepro_lang")||"en";
const DEFAULT_LOGO="smart-gate-logo.jpeg";
function companyLogo(){return (db.settings&&db.settings.logo)||DEFAULT_LOGO}
function changeLogo(ev){const f=ev.target.files&&ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(!db.settings)db.settings={};db.settings.logo=r.result;saveDB();logoPreview.src=r.result};r.readAsDataURL(f)}

let items=[],qitems=[],previewBack="home",previewDoc=null,previewType="invoice",editingInvoiceIndex=null,editingQuoteIndex=null;

function saveDB(){localStorage.setItem(KEY,JSON.stringify(db))}
function currency(){return lang==="ar"?"ر.ع":"OMR"}
function money(v){return lang==="ar"?Number(v||0).toFixed(3)+" ر.ع":Number(v||0).toFixed(3)+" OMR"}
function nextNo(prefix,arr){return prefix+"-"+String(arr.length+1).padStart(5,"0")}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function tr(en,ar){return lang==="ar"?ar:en}
function setLang(l){lang=l;localStorage.setItem("invoicepro_lang",l);document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.querySelectorAll("[data-en]").forEach(el=>el.textContent=el.dataset[l]);document.querySelectorAll("[data-ph-en]").forEach(el=>el.placeholder=el.dataset["ph"+(l==="ar"?"Ar":"En")]);enBtn.classList.toggle("active",l==="en");arBtn.classList.toggle("active",l==="ar");renderHome();renderLists();populate();if(previewDoc)renderPaper(previewDoc,previewType)}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");if(id==="home")renderHome();if(id==="invoiceList")renderInvoices();if(id==="customers")renderCustomers();if(id==="products")renderProducts();if(id==="expenses")renderExpenses();if(id==="quoteList")renderQuotes();if(id==="settings")loadSettings();populate()}
function populate(){
  customerSelect.innerHTML='<option value="">'+tr("-- Select customer --","-- اختر العميل --")+'</option>'+db.customers.map((c,i)=>`<option value="${i}">${esc(c.name)}</option>`).join("");
  productSelect.innerHTML='<option value="">'+tr("-- Select product/service --","-- اختر المنتج/الخدمة --")+'</option>'+db.products.map((p,i)=>`<option value="${i}">${esc(p.name)} - ${money(p.price)}</option>`).join("");
}
function startInvoice(){editingInvoiceIndex=null;items=[];invoiceNo.textContent=nextNo("INV",db.invoices);customerName.value=customerPhone.value=customerAddress.value=itemName.value=price.value=notes.value=terms.value="";qty.value=1;paid.value=0;if(document.getElementById("paidFull")){paidFull.checked=false;paid.readOnly=false;}vatToggle.checked=false;vatRate.value=5;renderItems();updateTotals();show("invoiceForm")}
function startQuote(){editingQuoteIndex=null;qitems=[];quoteNo.textContent=nextNo("QT",db.quotes);qCustomer.value=qItem.value=qPrice.value="";qQty.value=1;qValidity.value=30;if(document.getElementById("qNotes"))qNotes.value="";if(document.getElementById("qTerms"))qTerms.value="";renderQItems();show("quoteForm")}
function selectCustomer(){const i=customerSelect.value;if(i==="")return;const c=db.customers[+i];customerName.value=c.name;customerPhone.value=c.phone||"";customerAddress.value=c.address||""}
function selectProduct(){const i=productSelect.value;if(i==="")return;const p=db.products[+i];itemName.value=p.name;price.value=p.price;qty.value=1}
function addItem(){const n=itemName.value.trim(),q=+qty.value,p=+price.value;if(!n||q<=0)return;items.push({name:n,qty:q,price:p});itemName.value=price.value="";qty.value=1;renderItems();updateTotals()}
function renderItems(){itemList.innerHTML=items.map((x,i)=>`<div class="item-row"><div><strong>${esc(x.name)}</strong><small>${x.qty} × ${money(x.price)}</small></div><div><strong>${money(x.qty*x.price)}</strong><br><button class="del" onclick="items.splice(${i},1);renderItems();updateTotals()">${tr("Delete","حذف")}</button></div></div>`).join("")}
function totals(){let s=items.reduce((a,x)=>a+x.qty*x.price,0),v=vatToggle.checked?s*(+vatRate.value||0)/100:0,t=s+v,p=+paid.value||0;return{sub:s,vat:v,total:t,paid:p,balance:Math.max(t-p,0),vatEnabled:vatToggle.checked,vatRate:+vatRate.value||0}}
function updateTotals(){const t=totals();subT.textContent=money(t.sub);vatT.textContent=money(t.vat);grandT.textContent=money(t.total);vatLine.classList.toggle("hidden",!t.vatEnabled);vatRateBox.classList.toggle("hidden",!t.vatEnabled)}
function currentInvoiceObj(){const t=totals();return{number:invoiceNo.textContent,customer:customerName.value.trim(),phone:customerPhone.value.trim(),address:customerAddress.value.trim(),date:new Date().toISOString(),items:[...items],notes:notes.value.trim(),terms:terms.value.trim(),...t}}
function previewCurrentInvoice(){const o=currentInvoiceObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}previewDoc=o;previewType="invoice";previewBack="invoiceForm";previewDocNo.textContent=o.number;renderPaper(o,"invoice");show("preview")}
function saveInvoice(){const o=currentInvoiceObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}if(editingInvoiceIndex!==null){db.invoices[editingInvoiceIndex]=o;editingInvoiceIndex=null;}else{db.invoices.unshift(o);}saveDB();previewDoc=o;previewType="invoice";previewBack="invoiceList";renderPaper(o,"invoice");show("preview")}
function addQItem(){const n=qItem.value.trim(),q=+qQty.value,p=+qPrice.value;if(!n||q<=0)return;qitems.push({name:n,qty:q,price:p});qItem.value=qPrice.value="";qQty.value=1;renderQItems()}
function renderQItems(){qItems.innerHTML=qitems.map((x,i)=>`<div class="item-row"><div><strong>${esc(x.name)}</strong><small>${x.qty} × ${money(x.price)}</small></div><button class="del" onclick="qitems.splice(${i},1);renderQItems()">${tr("Delete","حذف")}</button></div>`).join("")}
function currentQuoteObj(){let s=qitems.reduce((a,x)=>a+x.qty*x.price,0);return{number:quoteNo.textContent,customer:qCustomer.value.trim(),date:new Date().toISOString(),validity:+qValidity.value||30,items:[...qitems],sub:s,vat:0,total:s,paid:0,balance:s,vatEnabled:false,vatRate:0,notes:(document.getElementById("qNotes")?qNotes.value.trim():""),terms:(document.getElementById("qTerms")?qTerms.value.trim():"")}}
function previewCurrentQuote(){const o=currentQuoteObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}previewDoc=o;previewType="quote";previewBack="quoteForm";previewDocNo.textContent=o.number;renderPaper(o,"quote");show("preview")}
function saveQuote(){const o=currentQuoteObj();if(!o.customer||!o.items.length)return;if(editingQuoteIndex!==null){db.quotes[editingQuoteIndex]=o;editingQuoteIndex=null;}else{db.quotes.unshift(o);}saveDB();previewDoc=o;previewType="quote";previewBack="quoteList";renderPaper(o,"quote");show("preview")}
function getPrintableHTML(){
  const currentPaper = document.getElementById("paper");
  const cssHref = new URL("styles.css?v=20260824-printios", window.location.href).href;
  const dir = lang==="ar" ? "rtl" : "ltr";
  const title = previewType==="invoice" ? tr("Invoice","فاتورة") : tr("Quotation","عرض سعر");
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${cssHref}">
<style>
html,body{background:#fff!important;margin:0!important;padding:0!important}
body{padding-bottom:0!important}
.print-shell{width:100%;display:flex;justify-content:center;background:#fff}
#printClone{box-shadow:none!important;border-radius:0!important;margin:0 auto!important}
@page{size:A4 portrait;margin:6mm}
@media print{
  .print-help{display:none!important}
  #printClone{box-sizing:border-box!important;width:198mm!important;height:278mm!important;max-height:278mm!important;min-height:0!important;margin:0 auto!important;padding:7mm!important;overflow:hidden!important;break-inside:avoid-page!important;page-break-inside:avoid!important;page-break-after:avoid!important}
}
</style>
</head>
<body>
<div class="print-help" style="padding:12px;text-align:center;font-family:-apple-system,Arial">
  <button id="iosPrintBtn" style="font-size:18px;padding:12px 18px;border:0;border-radius:12px;background:#d6aa16;font-weight:800">
    ${tr("Print / Save PDF","طباعة / حفظ PDF")}
  </button>
</div>
<div class="print-shell"><div id="printClone" class="${currentPaper.className}">${currentPaper.innerHTML}</div></div>
<script>
document.getElementById("iosPrintBtn").addEventListener("click",function(){ window.print(); });
setTimeout(function(){ try{ window.print(); }catch(e){} },700);
<\/script>
</body></html>`;
}

function openPrintView(){
  const w = window.open("", "_blank");
  if(!w){
    alert(tr("Safari blocked the print page. Open this site in Safari and try again.","Safari منع صفحة الطباعة. افتح الموقع في Safari وحاول مرة أخرى."));
    return false;
  }
  w.document.open();
  w.document.write(getPrintableHTML());
  w.document.close();
  return true;
}

function printPreview(){
  // iOS installed PWAs can ignore window.print() in the app window.
  // A new page opened directly by the user's tap is more reliable.
  openPrintView();
}
function renderPaper(d,type){
  const s=db.settings||{},rtl=lang==="ar",title=type==="invoice"?tr("INVOICE","فاتورة"):tr("QUOTATION","عرض سعر");
  paper.className="paper"+(rtl?" rtl":"");
  paper.innerHTML=`
    <div class="paper-head">
      <div class="paper-company">
        <img class="paper-logo" src="${companyLogo()}" alt="">
        <h2>${esc(s.company||tr("Company Name","اسم الشركة"))}</h2>
        <div class="paper-meta">${esc(s.phone||"")}${s.email?`<br>${esc(s.email)}`:""}${s.address?`<br>${esc(s.address)}`:""}${s.vat&&d.vatEnabled?`<br>${tr("VAT","الرقم الضريبي")}: ${esc(s.vat)}`:""}</div>
      </div>
      <div class="paper-title">${title}${type==="invoice" && (+d.balance===0 || d.paidFull)?`<span class="paid-badge">${tr("PAID","تم الدفع")}</span>`:""}</div>
      <div class="paper-meta">
        <strong>${tr("Invoice #","رقم الفاتورة")}</strong> : ${esc(d.number)}<br>
        <strong>${tr("Date","التاريخ")}</strong> : ${new Date(d.date).toLocaleDateString(rtl?"ar-OM":"en-GB")}<br>
        <strong>${tr("Currency","العملة")}</strong> : ${currency()}
      </div>
    </div>

    <div class="paper-bill">
      <div class="title">${tr("BILL TO","فاتورة إلى")}</div>
      <div class="body"><strong>${esc(d.customer)}</strong>${d.phone?`<br>${esc(d.phone)}`:""}${d.address?`<br>${esc(d.address)}`:""}</div>
    </div>

    <table class="paper-table">
      <thead><tr>
        <th>#</th><th>${tr("Item","البند")}</th><th>${tr("Qty","الكمية")}</th><th>${tr("Rate","سعر الوحدة")}</th><th>${tr("Amount","الإجمالي")}</th>
      </tr></thead>
      <tbody>${d.items.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.price)}</td><td>${money(x.qty*x.price)}</td></tr>`).join("")}</tbody>
    </table>

    <div class="paper-flex-spacer"></div>

    <div class="paper-bottom">
      <div class="paper-notes">
        <h4>${tr("Notes","ملاحظات")}</h4>
        <div>${esc(d.notes||tr("Thank you for your trust and support.","شكراً لثقتكم ودعمكم المستمر."))}</div>
        <div style="height:4mm"></div>
        <h4>${tr("Terms & Conditions","الشروط والأحكام")}</h4>
        <div>${esc(d.terms||tr("Please make the payment by the due date.","يرجى سداد المبلغ قبل تاريخ الاستحقاق."))}</div>
      </div>

      <div class="paper-totals">
        <div><span>${tr("Subtotal","قبل الضريبة")}</span><strong>${money(d.sub)}</strong></div>
        ${d.vatEnabled?`<div><span>${tr("VAT","القيمة المضافة")} ${d.vatRate}%</span><strong>${money(d.vat)}</strong></div>`:""}
        <div class="grand"><span>${tr("Grand Total","الإجمالي")}</span><strong>${money(d.total)}</strong></div>
        ${type==="invoice"?`<div><span>${tr("Paid Amount","المبلغ المدفوع")}</span><strong>${money(d.paid)}</strong></div><div class="balance"><span>${tr("Balance","المتبقي")}</span><strong>${money(d.balance)}</strong></div>`:""}
      </div>
    </div>

    <div class="paper-footer">
      <span>${esc(s.phone||"")} ${s.email?` • ${esc(s.email)}`:""}</span>
      <strong class="footer-thanks">${tr("Thank you for your business!","شكراً لتعاملكم معنا")}</strong>
    </div>`;
}
function renderHome(){let sales=db.invoices.reduce((a,x)=>a+x.total,0),due=db.invoices.reduce((a,x)=>a+x.balance,0),exp=db.expenses.reduce((a,x)=>a+(+x.amount||0),0);salesStat.textContent=money(sales);dueStat.textContent=money(due);expenseStat.textContent=money(exp);netStat.textContent=money(sales-exp);recentList.innerHTML=db.invoices.length?db.invoices.slice(0,3).map((x,i)=>`<div class="item-row"><div><strong>${x.number}</strong><small>${esc(x.customer)}</small></div><strong>${money(x.total)}</strong></div>`).join(""):tr("No invoices yet","لا توجد فواتير بعد")}
function renderInvoices(){invoiceRows.innerHTML=db.invoices.length?db.invoices.map((x,i)=>`<div class="item-row"><div><strong>${x.number}</strong><small>${esc(x.customer)}</small></div><div><strong>${money(x.total)}</strong><br><button class="del" onclick="openSavedInvoice(${i})">${tr("Preview","معاينة")}</button> <button class="del edit-btn" onclick="editSavedInvoice(${i})">${tr("Edit","تعديل")}</button></div></div>`).join(""):tr("No invoices yet","لا توجد فواتير بعد")}
function editSavedInvoice(i){
  const d=db.invoices[i]; editingInvoiceIndex=i;
  items=(d.items||[]).map(x=>({...x}));
  invoiceNo.textContent=d.number;
  customerName.value=d.customer||""; customerPhone.value=d.phone||""; customerAddress.value=d.address||"";
  notes.value=d.notes||""; terms.value=d.terms||""; paid.value=d.paid||0;if(document.getElementById("paidFull")){paidFull.checked=!!d.paidFull || (+d.balance===0 && +d.total>0);paid.readOnly=paidFull.checked;}
  vatToggle.checked=!!d.vatEnabled; vatRate.value=d.vatRate||5;
  renderItems(); updateTotals(); show("invoiceForm");
}
function openSavedInvoice(i){previewDoc=db.invoices[i];previewType="invoice";previewBack="invoiceList";previewDocNo.textContent=previewDoc.number;renderPaper(previewDoc,"invoice");show("preview")}
function renderQuotes(){quoteRows.innerHTML=db.quotes.length?db.quotes.map((x,i)=>`<div class="item-row"><div><strong>${x.number}</strong><small>${esc(x.customer)}</small></div><div><strong>${money(x.total)}</strong><br><button class="del" onclick="openSavedQuote(${i})">${tr("Preview","معاينة")}</button> <button class="del edit-btn" onclick="editSavedQuote(${i})">${tr("Edit","تعديل")}</button></div></div>`).join(""):tr("No quotations yet","لا توجد عروض أسعار بعد")}
function openSavedQuote(i){previewDoc=db.quotes[i];previewType="quote";previewBack="quoteList";previewDocNo.textContent=previewDoc.number;renderPaper(previewDoc,"quote");show("preview")}
function editSavedQuote(i){
  const d=db.quotes[i]; editingQuoteIndex=i;
  qitems=(d.items||[]).map(x=>({...x}));
  quoteNo.textContent=d.number; qCustomer.value=d.customer||""; qValidity.value=d.validity||30;
  if(document.getElementById("qNotes"))qNotes.value=d.notes||"";
  if(document.getElementById("qTerms"))qTerms.value=d.terms||"";
  renderQItems(); show("quoteForm");
}
function addCustomer(){let n=cName.value.trim();if(!n)return;db.customers.push({name:n,phone:cPhone.value.trim(),address:cAddress.value.trim()});saveDB();cName.value=cPhone.value=cAddress.value="";renderCustomers();populate()}
function renderCustomers(){customerRows.innerHTML=db.customers.length?db.customers.map(c=>`<div class="item-row"><strong>${esc(c.name)}</strong><small>${esc(c.phone||"")}</small></div>`).join(""):tr("No customers","لا يوجد عملاء")}
function addProduct(){let n=pName.value.trim(),p=+pPrice.value||0;if(!n)return;db.products.push({name:n,price:p});saveDB();pName.value=pPrice.value="";renderProducts();populate()}
function renderProducts(){productRows.innerHTML=db.products.length?db.products.map(p=>`<div class="item-row"><strong>${esc(p.name)}</strong><strong>${money(p.price)}</strong></div>`).join(""):tr("No products/services","لا توجد منتجات أو خدمات")}
function addExpense(){let t=eTitle.value.trim(),a=+eAmount.value||0;if(!t||a<=0)return;db.expenses.unshift({title:t,amount:a});saveDB();eTitle.value=eAmount.value="";renderExpenses();renderHome()}
function renderExpenses(){expenseRows.innerHTML=db.expenses.length?db.expenses.map(e=>`<div class="item-row"><strong>${esc(e.title)}</strong><strong>${money(e.amount)}</strong></div>`).join(""):tr("No expenses","لا توجد مصروفات")}
function saveSettings(){db.settings={...db.settings,company:sCompany.value.trim(),phone:sPhone.value.trim(),email:sEmail.value.trim(),address:sAddress.value.trim(),vat:sVat.value.trim(),logo:companyLogo()};saveDB();alert(tr("Saved","تم الحفظ"))}
function loadSettings(){let s=db.settings||{};sCompany.value=s.company||"";sPhone.value=s.phone||"";sEmail.value=s.email||"";sAddress.value=s.address||"";sVat.value=s.vat||"";logoPreview.src=s.logo||DEFAULT_LOGO}
function openMore(){moreMenu.classList.remove("hidden")}function closeMore(){moreMenu.classList.add("hidden")}
function renderLists(){if(document.getElementById("invoiceList").classList.contains("active"))renderInvoices()}
setLang(lang);renderHome();populate();updateTotals();


function pdfAsciiBytes(s){ return new TextEncoder().encode(s); }
function concatBytes(parts){
  let len=parts.reduce((n,p)=>n+p.length,0), out=new Uint8Array(len), pos=0;
  for(const p of parts){ out.set(p,pos); pos+=p.length; }
  return out;
}
function dataUrlToBytes(url){
  const b64=url.split(",")[1], bin=atob(b64), out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
function jpegToSinglePagePDF(jpegBytes, imgW, imgH){
  const pageW=595.28, pageH=841.89;
  const objs=[];
  objs[1]=pdfAsciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
  objs[2]=pdfAsciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objs[3]=pdfAsciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  const imgHead=pdfAsciiBytes(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  objs[4]=concatBytes([imgHead,jpegBytes,pdfAsciiBytes("\nendstream")]);
  const content=`q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const cb=pdfAsciiBytes(content);
  objs[5]=concatBytes([pdfAsciiBytes(`<< /Length ${cb.length} >>\nstream\n`),cb,pdfAsciiBytes("endstream")]);

  const header=concatBytes([pdfAsciiBytes("%PDF-1.4\n"),new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A])]);
  let parts=[header], offsets=[0], pos=header.length;
  for(let i=1;i<=5;i++){
    offsets[i]=pos;
    const pre=pdfAsciiBytes(`${i} 0 obj\n`), post=pdfAsciiBytes("\nendobj\n");
    parts.push(pre,objs[i],post);
    pos+=pre.length+objs[i].length+post.length;
  }
  const xrefPos=pos;
  let xref=`xref\n0 6\n0000000000 65535 f \n`;
  for(let i=1;i<=5;i++) xref+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  xref+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  parts.push(pdfAsciiBytes(xref));
  return concatBytes(parts);
}
function loadImageForCanvas(src){
  return new Promise((resolve)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,align){
  const words=String(text||"").split(/\s+/), lines=[]; let line="";
  for(const w of words){
    const test=line?line+" "+w:w;
    if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=w; }
    else line=test;
  }
  if(line) lines.push(line);
  ctx.textAlign=align;
  lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));
  return y+lines.length*lineHeight;
}
async function renderInvoiceCanvas(){
  if(!previewDoc) return null;
  const d=previewDoc, s=db.settings||{}, rtl=lang==="ar";
  const W=1240,H=1754, c=document.createElement("canvas");
  c.width=W; c.height=H;
  const ctx=c.getContext("2d");
  const BLUE="#123f93", BLUE2="#0f5eb7", GOLD="#d6aa16", TEXT="#111827", PALE="#f3f6fc";
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H);
  ctx.direction=rtl?"rtl":"ltr";
  const left=85,right=W-85;

  // Header
  const logo=await loadImageForCanvas(companyLogo());
  const centerX=W/2, logoY=55, logoBoxW=130, logoBoxH=115;
  if(logo){
    const ratio=Math.min(logoBoxW/logo.width,logoBoxH/logo.height);
    const dw=logo.width*ratio,dh=logo.height*ratio;
    ctx.drawImage(logo,centerX-dw/2,logoY+(logoBoxH-dh)/2,dw,dh);
  }

  ctx.fillStyle=BLUE; ctx.font="700 38px -apple-system, Arial";
  ctx.textAlign="center";
  ctx.fillText(s.company||tr("Company Name","اسم الشركة"),centerX,188);

  // Document title at one edge, invoice data at the opposite edge.
  ctx.fillStyle=GOLD; ctx.font="800 58px -apple-system, Arial";
  ctx.textAlign=rtl?"right":"left";
  const titleX=rtl?right:left;
  ctx.fillText(previewType==="invoice"?tr("INVOICE","فاتورة"):tr("QUOTATION","عرض سعر"),titleX,95);

  const metaX=rtl?left:right;
  ctx.textAlign=rtl?"left":"right"; ctx.fillStyle=TEXT; ctx.font="700 24px -apple-system, Arial";
  const date=new Date(d.date).toLocaleDateString(rtl?"ar-OM":"en-GB");
  const meta=[
    tr("Invoice #","رقم الفاتورة")+" : "+d.number,
    tr("Date","التاريخ")+" : "+date,
    tr("Currency","العملة")+" : "+currency()
  ];
  meta.forEach((m,i)=>ctx.fillText(m,metaX,78+i*36));

  ctx.fillStyle=BLUE; ctx.fillRect(left,225,right-left,4);

  // Bill to
  const boxY=265, boxH=190;
  ctx.fillStyle=BLUE; ctx.beginPath(); ctx.roundRect(left,boxY,right-left,58,20); ctx.fill();
  ctx.fillStyle="#fff"; ctx.font="700 29px -apple-system, Arial"; ctx.textAlign=rtl?"right":"left";
  ctx.fillText(tr("BILL TO","فاتورة إلى"),rtl?right-28:left+28,boxY+39);
  ctx.fillStyle=PALE; ctx.fillRect(left,boxY+52,right-left,boxH-52);
  ctx.fillStyle=TEXT; ctx.font="700 28px -apple-system, Arial";
  let by=boxY+105;
  for(const line of [d.customer,d.phone,d.address].filter(Boolean)){ctx.fillText(line,rtl?right-30:left+30,by);by+=35;}

  // Items table
  const tableY=500, tableW=right-left;
  const cols=[70,420,120,220,240];
  if(rtl) cols.reverse();
  ctx.fillStyle=BLUE; ctx.fillRect(left,tableY,tableW,58);
  ctx.fillStyle="#fff"; ctx.font="700 23px -apple-system, Arial";
  const headers=rtl?[tr("Amount","الإجمالي"),tr("Rate","سعر الوحدة"),tr("Qty","الكمية"),tr("Item","البند"),"#"]:
                    ["#",tr("Item","البند"),tr("Qty","الكمية"),tr("Rate","سعر الوحدة"),tr("Amount","الإجمالي")];
  let x=left;
  headers.forEach((h,i)=>{const cw=cols[i];ctx.textAlign="center";ctx.fillText(h,x+cw/2,tableY+38);x+=cw;});
  let rowY=tableY+58;
  ctx.font="23px -apple-system, Arial"; ctx.fillStyle=TEXT;
  d.items.forEach((it,idx)=>{
    const rowH=60; ctx.strokeStyle="#d7dde8"; ctx.beginPath();ctx.moveTo(left,rowY+rowH);ctx.lineTo(right,rowY+rowH);ctx.stroke();
    const vals=rtl?[money(it.qty*it.price),money(it.price),String(it.qty),it.name,String(idx+1)]:
                   [String(idx+1),it.name,String(it.qty),money(it.price),money(it.qty*it.price)];
    let xx=left;
    vals.forEach((v,i)=>{const cw=cols[i];ctx.textAlign="center";drawWrapped(ctx,v,xx+cw/2,rowY+38,cw-20,24,"center");xx+=cw;});
    rowY+=rowH;
  });

  // Bottom block anchored near page bottom
  const bottomY=1220;
  const notesX=rtl?right-20:left, totalsX=rtl?left:right-430;
  ctx.fillStyle=BLUE;ctx.font="700 26px -apple-system, Arial";ctx.textAlign=rtl?"right":"left";
  ctx.fillText(tr("Notes","ملاحظات"),notesX,bottomY);
  ctx.fillStyle=TEXT;ctx.font="22px -apple-system, Arial";
  drawWrapped(ctx,d.notes||tr("Thank you for your trust and support.","شكراً لثقتكم ودعمكم المستمر."),notesX,bottomY+38,rtl?430:470,30,rtl?"right":"left");
  ctx.fillStyle=BLUE;ctx.font="700 26px -apple-system, Arial";
  ctx.fillText(tr("Terms & Conditions","الشروط والأحكام"),notesX,bottomY+135);
  ctx.fillStyle=TEXT;ctx.font="22px -apple-system, Arial";
  drawWrapped(ctx,d.terms||tr("Please make the payment by the due date.","يرجى سداد المبلغ قبل تاريخ الاستحقاق."),notesX,bottomY+173,rtl?430:470,30,rtl?"right":"left");

  const totalW=430,totalRowH=54; let ty=bottomY-10;
  const totalRows=[
    [tr("Subtotal","قبل الضريبة"),money(d.sub)],
    ...(d.vatEnabled?[[tr("VAT","القيمة المضافة")+" "+d.vatRate+"%",money(d.vat)]]:[]),
    [tr("Grand Total","الإجمالي"),money(d.total)],
    ...(previewType==="invoice"?[[tr("Paid Amount","المبلغ المدفوع"),money(d.paid)],[tr("Balance","المتبقي"),money(d.balance)]]:[])
  ];
  totalRows.forEach((r,i)=>{
    const isGrand=r[0]===tr("Grand Total","الإجمالي"), isBalance=r[0]===tr("Balance","المتبقي");
    ctx.fillStyle=isGrand?BLUE:(isBalance?GOLD:"#fff");ctx.fillRect(totalsX,ty,totalW,totalRowH);
    ctx.strokeStyle="#d7dde8";ctx.strokeRect(totalsX,ty,totalW,totalRowH);
    ctx.fillStyle=isGrand?"#fff":"#111";ctx.font=(isGrand||isBalance?"700 ":"")+"23px -apple-system, Arial";
    ctx.textAlign=rtl?"right":"left";ctx.fillText(r[0],rtl?totalsX+totalW-18:totalsX+18,ty+35);
    ctx.textAlign=rtl?"left":"right";ctx.fillText(r[1],rtl?totalsX+18:totalsX+totalW-18,ty+35);
    ty+=totalRowH;
  });

  // Footer
  ctx.fillStyle=GOLD;ctx.fillRect(left,1635,right-left,5);
  ctx.fillStyle=BLUE;ctx.fillRect(left,1640,right-left,75);
  ctx.fillStyle="#fff";ctx.font="22px -apple-system, Arial";
  ctx.textAlign=rtl?"right":"left";ctx.fillText([s.phone,s.email].filter(Boolean).join("   •   "),rtl?right-28:left+28,1687);
  ctx.font="italic 700 30px -apple-system, Arial";ctx.textAlign=rtl?"left":"right";
  ctx.fillText(tr("Thank you for your business!","شكراً لتعاملكم معنا"),rtl?left+28:right-28,1688);
  return c;
}
async function openNativePDF(){
  if(!previewDoc){
    alert(tr("Nothing to export.","لا توجد فاتورة للتصدير."));
    return;
  }
  const pdfWindow = window.open("","_blank");
  if(!pdfWindow){
    alert(tr("Please allow pop-ups or open the site in Safari.","يرجى السماح بالنوافذ المنبثقة أو فتح الموقع في Safari."));
    return;
  }
  pdfWindow.document.write(`<div style="font-family:-apple-system,Arial;padding:30px;text-align:center">${tr("Preparing PDF…","جاري تجهيز PDF…")}</div>`);
  try{
    const file = await makePDFFile();
    const url = URL.createObjectURL(file);
    pdfWindow.location.replace(url);
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }catch(e){
    pdfWindow.close();
    alert(tr("Could not create PDF.","تعذر إنشاء ملف PDF."));
    console.error(e);
  }
}


function quickAddCustomer(){
  const name = prompt(tr("Customer name","اسم العميل"));
  if(!name || !name.trim()) return;
  const phone = prompt(tr("Phone (optional)","الهاتف (اختياري)")) || "";
  const address = prompt(tr("Address (optional)","العنوان (اختياري)")) || "";
  const customer = {name:name.trim(), phone:phone.trim(), address:address.trim()};
  db.customers.push(customer);
  saveDB();
  populate();
  const idx = db.customers.length - 1;
  customerSelect.value = String(idx);
  customerName.value = customer.name;
  customerPhone.value = customer.phone;
  customerAddress.value = customer.address;
}

function quickAddProduct(){
  const name = prompt(tr("Product / service name","اسم المنتج / الخدمة"));
  if(!name || !name.trim()) return;
  const priceText = prompt(tr("Price","السعر")) || "0";
  const product = {name:name.trim(), price:Number(priceText) || 0};
  db.products.push(product);
  saveDB();
  populate();
  const idx = db.products.length - 1;
  productSelect.value = String(idx);
  itemName.value = product.name;
  price.value = product.price;
  qty.value = 1;
}


function togglePaidFull(){
  if(!document.getElementById("paidFull")) return;
  if(paidFull.checked){
    const sub=items.reduce((s,x)=>s+x.qty*x.price,0);
    const rate=vatToggle.checked?(+vatRate.value||0):0;
    const total=sub+sub*rate/100;
    paid.value=total.toFixed(3);
    paid.readOnly=true;
  }else{
    paid.readOnly=false;
  }
  updateTotals();
}


async function makePDFFile(){
  if(!previewDoc) throw new Error("No document");
  const canvas = await renderInvoiceCanvas();
  const jpg = canvas.toDataURL("image/jpeg",0.94);
  const jpgBytes = dataUrlToBytes(jpg);
  const pdfBytes = jpegToSinglePagePDF(jpgBytes,canvas.width,canvas.height);
  const base = (previewDoc.number || (previewType==="invoice" ? "Invoice" : "Quotation"))
    .replace(/[^\w\-]+/g,"_");
  return new File(
    [pdfBytes],
    `${base}.pdf`,
    {type:"application/pdf", lastModified:Date.now()}
  );
}

async function sharePDFFile(){
  if(!previewDoc){
    alert(tr("Nothing to share.","لا يوجد مستند للمشاركة."));
    return;
  }

  try{
    const file = await makePDFFile();

    // Share the actual PDF file. Do NOT include a URL, otherwise iOS may share the web link.
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({
        files:[file],
        title: previewType==="invoice" ? tr("Invoice PDF","فاتورة PDF") : tr("Quotation PDF","عرض سعر PDF")
      });
      return;
    }

    // Fallback: download/open the PDF itself, never the application URL.
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // On some iPhones the download attribute is ignored; open the PDF blob directly.
    setTimeout(()=>{
      const w = window.open(url,"_blank");
      if(!w){
        alert(tr(
          "The PDF was created. If it did not open, use Safari and allow pop-ups.",
          "تم إنشاء ملف PDF. إذا لم يفتح، استخدم Safari واسمح بالنوافذ المنبثقة."
        ));
      }
    },250);

    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }catch(err){
    // AbortError means the user cancelled the native share sheet.
    if(err && err.name==="AbortError") return;
    console.error(err);
    alert(tr("Could not share the PDF file.","تعذر مشاركة ملف PDF."));
  }
}
