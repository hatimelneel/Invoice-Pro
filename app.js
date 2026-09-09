
const KEY="invoicepro_rebuilt_v2";
let db=JSON.parse(localStorage.getItem(KEY)||'{"invoices":[],"quotes":[],"customers":[],"products":[],"expenses":[],"settings":{}}');
if(!Array.isArray(db.customerPayments)) db.customerPayments=[];
if(!Array.isArray(db.invoices)) db.invoices=[];
if(!Array.isArray(db.quotes)) db.quotes=[];
if(!Array.isArray(db.customers)) db.customers=[];
if(!Array.isArray(db.products)) db.products=[];
if(!Array.isArray(db.expenses)) db.expenses=[];
if(!db.settings || typeof db.settings!=="object") db.settings={};

function makeCustomerId(){
  return "CUS-"+Date.now()+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
}
function normalizeDB(){
  if(!Array.isArray(db.customerPayments)) db.customerPayments=[];
  if(!Array.isArray(db.invoices)) db.invoices=[];
  if(!Array.isArray(db.quotes)) db.quotes=[];
  if(!Array.isArray(db.customers)) db.customers=[];
  if(!Array.isArray(db.products)) db.products=[];
  if(!Array.isArray(db.expenses)) db.expenses=[];
  if(!db.settings || typeof db.settings!=="object") db.settings={};

  db.customers.forEach(c=>{ if(!c.id) c.id=makeCustomerId(); });

  db.invoices.forEach(inv=>{
    if(!inv.status) inv.status="draft";
    if(!inv.customerId){
      const ci=db.customers.findIndex(c=>
        ((c.name||"").trim().toLowerCase()===(inv.customer||"").trim().toLowerCase()) ||
        ((c.phone||"") && (c.phone||"").trim()===(inv.phone||"").trim())
      );
      if(ci>=0) inv.customerId=db.customers[ci].id;
    }
  });

  db.quotes.forEach(q=>{
    if(!q.status) q.status="draft";
    if(!q.customerId){
      const ci=db.customers.findIndex(c=>
        ((c.name||"").trim().toLowerCase()===(q.customer||"").trim().toLowerCase()) ||
        ((c.phone||"") && (c.phone||"").trim()===(q.phone||"").trim())
      );
      if(ci>=0) q.customerId=db.customers[ci].id;
    }
  });

  let receiptCounter=1;
  db.customerPayments
    .slice()
    .sort((a,b)=>new Date(a.createdAt||a.date||0)-new Date(b.createdAt||b.date||0))
    .forEach(p=>{
      if(!p.customerId && Number.isInteger(+p.customerIndex) && db.customers[+p.customerIndex]){
        p.customerId=db.customers[+p.customerIndex].id;
      }
      if(!p.method) p.method="cash";
      if(p.reference===undefined) p.reference="";
      if(!p.receiptNo){
        while(db.customerPayments.some(x=>x!==p && x.receiptNo==="RCPT-"+String(receiptCounter).padStart(5,"0"))) receiptCounter++;
        p.receiptNo="RCPT-"+String(receiptCounter++).padStart(5,"0");
      }
    });
}
normalizeDB();
let lang=localStorage.getItem("invoicepro_lang")||"en";
let editingCustomerIndex=null;

const CURRENCY_LIST=[{"code": "AED", "name": "UAE Dirham"}, {"code": "AFN", "name": "Afghan Afghani"}, {"code": "ALL", "name": "Albanian Lek"}, {"code": "AMD", "name": "Armenian Dram"}, {"code": "ANG", "name": "Netherlands Antillean Guilder"}, {"code": "AOA", "name": "Angolan Kwanza"}, {"code": "ARS", "name": "Argentine Peso"}, {"code": "AUD", "name": "Australian Dollar"}, {"code": "AWG", "name": "Aruban Florin"}, {"code": "AZN", "name": "Azerbaijani Manat"}, {"code": "BAM", "name": "Bosnia and Herzegovina Convertible Mark"}, {"code": "BBD", "name": "Barbados Dollar"}, {"code": "BDT", "name": "Bangladeshi Taka"}, {"code": "BGN", "name": "Bulgarian Lev"}, {"code": "BHD", "name": "Bahraini Dinar"}, {"code": "BIF", "name": "Burundian Franc"}, {"code": "BMD", "name": "Bermudian Dollar"}, {"code": "BND", "name": "Brunei Dollar"}, {"code": "BOB", "name": "Boliviano"}, {"code": "BOV", "name": "Bolivian Mvdol"}, {"code": "BRL", "name": "Brazilian Real"}, {"code": "BSD", "name": "Bahamian Dollar"}, {"code": "BTN", "name": "Bhutanese Ngultrum"}, {"code": "BWP", "name": "Botswana Pula"}, {"code": "BYN", "name": "Belarusian Ruble"}, {"code": "BZD", "name": "Belize Dollar"}, {"code": "CAD", "name": "Canadian Dollar"}, {"code": "CDF", "name": "Congolese Franc"}, {"code": "CHE", "name": "WIR Euro"}, {"code": "CHF", "name": "Swiss Franc"}, {"code": "CHW", "name": "WIR Franc"}, {"code": "CLF", "name": "Unidad de Fomento"}, {"code": "CLP", "name": "Chilean Peso"}, {"code": "CNY", "name": "Chinese Yuan Renminbi"}, {"code": "COP", "name": "Colombian Peso"}, {"code": "COU", "name": "Unidad de Valor Real"}, {"code": "CRC", "name": "Costa Rican Colon"}, {"code": "CUP", "name": "Cuban Peso"}, {"code": "CVE", "name": "Cape Verde Escudo"}, {"code": "CZK", "name": "Czech Koruna"}, {"code": "DJF", "name": "Djiboutian Franc"}, {"code": "DKK", "name": "Danish Krone"}, {"code": "DOP", "name": "Dominican Peso"}, {"code": "DZD", "name": "Algerian Dinar"}, {"code": "EGP", "name": "Egyptian Pound"}, {"code": "ERN", "name": "Eritrean Nakfa"}, {"code": "ETB", "name": "Ethiopian Birr"}, {"code": "EUR", "name": "Euro"}, {"code": "FJD", "name": "Fiji Dollar"}, {"code": "FKP", "name": "Falkland Islands Pound"}, {"code": "GBP", "name": "Pound Sterling"}, {"code": "GEL", "name": "Georgian Lari"}, {"code": "GHS", "name": "Ghanaian Cedi"}, {"code": "GIP", "name": "Gibraltar Pound"}, {"code": "GMD", "name": "Gambian Dalasi"}, {"code": "GNF", "name": "Guinean Franc"}, {"code": "GTQ", "name": "Guatemalan Quetzal"}, {"code": "GYD", "name": "Guyanese Dollar"}, {"code": "HKD", "name": "Hong Kong Dollar"}, {"code": "HNL", "name": "Honduran Lempira"}, {"code": "HTG", "name": "Haitian Gourde"}, {"code": "HUF", "name": "Hungarian Forint"}, {"code": "IDR", "name": "Indonesian Rupiah"}, {"code": "ILS", "name": "Israeli New Shekel"}, {"code": "INR", "name": "Indian Rupee"}, {"code": "IQD", "name": "Iraqi Dinar"}, {"code": "IRR", "name": "Iranian Rial"}, {"code": "ISK", "name": "Icelandic Krona"}, {"code": "JMD", "name": "Jamaican Dollar"}, {"code": "JOD", "name": "Jordanian Dinar"}, {"code": "JPY", "name": "Japanese Yen"}, {"code": "KES", "name": "Kenyan Shilling"}, {"code": "KGS", "name": "Kyrgyzstani Som"}, {"code": "KHR", "name": "Cambodian Riel"}, {"code": "KMF", "name": "Comorian Franc"}, {"code": "KPW", "name": "North Korean Won"}, {"code": "KRW", "name": "South Korean Won"}, {"code": "KWD", "name": "Kuwaiti Dinar"}, {"code": "KYD", "name": "Cayman Islands Dollar"}, {"code": "KZT", "name": "Kazakhstani Tenge"}, {"code": "LAK", "name": "Lao Kip"}, {"code": "LBP", "name": "Lebanese Pound"}, {"code": "LKR", "name": "Sri Lankan Rupee"}, {"code": "LRD", "name": "Liberian Dollar"}, {"code": "LSL", "name": "Lesotho Loti"}, {"code": "LYD", "name": "Libyan Dinar"}, {"code": "MAD", "name": "Moroccan Dirham"}, {"code": "MDL", "name": "Moldovan Leu"}, {"code": "MGA", "name": "Malagasy Ariary"}, {"code": "MKD", "name": "Macedonian Denar"}, {"code": "MMK", "name": "Myanmar Kyat"}, {"code": "MNT", "name": "Mongolian Tugrik"}, {"code": "MOP", "name": "Macanese Pataca"}, {"code": "MRU", "name": "Mauritanian Ouguiya"}, {"code": "MUR", "name": "Mauritian Rupee"}, {"code": "MVR", "name": "Maldivian Rufiyaa"}, {"code": "MWK", "name": "Malawian Kwacha"}, {"code": "MXN", "name": "Mexican Peso"}, {"code": "MXV", "name": "Mexican UDI"}, {"code": "MYR", "name": "Malaysian Ringgit"}, {"code": "MZN", "name": "Mozambican Metical"}, {"code": "NAD", "name": "Namibian Dollar"}, {"code": "NGN", "name": "Nigerian Naira"}, {"code": "NIO", "name": "Nicaraguan Cordoba"}, {"code": "NOK", "name": "Norwegian Krone"}, {"code": "NPR", "name": "Nepalese Rupee"}, {"code": "NZD", "name": "New Zealand Dollar"}, {"code": "OMR", "name": "Omani Rial"}, {"code": "PAB", "name": "Panamanian Balboa"}, {"code": "PEN", "name": "Peruvian Sol"}, {"code": "PGK", "name": "Papua New Guinean Kina"}, {"code": "PHP", "name": "Philippine Peso"}, {"code": "PKR", "name": "Pakistani Rupee"}, {"code": "PLN", "name": "Polish Zloty"}, {"code": "PYG", "name": "Paraguayan Guarani"}, {"code": "QAR", "name": "Qatari Riyal"}, {"code": "RON", "name": "Romanian Leu"}, {"code": "RSD", "name": "Serbian Dinar"}, {"code": "RUB", "name": "Russian Ruble"}, {"code": "RWF", "name": "Rwandan Franc"}, {"code": "SAR", "name": "Saudi Riyal"}, {"code": "SBD", "name": "Solomon Islands Dollar"}, {"code": "SCR", "name": "Seychellois Rupee"}, {"code": "SDG", "name": "Sudanese Pound"}, {"code": "SEK", "name": "Swedish Krona"}, {"code": "SGD", "name": "Singapore Dollar"}, {"code": "SHP", "name": "Saint Helena Pound"}, {"code": "SLE", "name": "Sierra Leonean Leone"}, {"code": "SOS", "name": "Somali Shilling"}, {"code": "SRD", "name": "Surinamese Dollar"}, {"code": "SSP", "name": "South Sudanese Pound"}, {"code": "STN", "name": "Sao Tome and Principe Dobra"}, {"code": "SVC", "name": "El Salvador Colon"}, {"code": "SYP", "name": "Syrian Pound"}, {"code": "SZL", "name": "Eswatini Lilangeni"}, {"code": "THB", "name": "Thai Baht"}, {"code": "TJS", "name": "Tajikistani Somoni"}, {"code": "TMT", "name": "Turkmenistani Manat"}, {"code": "TND", "name": "Tunisian Dinar"}, {"code": "TOP", "name": "Tongan Pa'anga"}, {"code": "TRY", "name": "Turkish Lira"}, {"code": "TTD", "name": "Trinidad and Tobago Dollar"}, {"code": "TWD", "name": "New Taiwan Dollar"}, {"code": "TZS", "name": "Tanzanian Shilling"}, {"code": "UAH", "name": "Ukrainian Hryvnia"}, {"code": "UGX", "name": "Ugandan Shilling"}, {"code": "USD", "name": "US Dollar"}, {"code": "USN", "name": "US Dollar Next Day"}, {"code": "UYI", "name": "Uruguay Peso en Unidades Indexadas"}, {"code": "UYU", "name": "Uruguayan Peso"}, {"code": "UYW", "name": "Unidad Previsional"}, {"code": "UZS", "name": "Uzbekistani Som"}, {"code": "VED", "name": "Venezuelan Digital Bolivar"}, {"code": "VES", "name": "Venezuelan Sovereign Bolivar"}, {"code": "VND", "name": "Vietnamese Dong"}, {"code": "VUV", "name": "Vanuatu Vatu"}, {"code": "WST", "name": "Samoan Tala"}, {"code": "XAF", "name": "CFA Franc BEAC"}, {"code": "XAG", "name": "Silver"}, {"code": "XAU", "name": "Gold"}, {"code": "XBA", "name": "Bond Markets Unit European Composite Unit"}, {"code": "XBB", "name": "Bond Markets Unit European Monetary Unit"}, {"code": "XBC", "name": "Bond Markets Unit European Unit of Account 9"}, {"code": "XBD", "name": "Bond Markets Unit European Unit of Account 17"}, {"code": "XCD", "name": "East Caribbean Dollar"}, {"code": "XDR", "name": "SDR Special Drawing Right"}, {"code": "XOF", "name": "CFA Franc BCEAO"}, {"code": "XPD", "name": "Palladium"}, {"code": "XPF", "name": "CFP Franc"}, {"code": "XPT", "name": "Platinum"}, {"code": "XSU", "name": "SUCRE"}, {"code": "XTS", "name": "Codes specifically reserved for testing purposes"}, {"code": "XUA", "name": "ADB Unit of Account"}, {"code": "XXX", "name": "No Currency"}, {"code": "YER", "name": "Yemeni Rial"}, {"code": "ZAR", "name": "South African Rand"}, {"code": "ZMW", "name": "Zambian Kwacha"}, {"code": "ZWL", "name": "Zimbabwe Dollar"}];
function selectedCurrencyCode(){
  return (db.settings&&db.settings.currency)||"OMR";
}
function currency(){
  return selectedCurrencyCode();
}
function renderSelectedCurrency(code){
  const found=CURRENCY_LIST.find(c=>c.code===code) || CURRENCY_LIST.find(c=>c.code==="OMR");
  if(!found) return;
  if(document.getElementById("sCurrency")) sCurrency.value=found.code;
  if(document.getElementById("selectedCurrency")){
    selectedCurrency.innerHTML=`<span class="selected-currency-code">${found.code}</span><span class="selected-currency-name">${esc(found.name)}</span>`;
  }
}

function currencySearchText(c){
  const aliases={
    SDG:"sudan sudanese pound جنيه سوداني السودان",
    OMR:"oman omani rial ريال عماني عمان",
    USD:"united states us dollar دولار امريكي أمريكي",
    AED:"uae emirates dirham درهم اماراتي الإمارات",
    SAR:"saudi riyal ريال سعودي السعودية",
    EGP:"egypt egyptian pound جنيه مصري مصر",
    QAR:"qatar riyal ريال قطري قطر",
    KWD:"kuwait dinar دينار كويتي الكويت",
    BHD:"bahrain dinar دينار بحريني البحرين",
    EUR:"euro يورو",
    GBP:"british pound sterling جنيه استرليني إسترليني"
  };
  return (c.code+" "+c.name+" "+(aliases[c.code]||"")).toLowerCase();
}

function openCurrencyResults(){
  if(!document.getElementById("currencyResults")) return;
  filterCurrencies();
  currencyResults.classList.remove("hidden");
}

function filterCurrencies(){
  if(!document.getElementById("sCurrencySearch") || !document.getElementById("currencyResults")) return;
  const q=sCurrencySearch.value.trim().toLowerCase();
  const commonOrder=["OMR","USD","AED","SAR","SDG","EUR","GBP","QAR","KWD","BHD","EGP"];
  let rows=CURRENCY_LIST.filter(c=>!q || currencySearchText(c).includes(q));
  rows.sort((a,b)=>{
    const ae=q && a.code.toLowerCase()===q ? -1000 : 0;
    const be=q && b.code.toLowerCase()===q ? -1000 : 0;
    if(ae!==be) return ae-be;
    const ia=commonOrder.indexOf(a.code), ib=commonOrder.indexOf(b.code);
    if(ia!==ib){
      if(ia<0) return 1;
      if(ib<0) return -1;
      return ia-ib;
    }
    return a.code.localeCompare(b.code);
  });
  rows=rows.slice(0,18);
  currencyResults.innerHTML=rows.length
    ? rows.map(c=>`<button type="button" class="currency-option" onclick="selectCurrency('${c.code}')"><span class="currency-option-code">${c.code}</span><span class="currency-option-name">${esc(c.name)}</span></button>`).join("")
    : `<div class="currency-empty">${tr("No matching currency","لا توجد عملة مطابقة")}</div>`;
  currencyResults.classList.remove("hidden");
}

function selectCurrency(code){
  const found=CURRENCY_LIST.find(c=>c.code===code);
  if(!found) return;
  sCurrency.value=found.code;
  sCurrencySearch.value=found.code+" — "+found.name;
  renderSelectedCurrency(found.code);
  if(!db.settings) db.settings={};
  db.settings.currency=found.code;
  saveDB();
  renderHome();
  populate();
  currencyResults.classList.add("hidden");
  sCurrencySearch.blur();
}

function clearCurrencySearch(){
  if(!document.getElementById("sCurrencySearch")) return;
  sCurrencySearch.value="";
  sCurrencySearch.focus();
  filterCurrencies();
}

function syncCurrencyFromSearch(){ filterCurrencies(); }

const DEFAULT_LOGO="smart-gate-logo.jpeg";
function companyLogo(){return (db.settings&&db.settings.logo)||DEFAULT_LOGO}
function changeLogo(ev){const f=ev.target.files&&ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(!db.settings)db.settings={};db.settings.logo=r.result;saveDB();logoPreview.src=r.result};r.readAsDataURL(f)}

let items=[],qitems=[],previewBack="home",previewDoc=null,previewType="invoice",editingInvoiceIndex=null,editingQuoteIndex=null,editingItemIndex=null,editingQItemIndex=null,statementCustomerIndex=null,editingPaymentId=null;

function saveDB(){localStorage.setItem(KEY,JSON.stringify(db))}
function currency(){return selectedCurrencyCode()}
function money(v){return Number(v||0).toFixed(3)+" "+currency()}
function nextNo(prefix,arr){return prefix+"-"+String(arr.length+1).padStart(5,"0")}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function tr(en,ar){return lang==="ar"?ar:en}
function setLang(l){lang=l;localStorage.setItem("invoicepro_lang",l);document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.querySelectorAll("[data-en]").forEach(el=>el.textContent=el.dataset[l]);document.querySelectorAll("[data-ph-en]").forEach(el=>el.placeholder=el.dataset["ph"+(l==="ar"?"Ar":"En")]);enBtn.classList.toggle("active",l==="en");arBtn.classList.toggle("active",l==="ar");renderHome();renderLists();populate();if(previewDoc)renderPaper(previewDoc,previewType);if(document.getElementById("cSaveBtn"))setCustomerFormMode(editingCustomerIndex!==null)}
function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  const target=document.getElementById(id);
  if(!target) return;
  target.classList.add("active");

  if(id==="home") renderHome();
  if(id==="invoiceList") renderInvoices();
  if(id==="documents") renderDocuments();
  if(id==="customers") renderCustomers();
  if(id==="customerStatement") renderCustomerStatement();
  if(id==="products") renderProducts();
  if(id==="expenses") renderExpenses();
  if(id==="quoteList") renderQuotes();
  if(id==="settings") loadSettings();
  if(id==="profitReports") prepareProfitReport();
  if(id==="paymentLedger") renderPaymentLedger();

  populate();
}
function populate(){
  customerSelect.innerHTML='<option value="">'+tr("-- Select customer --","-- اختر العميل --")+'</option>'+db.customers.map((c,i)=>`<option value="${i}">${esc(c.name)}</option>`).join("");
  if(document.getElementById("qCustomerSelect")){
    qCustomerSelect.innerHTML='<option value="">'+tr("-- Select customer --","-- اختر العميل --")+'</option>'+db.customers.map((c,i)=>`<option value="${i}">${esc(c.name)}</option>`).join("");
  }
  productSelect.innerHTML='<option value="">'+tr("-- Select product/service --","-- اختر المنتج/الخدمة --")+'</option>'+db.products.map((p,i)=>`<option value="${i}">${esc(p.name)} - ${money(p.price)}</option>`).join("");if(document.getElementById("qProductSelect")){qProductSelect.innerHTML='<option value="">'+tr("-- Select product/service --","-- اختر المنتج/الخدمة --")+'</option>'+db.products.map((p,i)=>`<option value="${i}">${esc(p.name)} - ${money(p.price)}</option>`).join("");}

  if(document.getElementById("eDocumentSelect")) populateExpenseDocumentSelector();
}


function selectedCustomerId(selectEl,name,phone){
  if(selectEl && selectEl.value!=="" && db.customers[+selectEl.value]){
    return db.customers[+selectEl.value].id||"";
  }
  const n=(name||"").trim().toLowerCase();
  const p=(phone||"").trim();
  const c=db.customers.find(x=>
    (n && (x.name||"").trim().toLowerCase()===n) ||
    (p && (x.phone||"").trim()===p)
  );
  return c?c.id||"":"";
}

const STATUS_TEXT={
  draft:["Draft","مسودة"],
  sent:["Sent","مرسلة"],
  approved:["Approved","معتمدة"],
  paid:["Paid","مدفوعة"],
  partial:["Partially Paid","مدفوعة جزئياً"],
  overdue:["Overdue","متأخرة"],
  cancelled:["Cancelled","ملغاة"],
  rejected:["Rejected","مرفوضة"],
  expired:["Expired","منتهية"],
  converted:["Converted","محولة"]
};

function statusLabel(status){
  const x=STATUS_TEXT[status]||[status,status];
  return lang==="ar"?x[1]:x[0];
}

function invoiceDisplayStatus(inv){
  if((inv.status||"")==="cancelled") return "cancelled";
  if((+inv.total||0)>0 && (+inv.balance||0)<=0.0005) return "paid";
  if((+inv.paid||0)>0 && (+inv.balance||0)>0.0005) return "partial";
  return inv.status||"draft";
}

function quoteDisplayStatus(q){
  if(q.convertedInvoiceNumber) return "converted";
  if(q.status==="cancelled") return "cancelled";
  if(q.status==="rejected") return "rejected";
  if(q.status==="approved") return "approved";

  const validity=+q.validity||0;
  if(validity>0 && q.date){
    const d=new Date(q.date);
    if(!Number.isNaN(d.getTime())){
      d.setDate(d.getDate()+validity);
      const expiry=dateValueFromStored(d.toISOString());
      if(expiry<todayLocalISODate()) return "expired";
    }
  }
  return q.status||"draft";
}

function statusBadge(status){
  return `<span class="status-badge status-${esc(status)}">${esc(statusLabel(status))}</span>`;
}

function paymentMethodLabel(method){
  const map={
    cash:["Cash","نقداً"],
    bank:["Bank Transfer","تحويل بنكي"],
    cheque:["Cheque","شيك"],
    card:["Card","بطاقة"],
    other:["Other","أخرى"]
  };
  const x=map[method]||map.other;
  return lang==="ar"?x[1]:x[0];
}

function nextReceiptNo(){
  let max=0;
  (db.customerPayments||[]).forEach(p=>{
    const m=String(p.receiptNo||"").match(/RCPT-(\d+)/);
    if(m) max=Math.max(max,+m[1]||0);
  });
  return "RCPT-"+String(max+1).padStart(5,"0");
}

function todayLocalISODate(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function dateValueFromStored(value){
  if(!value) return todayLocalISODate();

  // Preserve YYYY-MM-DD values exactly.
  const s=String(value);
  const direct=s.match(/^(\d{4}-\d{2}-\d{2})/);
  if(direct) return direct[1];

  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return todayLocalISODate();

  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function invoiceDateStoredValue(){
  const v=(document.getElementById("invoiceDate")&&invoiceDate.value)
    ? invoiceDate.value
    : todayLocalISODate();

  // Noon avoids timezone date shifts when rendered later.
  return v+"T12:00:00";
}

function startInvoice(){
  editingItemIndex=null;
  editingInvoiceIndex=null;
  items=[];
  invoiceNo.textContent=nextNo("INV",db.invoices);
  if(document.getElementById("invoiceDate")) invoiceDate.value=todayLocalISODate();
  if(document.getElementById("invoiceStatus")) invoiceStatus.value="draft";
  customerName.value=customerPhone.value=customerAddress.value=itemName.value=price.value=notes.value=terms.value="";
  if(document.getElementById("customerSelect")) customerSelect.value="";
  qty.value=1;
  paid.value=0;
  if(document.getElementById("paidFull")){paidFull.checked=false;paid.readOnly=false;}
  vatToggle.checked=false;
  vatRate.value=5;
  discountType.value="percent";
  discountValue.value=0;
  renderItems();
  updateTotals();
  show("invoiceForm");
}
function startQuote(){
  editingQItemIndex=null;
  editingQuoteIndex=null;
  qitems=[];
  quoteNo.textContent=nextNo("QT",db.quotes);
  qCustomer.value=qItem.value=qPrice.value="";
  if(document.getElementById("qCustomerPhone")) qCustomerPhone.value="";
  if(document.getElementById("qCustomerAddress")) qCustomerAddress.value="";
  if(document.getElementById("qCustomerSelect")) qCustomerSelect.value="";
  qQty.value=1;
  qValidity.value=30;
  if(document.getElementById("qStatus")) qStatus.value="draft";
  if(document.getElementById("qNotes")) qNotes.value="";
  if(document.getElementById("qTerms")) qTerms.value="";
  renderQItems();
  show("quoteForm");
}
function selectCustomer(){const i=customerSelect.value;if(i==="")return;const c=db.customers[+i];customerName.value=c.name;customerPhone.value=c.phone||"";customerAddress.value=c.address||""}
function selectProduct(){const i=productSelect.value;if(i==="")return;const p=db.products[+i];itemName.value=p.name;price.value=p.price;qty.value=1}
function addItem(){
  const n=itemName.value.trim();
  const priceRaw=String(price.value||"").trim();
  const q=+qty.value||1;

  if(!n) return;

  const isDescription=(priceRaw==="");

  if(editingItemIndex!==null){
    if(isDescription){
      items[editingItemIndex]={name:n,isDescription:true};
    }else{
      items[editingItemIndex]={name:n,qty:q,price:+priceRaw||0,isDescription:false};
    }
    editingItemIndex=null;
  }else{
    if(isDescription){
      items.push({name:n,isDescription:true});
    }else{
      items.push({name:n,qty:q,price:+priceRaw||0,isDescription:false});
    }
  }

  itemName.value="";
  qty.value=1;
  price.value="";
  renderItems();
  updateTotals();
}
function renderItems(){
  let seq=0;
  itemList.innerHTML=items.map((x,i)=>{
    if(x.isDescription){
      return `<div class="item-row description-editor-row">
        <div>
          <span class="description-label">${tr("Description","شرح")}</span>
          <strong>${esc(x.name)}</strong>
        </div>
        <div class="item-actions">
          <button class="edit-item-btn" onclick="editInvoiceItem(${i})">${tr("Edit","تعديل")}</button>
          <button class="del" onclick="deleteInvoiceItem(${i})">${tr("Delete","حذف")}</button>
        </div>
      </div>`;
    }
    seq++;
    return `<div class="item-row">
      <div>
        <strong>${seq}. ${esc(x.name)}</strong>
        <small>${x.qty} × ${money(x.price)}</small>
      </div>
      <div class="item-actions">
        <strong>${money(x.qty*x.price)}</strong><br>
        <button class="edit-item-btn" onclick="editInvoiceItem(${i})">${tr("Edit","تعديل")}</button>
        <button class="del" onclick="deleteInvoiceItem(${i})">${tr("Delete","حذف")}</button>
      </div>
    </div>`;
  }).join("");
}
function totals(){let s=items.reduce((a,x)=>a+(x.isDescription?0:(+x.qty||0)*(+x.price||0)),0);const dtype=discountType.value||"percent",raw=Math.max(+discountValue.value||0,0);let disc=dtype==="percent"?s*Math.min(raw,100)/100:Math.min(raw,s),after=Math.max(s-disc,0),v=vatToggle.checked?after*(+vatRate.value||0)/100:0,t=after+v,p=+paid.value||0;return{sub:s,discount:disc,discountType:dtype,discountValue:raw,afterDiscount:after,vat:v,total:t,paid:p,balance:Math.max(t-p,0),vatEnabled:vatToggle.checked,vatRate:+vatRate.value||0}}
function updateTotals(){const t=totals();subT.textContent=money(t.sub);discountT.textContent="-"+money(t.discount);discountLine.classList.toggle("hidden",t.discount<=0);vatT.textContent=money(t.vat);grandT.textContent=money(t.total);vatLine.classList.toggle("hidden",!t.vatEnabled);vatRateBox.classList.toggle("hidden",!t.vatEnabled)}
function currentInvoiceObj(){
  const t=totals();
  const old=(editingInvoiceIndex!==null && db.invoices[editingInvoiceIndex])?db.invoices[editingInvoiceIndex]:null;
  return{
    number:invoiceNo.textContent,
    customer:customerName.value.trim(),
    customerId:selectedCustomerId(document.getElementById("customerSelect"),customerName.value,customerPhone.value),
    phone:customerPhone.value.trim(),
    address:customerAddress.value.trim(),
    date:invoiceDateStoredValue(),
    status:(document.getElementById("invoiceStatus")?invoiceStatus.value:"draft"),
    items:[...items],
    notes:notes.value.trim(),
    terms:terms.value.trim(),
    sourceQuoteNumber:old&&old.sourceQuoteNumber?old.sourceQuoteNumber:"",
    ...t
  };
}
function previewCurrentInvoice(){const o=currentInvoiceObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}previewDoc=o;previewType="invoice";previewBack="invoiceForm";previewDocNo.textContent=o.number;renderPaper(o,"invoice");show("preview")}
function saveInvoice(){const o=currentInvoiceObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}if(editingInvoiceIndex!==null){db.invoices[editingInvoiceIndex]=o;editingInvoiceIndex=null;}else{db.invoices.unshift(o);}saveDB();previewDoc=o;previewType="invoice";previewBack="documents";renderPaper(o,"invoice");show("preview")}
function addQItem(){
  const n=qItem.value.trim();
  const priceRaw=String(qPrice.value||"").trim();
  const q=+qQty.value||1;

  if(!n) return;

  const isDescription=(priceRaw==="");

  if(editingQItemIndex!==null){
    if(isDescription){
      qitems[editingQItemIndex]={name:n,isDescription:true};
    }else{
      qitems[editingQItemIndex]={name:n,qty:q,price:+priceRaw||0,isDescription:false};
    }
    editingQItemIndex=null;
  }else{
    if(isDescription){
      qitems.push({name:n,isDescription:true});
    }else{
      qitems.push({name:n,qty:q,price:+priceRaw||0,isDescription:false});
    }
  }

  qItem.value="";
  qQty.value=1;
  qPrice.value="";
  if(document.getElementById("qProductSelect"))qProductSelect.value="";
  renderQItems();
}
function renderQItems(){
  let seq=0;
  qItems.innerHTML=qitems.map((x,i)=>{
    if(x.isDescription){
      return `<div class="item-row description-editor-row">
        <div>
          <span class="description-label">${tr("Description","شرح")}</span>
          <strong>${esc(x.name)}</strong>
        </div>
        <div class="item-actions">
          <button class="edit-item-btn" onclick="editQuoteItem(${i})">${tr("Edit","تعديل")}</button>
          <button class="del" onclick="deleteQuoteItem(${i})">${tr("Delete","حذف")}</button>
        </div>
      </div>`;
    }
    seq++;
    return `<div class="item-row">
      <div>
        <strong>${seq}. ${esc(x.name)}</strong>
        <small>${x.qty} × ${money(x.price)}</small>
      </div>
      <div class="item-actions">
        <strong>${money(x.qty*x.price)}</strong><br>
        <button class="edit-item-btn" onclick="editQuoteItem(${i})">${tr("Edit","تعديل")}</button>
        <button class="del" onclick="deleteQuoteItem(${i})">${tr("Delete","حذف")}</button>
      </div>
    </div>`;
  }).join("");
}
function currentQuoteObj(){
  let s=qitems.reduce((a,x)=>a+(x.isDescription?0:(+x.qty||0)*(+x.price||0)),0);
  const dtype=qDiscountType.value||"percent";
  const raw=Math.max(+qDiscountValue.value||0,0);
  const disc=dtype==="percent"?s*Math.min(raw,100)/100:Math.min(raw,s);
  const total=Math.max(s-disc,0);

  const old=(editingQuoteIndex!==null && db.quotes[editingQuoteIndex])?db.quotes[editingQuoteIndex]:null;

  return{
    number:quoteNo.textContent,
    customer:qCustomer.value.trim(),
    customerId:selectedCustomerId(document.getElementById("qCustomerSelect"),qCustomer.value,document.getElementById("qCustomerPhone")?qCustomerPhone.value:""),
    phone:(document.getElementById("qCustomerPhone")?qCustomerPhone.value.trim():""),
    address:(document.getElementById("qCustomerAddress")?qCustomerAddress.value.trim():""),
    date:old&&old.date?old.date:new Date().toISOString(),
    validity:+qValidity.value||30,
    status:(document.getElementById("qStatus")?qStatus.value:"draft"),
    convertedInvoiceNumber:old&&old.convertedInvoiceNumber?old.convertedInvoiceNumber:"",
    convertedInvoiceDate:old&&old.convertedInvoiceDate?old.convertedInvoiceDate:"",
    items:[...qitems],
    sub:s,
    discount:disc,
    discountType:dtype,
    discountValue:raw,
    afterDiscount:total,
    vat:0,
    total:total,
    paid:0,
    balance:total,
    vatEnabled:false,
    vatRate:0,
    notes:(document.getElementById("qNotes")?qNotes.value.trim():""),
    terms:(document.getElementById("qTerms")?qTerms.value.trim():"")
  };
}
function previewCurrentQuote(){const o=currentQuoteObj();if(!o.customer||!o.items.length){alert(tr("Enter customer and at least one item.","أدخل العميل وبنداً واحداً على الأقل."));return}previewDoc=o;previewType="quote";previewBack="quoteForm";previewDocNo.textContent=o.number;renderPaper(o,"quote");show("preview")}
function saveQuote(){const o=currentQuoteObj();if(!o.customer||!o.items.length)return;if(editingQuoteIndex!==null){db.quotes[editingQuoteIndex]=o;editingQuoteIndex=null;}else{db.quotes.unshift(o);}saveDB();previewDoc=o;previewType="quote";previewBack="documents";renderPaper(o,"quote");show("preview")}
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
        <strong>${type==="invoice"?tr("Invoice #","رقم الفاتورة"):tr("Quotation #","رقم عرض السعر")}</strong> : ${esc(d.number)}<br>
        ${type==="invoice"&&d.sourceQuoteNumber?`<strong>${tr("Quotation Ref","مرجع عرض السعر")}</strong> : ${esc(d.sourceQuoteNumber)}<br>`:""}
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
      <tbody>${(()=>{let seq=0;return d.items.map((x)=>{
        if(x.isDescription){
          return `<tr class="paper-description-row"><td></td><td colspan="4">${esc(x.name)}</td></tr>`;
        }
        seq++;
        return `<tr><td>${seq}</td><td>${esc(x.name)}</td><td>${x.qty}</td><td>${money(x.price)}</td><td>${money(x.qty*x.price)}</td></tr>`;
      }).join("")})()}</tbody>
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
        <div><span>${tr("Subtotal","المجموع الفرعي")}</span><strong>${money(d.sub)}</strong></div>
        ${(+d.discount||0)>0?`<div><span>${tr("Discount","الخصم")}${d.discountType==="percent"?" ("+(+d.discountValue||0)+"%)":""}</span><strong>-${money(d.discount)}</strong></div>`:""}
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
function renderInvoices(){
  invoiceRows.innerHTML=db.invoices.length
    ? db.invoices.map((x,i)=>`
      <div class="item-row">
        <div>
          <strong>${x.number}</strong>
          <small>${esc(x.customer)}</small>
          ${statusBadge(invoiceDisplayStatus(x))}
        </div>
        <div>
          <strong>${money(x.total)}</strong><br>
          <button class="del" onclick="openSavedInvoice(${i})">${tr("Preview","معاينة")}</button>
          <button class="del edit-btn" onclick="editSavedInvoice(${i})">${tr("Edit","تعديل")}</button>
        </div>
      </div>`).join("")
    : tr("No invoices yet","لا توجد فواتير بعد");
}
function editSavedInvoice(i){
  const d=db.invoices[i];
  editingInvoiceIndex=i;
  items=(d.items||[]).map(x=>({...x}));
  invoiceNo.textContent=d.number;
  if(document.getElementById("invoiceDate")) invoiceDate.value=dateValueFromStored(d.date);
  if(document.getElementById("invoiceStatus")) invoiceStatus.value=["draft","sent","approved","cancelled"].includes(d.status)?d.status:"draft";
  customerName.value=d.customer||"";
  customerPhone.value=d.phone||"";
  customerAddress.value=d.address||"";
  if(document.getElementById("customerSelect")){
    let ci=d.customerId?db.customers.findIndex(c=>c.id===d.customerId):-1;
    if(ci<0) ci=db.customers.findIndex(c=>c.name===d.customer);
    customerSelect.value=ci>=0?String(ci):"";
  }
  notes.value=d.notes||"";
  terms.value=d.terms||"";
  paid.value=d.paid||0;
  if(document.getElementById("paidFull")){
    paidFull.checked=!!d.paidFull || (+d.balance===0 && +d.total>0);
    paid.readOnly=paidFull.checked;
  }
  vatToggle.checked=!!d.vatEnabled;
  vatRate.value=d.vatRate||5;
  discountType.value=d.discountType||"percent";
  discountValue.value=d.discountValue||0;
  renderItems();
  updateTotals();
  show("invoiceForm");
}
function openSavedInvoice(i){previewDoc=db.invoices[i];previewType="invoice";previewBack="documents";previewDocNo.textContent=previewDoc.number;renderPaper(previewDoc,"invoice");show("preview")}
function renderQuotes(){
  quoteRows.innerHTML=db.quotes.length
    ? db.quotes.map((x,i)=>`
      <div class="item-row">
        <div>
          <strong>${x.number}</strong>
          <small>${esc(x.customer)}</small>
          ${statusBadge(quoteDisplayStatus(x))}
          ${x.convertedInvoiceNumber?`<small class="converted-ref">${tr("Converted to","تم التحويل إلى")} ${x.convertedInvoiceNumber}</small>`:""}
        </div>
        <div>
          <strong>${money(x.total)}</strong><br>
          <button class="del" onclick="openSavedQuote(${i})">${tr("Preview","معاينة")}</button>
          <button class="del edit-btn" onclick="editSavedQuote(${i})">${tr("Edit","تعديل")}</button>
          ${x.convertedInvoiceNumber
            ?`<button class="convert-btn converted" onclick="openConvertedInvoice('${x.convertedInvoiceNumber}')">${tr("Open Invoice","فتح الفاتورة")}</button>`
            :`<button class="convert-btn" onclick="convertQuoteToInvoice(${i})">${tr("Convert to Invoice","تحويل إلى فاتورة")}</button>`}
        </div>
      </div>`).join("")
    : tr("No quotations yet","لا توجد عروض أسعار بعد");
}
function openSavedQuote(i){previewDoc=db.quotes[i];previewType="quote";previewBack="documents";previewDocNo.textContent=previewDoc.number;renderPaper(previewDoc,"quote");show("preview")}
function editSavedQuote(i){
  const d=db.quotes[i];
  editingQuoteIndex=i;
  qitems=(d.items||[]).map(x=>({...x}));
  quoteNo.textContent=d.number;
  qCustomer.value=d.customer||"";
  qValidity.value=d.validity||30;
  if(document.getElementById("qStatus")) qStatus.value=["draft","sent","approved","rejected","cancelled"].includes(d.status)?d.status:"draft";
  if(document.getElementById("qCustomerPhone")) qCustomerPhone.value=d.phone||"";
  if(document.getElementById("qCustomerAddress")) qCustomerAddress.value=d.address||"";
  if(document.getElementById("qCustomerSelect")){
    let ci=d.customerId?db.customers.findIndex(c=>c.id===d.customerId):-1;
    if(ci<0) ci=db.customers.findIndex(c=>c.name===d.customer);
    qCustomerSelect.value=ci>=0?String(ci):"";
  }
  if(document.getElementById("qNotes")) qNotes.value=d.notes||"";
  if(document.getElementById("qTerms")) qTerms.value=d.terms||"";
  qDiscountType.value=d.discountType||"percent";
  qDiscountValue.value=d.discountValue||0;
  renderQItems();
  show("quoteForm");
}
function addCustomer(){
  const name=cName.value.trim();
  if(!name) return;

  const phone=cPhone.value.trim();
  const address=cAddress.value.trim();

  if(editingCustomerIndex!==null && db.customers[editingCustomerIndex]){
    const old={...db.customers[editingCustomerIndex]};
    const updated={...old,name,phone,address};
    db.customers[editingCustomerIndex]=updated;

    // Existing invoices/quotations currently store customer data as a snapshot.
    // Keep them linked to the edited customer by updating records that matched
    // the customer's previous name or phone.
    const matchesOldCustomer=(doc)=>{
      const oldName=(old.name||"").trim().toLowerCase();
      const docName=(doc.customer||"").trim().toLowerCase();
      const oldPhone=(old.phone||"").trim();
      const docPhone=(doc.phone||"").trim();
      return (oldName && docName===oldName) || (oldPhone && docPhone===oldPhone);
    };

    db.invoices.forEach(doc=>{
      if(matchesOldCustomer(doc)){
        doc.customer=name;
        doc.phone=phone;
        doc.address=address;
      }
    });

    db.quotes.forEach(doc=>{
      if(matchesOldCustomer(doc)){
        doc.customer=name;
        doc.phone=phone;
        doc.address=address;
      }
    });

    if(Array.isArray(db.customerPayments)){
      db.customerPayments.forEach(p=>{
        if((old.id && p.customerId===old.id) || +p.customerIndex===+editingCustomerIndex){
          p.customerId=old.id||p.customerId||"";
          p.customerName=name;
          p.customerPhone=phone;
        }
      });
    }

    editingCustomerIndex=null;
  }else{
    db.customers.push({id:makeCustomerId(),name,phone,address});
  }

  saveDB();
  cName.value="";
  cPhone.value="";
  cAddress.value="";
  setCustomerFormMode(false);
  renderCustomers();
  populate();

  if(statementCustomerIndex!==null){
    renderCustomerStatement();
  }
}
function renderCustomers(){
  customerRows.innerHTML=db.customers.length
    ? db.customers.map((c,i)=>`
      <div class="customer-list-row">
        <div class="customer-list-main">
          <strong>${esc(c.name)}</strong>
          ${c.phone?`<small>${esc(c.phone)}</small>`:""}
          ${c.address?`<small>${esc(c.address)}</small>`:""}
        </div>
        <div class="customer-row-actions">
          <button class="statement-btn" onclick="openCustomerStatement(${i})">${tr("Statement","كشف حساب")}</button>
          <button class="customer-edit-btn" onclick="editCustomer(${i})">${tr("Edit","تعديل")}</button>
        </div>
      </div>`).join("")
    : tr("No customers","لا يوجد عملاء");
}

function setCustomerFormMode(isEditing){
  if(document.getElementById("cSaveBtn")){
    cSaveBtn.textContent=isEditing?tr("Update Customer","تحديث العميل"):tr("Save Customer","حفظ العميل");
  }
  if(document.getElementById("cCancelBtn")){
    cCancelBtn.classList.toggle("hidden",!isEditing);
  }
}

function editCustomer(i){
  const c=db.customers[i];
  if(!c) return;

  editingCustomerIndex=i;
  cName.value=c.name||"";
  cPhone.value=c.phone||"";
  cAddress.value=c.address||"";
  setCustomerFormMode(true);

  // Bring the edit form into view on iPhone.
  cName.scrollIntoView({behavior:"smooth",block:"center"});
  setTimeout(()=>cName.focus(),250);
}

function cancelCustomerEdit(){
  editingCustomerIndex=null;
  cName.value="";
  cPhone.value="";
  cAddress.value="";
  setCustomerFormMode(false);
}

function addProduct(){let n=pName.value.trim(),p=+pPrice.value||0;if(!n)return;db.products.push({name:n,price:p});saveDB();pName.value=pPrice.value="";renderProducts();populate()}
function renderProducts(){productRows.innerHTML=db.products.length?db.products.map(p=>`<div class="item-row"><strong>${esc(p.name)}</strong><strong>${money(p.price)}</strong></div>`).join(""):tr("No products/services","لا توجد منتجات أو خدمات")}

function populateExpenseDocumentSelector(){
  if(!document.getElementById("eDocumentSelect")) return;

  const current=eDocumentSelect.value;
  const invoiceOptions=db.invoices.map(inv=>
    `<option value="invoice|${esc(inv.number)}">${tr("Invoice","فاتورة")} ${esc(inv.number)} — ${esc(inv.customer||"")} — ${money(inv.total)}</option>`
  );

  const quoteOptions=db.quotes.map(q=>
    `<option value="quote|${esc(q.number)}">${tr("Quotation","عرض سعر")} ${esc(q.number)} — ${esc(q.customer||"")} — ${money(q.total)}</option>`
  );

  eDocumentSelect.innerHTML=
    `<option value="">${tr("General expense — no document","مصروف عام — بدون مستند")}</option>`+
    (invoiceOptions.length?`<optgroup label="${tr("Invoices","الفواتير")}">${invoiceOptions.join("")}</optgroup>`:"")+
    (quoteOptions.length?`<optgroup label="${tr("Quotations","عروض الأسعار")}">${quoteOptions.join("")}</optgroup>`:"");

  if([...eDocumentSelect.options].some(o=>o.value===current)){
    eDocumentSelect.value=current;
  }
}

function parseExpenseDocumentSelection(){
  if(!document.getElementById("eDocumentSelect") || !eDocumentSelect.value){
    return {documentType:"",documentNumber:""};
  }
  const parts=eDocumentSelect.value.split("|");
  return {
    documentType:parts[0]||"",
    documentNumber:parts.slice(1).join("|")||""
  };
}

function linkedExpenseDocumentLabel(expense){
  if(!expense.documentNumber) return "";
  const typeLabel=expense.documentType==="invoice"
    ? tr("Invoice","فاتورة")
    : tr("Quotation","عرض سعر");
  return typeLabel+" "+expense.documentNumber;
}

function addExpense(){
  const t=eTitle.value.trim();
  const a=+eAmount.value||0;
  if(!t||a<=0) return;

  const link=parseExpenseDocumentSelection();

  db.expenses.unshift({
    title:t,
    amount:a,
    date:new Date().toISOString(),
    documentType:link.documentType,
    documentNumber:link.documentNumber
  });

  saveDB();

  eTitle.value="";
  eAmount.value="";
  if(document.getElementById("eDocumentSelect")) eDocumentSelect.value="";

  renderExpenses();
  renderHome();
}
function renderExpenses(){
  if(document.getElementById("eDocumentSelect")){
    populateExpenseDocumentSelector();
  }

  expenseRows.innerHTML=db.expenses.length
    ? db.expenses.map(e=>`
      <div class="expense-row">
        <div class="expense-main">
          <strong>${esc(e.title)}</strong>
          ${e.documentNumber?`<small class="expense-doc-ref">${esc(linkedExpenseDocumentLabel(e))}</small>`:""}
        </div>
        <strong>${money(e.amount)}</strong>
      </div>`).join("")
    : tr("No expenses","لا توجد مصروفات");
}
function saveSettings(){db.settings={...db.settings,company:sCompany.value.trim(),phone:sPhone.value.trim(),email:sEmail.value.trim(),address:sAddress.value.trim(),vat:sVat.value.trim(),logo:companyLogo(),currency:(sCurrency.value||"OMR")};saveDB();alert(tr("Saved","تم الحفظ"))}
function loadSettings(){let s=db.settings||{};sCompany.value=s.company||"";sPhone.value=s.phone||"";sEmail.value=s.email||"";sAddress.value=s.address||"";sVat.value=s.vat||"";logoPreview.src=s.logo||DEFAULT_LOGO;
  const code=s.currency||"OMR";
  if(document.getElementById("sCurrency")){
    const found=CURRENCY_LIST.find(c=>c.code===code)||CURRENCY_LIST.find(c=>c.code==="OMR");
    sCurrency.value=found.code;
    sCurrencySearch.value=found.code+" — "+found.name;
    renderSelectedCurrency(found.code);
    if(document.getElementById("currencyResults")) currencyResults.classList.add("hidden");
  }

  if(document.getElementById("backupDestination")) loadBackupDestination();
  if(typeof refreshDailyBackupUI==="function") refreshDailyBackupUI();
}
function openMore(){moreMenu.classList.remove("hidden")}function closeMore(){moreMenu.classList.add("hidden")}
function renderLists(){
  if(document.getElementById("invoiceList").classList.contains("active")) renderInvoices();
  if(document.getElementById("documents").classList.contains("active")) renderDocuments();
  if(document.getElementById("customers").classList.contains("active")) renderCustomers();
  if(document.getElementById("customerStatement").classList.contains("active")) renderCustomerStatement();
  if(document.getElementById("expenses").classList.contains("active")) renderExpenses();
  if(document.getElementById("profitReports") && document.getElementById("profitReports").classList.contains("active")) renderProfitReport();
  if(document.getElementById("paymentLedger") && document.getElementById("paymentLedger").classList.contains("active")) renderPaymentLedger();
}
setLang(lang);renderHome();populate();updateTotals();initAutoDailyBackup();


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
    if(!src){ resolve(null); return; }

    const img=new Image();
    let finished=false;

    const done=(value)=>{
      if(finished) return;
      finished=true;
      clearTimeout(timer);
      resolve(value);
    };

    img.onload=()=>done(img);
    img.onerror=()=>done(null);

    // iOS occasionally leaves image loading pending. Never let PDF wait forever.
    const timer=setTimeout(()=>done(null),1800);

    try{
      img.src=src;
      if(img.complete && img.naturalWidth>0){
        done(img);
      }
    }catch(e){
      done(null);
    }
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
    (previewType==="invoice"?tr("Invoice #","رقم الفاتورة"):tr("Quotation #","رقم عرض السعر"))+" : "+d.number,
    ...(previewType==="invoice"&&d.sourceQuoteNumber?[tr("Quotation Ref","مرجع عرض السعر")+" : "+d.sourceQuoteNumber]:[]),
    tr("Date","التاريخ")+" : "+date,
    tr("Currency","العملة")+" : "+currency()
  ];
  meta.forEach((m,i)=>ctx.fillText(m,metaX,72+i*32));

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
  let itemSeq=0;
  d.items.forEach((it)=>{
    const rowH=it.isDescription?48:60;
    ctx.strokeStyle="#d7dde8";
    ctx.beginPath();ctx.moveTo(left,rowY+rowH);ctx.lineTo(right,rowY+rowH);ctx.stroke();

    if(it.isDescription){
      ctx.fillStyle="#4b5563";
      ctx.font="italic 21px -apple-system, Arial";
      ctx.textAlign=rtl?"right":"left";
      drawWrapped(ctx,it.name,rtl?right-20:left+20,rowY+31,tableW-40,24,rtl?"right":"left");
      ctx.font="23px -apple-system, Arial";
      ctx.fillStyle=TEXT;
    }else{
      itemSeq++;
      const vals=rtl?[money(it.qty*it.price),money(it.price),String(it.qty),it.name,String(itemSeq)]:
                     [String(itemSeq),it.name,String(it.qty),money(it.price),money(it.qty*it.price)];
      let xx=left;
      vals.forEach((v,i)=>{const cw=cols[i];ctx.textAlign="center";drawWrapped(ctx,v,xx+cw/2,rowY+38,cw-20,24,"center");xx+=cw;});
    }
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
    [tr("Subtotal","المجموع الفرعي"),money(d.sub)],
    ...((+d.discount||0)>0?[[tr("Discount","الخصم")+(d.discountType==="percent"?" ("+(+d.discountValue||0)+"%)":""),"-"+money(d.discount)]]:[]),
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
    const sub=items.reduce((s,x)=>s+(x.isDescription?0:(+x.qty||0)*(+x.price||0)),0);
    const dtype=discountType.value||"percent",raw=Math.max(+discountValue.value||0,0);
    const disc=dtype==="percent"?sub*Math.min(raw,100)/100:Math.min(raw,sub);
    const after=Math.max(sub-disc,0);
    const rate=vatToggle.checked?(+vatRate.value||0):0;
    const total=after+after*rate/100;
    paid.value=total.toFixed(3);
    paid.readOnly=true;
  }else{
    paid.readOnly=false;
  }
  updateTotals();
}


async function makeActualPDFFile(){
  if(!previewDoc) throw new Error("No document");
  const canvas = await renderInvoiceCanvas();
  const jpg = canvas.toDataURL("image/jpeg",0.95);
  const jpgBytes = dataUrlToBytes(jpg);
  const pdfBytes = jpegToSinglePagePDF(jpgBytes,canvas.width,canvas.height);
  const raw = previewDoc.number || (previewType==="invoice" ? "Invoice" : "Quotation");
  const name = String(raw).replace(/[^\w\-]+/g,"_") + ".pdf";
  return new File([pdfBytes], name, {type:"application/pdf", lastModified:Date.now()});
}

async function shareActualPDF(){
  try{
    const file = await makeActualPDFFile();

    // iOS Safari: share the File object itself. No url/title/text is supplied,
    // so WhatsApp receives an attached PDF rather than a website/blob link.
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file]});
      return;
    }

    // If file sharing is unavailable, download the PDF file instead of sharing a URL.
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    alert(tr("PDF saved. Open it from Downloads to share.","تم حفظ PDF. افتحه من التنزيلات للمشاركة."));
  }catch(e){
    if(e && e.name==="AbortError") return;
    console.error(e);
    alert(tr("Could not share the PDF file.","تعذر مشاركة ملف PDF."));
  }
}

async function openActualPDF(){
  if(!previewDoc){
    alert(tr("Nothing to export.","لا يوجد مستند للتصدير."));
    return;
  }

  const btn=document.querySelector('[onclick="openActualPDF()"]');

  // Must happen immediately from the tap, before any await.
  // This avoids iOS Safari blocking the PDF window later.
  const viewer=window.open("about:blank","_blank");

  if(!viewer){
    // If popup is blocked, fall back to the same tab.
    try{
      if(btn){
        btn.disabled=true;
        btn.dataset.oldText=btn.textContent;
        btn.textContent=tr("Creating PDF…","جاري إنشاء PDF…");
      }
      const file=await makeActualPDFFile();
      const url=URL.createObjectURL(file);
      window.location.assign(url);
      setTimeout(()=>URL.revokeObjectURL(url),15*60*1000);
    }catch(e){
      console.error(e);
      if(btn){
        btn.disabled=false;
        btn.textContent=btn.dataset.oldText||tr("Open / Print PDF","فتح / طباعة PDF");
      }
      alert(tr("Could not open PDF.","تعذر فتح ملف PDF."));
    }
    return;
  }

  try{
    viewer.document.open();
    viewer.document.write(
      `<html><body style="font-family:-apple-system,Arial;text-align:center;padding:40px">
        <div style="font-size:18px;font-weight:700">
          ${tr("Creating PDF…","جاري إنشاء PDF…")}
        </div>
      </body></html>`
    );
    viewer.document.close();

    if(btn){
      btn.disabled=true;
      btn.dataset.oldText=btn.textContent;
      btn.textContent=tr("Creating PDF…","جاري إنشاء PDF…");
    }

    const file=await makeActualPDFFile();
    const url=URL.createObjectURL(file);

    viewer.location.replace(url);

    // Keep the PDF blob alive for the iPhone viewer/share/print sheet.
    setTimeout(()=>URL.revokeObjectURL(url),15*60*1000);

    if(btn){
      btn.disabled=false;
      btn.textContent=btn.dataset.oldText||tr("Open / Print PDF","فتح / طباعة PDF");
    }
  }catch(e){
    console.error(e);
    try{ viewer.close(); }catch(_){}
    if(btn){
      btn.disabled=false;
      btn.textContent=btn.dataset.oldText||tr("Open / Print PDF","فتح / طباعة PDF");
    }
    alert(tr("Could not create PDF.","تعذر إنشاء ملف PDF."));
  }
}

// Legacy actions all route to the real PDF workflow.
function printPreview(){ return openActualPDF(); }
function openPrintView(){ return openActualPDF(); }
async function openNativePDF(){ return openActualPDF(); }
async function sharePDFFile(){ return shareActualPDF(); }

function editInvoiceItem(i){
  const x=items[i];
  if(!x)return;
  editingItemIndex=i;
  itemName.value=x.name||"";
  if(x.isDescription){
    qty.value=1;
    price.value="";
  }else{
    qty.value=x.qty||1;
    price.value=x.price;
  }
  itemName.focus();
}
function deleteInvoiceItem(i){items.splice(i,1);if(editingItemIndex===i)editingItemIndex=null;renderItems();updateTotals()}
function editQuoteItem(i){
  const x=qitems[i];
  if(!x)return;
  editingQItemIndex=i;
  qItem.value=x.name||"";
  if(x.isDescription){
    qQty.value=1;
    qPrice.value="";
  }else{
    qQty.value=x.qty||1;
    qPrice.value=x.price;
  }
  qItem.focus();
}
function deleteQuoteItem(i){qitems.splice(i,1);if(editingQItemIndex===i)editingQItemIndex=null;renderQItems()}
function selectQuoteProduct(){if(!document.getElementById("qProductSelect"))return;const i=qProductSelect.value;if(i==="")return;const p=db.products[+i];qItem.value=p.name;qPrice.value=p.price;qQty.value=1}
function quickAddQuoteProduct(){const name=prompt(tr("Product / service name","اسم المنتج / الخدمة"));if(!name||!name.trim())return;const pr=prompt(tr("Price","السعر"))||"0";const p={name:name.trim(),price:Number(pr)||0};db.products.push(p);saveDB();populate();qProductSelect.value=String(db.products.length-1);qItem.value=p.name;qPrice.value=p.price;qQty.value=1}


let currentDocumentTab="invoices";

function setDocumentTab(tab){
  currentDocumentTab=tab;
  if(document.getElementById("docInvoicesBtn")){
    docInvoicesBtn.classList.toggle("active",tab==="invoices");
    docQuotesBtn.classList.toggle("active",tab==="quotes");
  }
  renderDocuments();
}

function renderDocuments(){
  if(!document.getElementById("documentsList")) return;

  if(currentDocumentTab==="quotes"){
    documentsList.innerHTML=db.quotes.length
      ? db.quotes.map((x,i)=>`
        <div class="document-row">
          <div class="document-main">
            <strong>${x.number}</strong>
            <small>${esc(x.customer)}</small>
            ${statusBadge(quoteDisplayStatus(x))}
          </div>
          <div class="document-side">
            <strong>${money(x.total)}</strong>
            ${x.convertedInvoiceNumber?`<small class="converted-ref">${tr("Converted to","تم التحويل إلى")} ${x.convertedInvoiceNumber}</small>`:""}
            <div class="document-row-actions">
              <button onclick="openSavedQuote(${i})">${tr("Preview","معاينة")}</button>
              <button onclick="editSavedQuote(${i})">${tr("Edit","تعديل")}</button>
              ${x.convertedInvoiceNumber
                ?`<button class="converted" onclick="openConvertedInvoice('${x.convertedInvoiceNumber}')">${tr("Open Invoice","فتح الفاتورة")}</button>`
                :`<button class="convert" onclick="convertQuoteToInvoice(${i})">${tr("Convert","تحويل لفاتورة")}</button>`}
            </div>
          </div>
        </div>`).join("")
      : `<div class="empty">${tr("No quotations yet","لا توجد عروض أسعار بعد")}</div>`;
  }else{
    documentsList.innerHTML=db.invoices.length
      ? db.invoices.map((x,i)=>`
        <div class="document-row">
          <div class="document-main">
            <strong>${x.number}</strong>
            <small>${esc(x.customer)}</small>
            ${statusBadge(invoiceDisplayStatus(x))}
          </div>
          <div class="document-side">
            <strong>${money(x.total)}</strong>
            <div class="document-row-actions">
              <button onclick="openSavedInvoice(${i})">${tr("Preview","معاينة")}</button>
              <button onclick="editSavedInvoice(${i})">${tr("Edit","تعديل")}</button>
            </div>
          </div>
        </div>`).join("")
      : `<div class="empty">${tr("No invoices yet","لا توجد فواتير بعد")}</div>`;
  }
}


function selectQuoteCustomer(){
  if(!document.getElementById("qCustomerSelect")) return;
  const i=qCustomerSelect.value;
  if(i==="") return;
  const c=db.customers[+i];
  qCustomer.value=c.name||"";
  if(document.getElementById("qCustomerPhone"))qCustomerPhone.value=c.phone||"";
  if(document.getElementById("qCustomerAddress"))qCustomerAddress.value=c.address||"";
}

function quickAddQuoteCustomer(){
  const name=prompt(tr("Customer name","اسم العميل"));
  if(!name || !name.trim()) return;
  const phone=prompt(tr("Phone (optional)","الهاتف (اختياري)")) || "";
  const address=prompt(tr("Address (optional)","العنوان (اختياري)")) || "";
  const customer={id:makeCustomerId(),name:name.trim(),phone:phone.trim(),address:address.trim()};
  db.customers.push(customer);
  saveDB();
  populate();
  const idx=db.customers.length-1;
  qCustomerSelect.value=String(idx);
  qCustomer.value=customer.name;
  qCustomerPhone.value=customer.phone;
  qCustomerAddress.value=customer.address;
}


function convertQuoteToInvoice(i){
  const q=db.quotes[i];
  if(!q) return;

  if(q.convertedInvoiceNumber){
    const existing=db.invoices.findIndex(inv=>inv.number===q.convertedInvoiceNumber);
    if(existing>=0){
      alert(tr(
        "This quotation was already converted to "+q.convertedInvoiceNumber+".",
        "تم تحويل عرض السعر مسبقاً إلى الفاتورة "+q.convertedInvoiceNumber+"."
      ));
      openSavedInvoice(existing);
      return;
    }
  }

  const ok=confirm(tr(
    "Confirm customer approval and convert "+q.number+" to a new invoice?",
    "تأكيد موافقة العميل وتحويل "+q.number+" إلى فاتورة جديدة؟"
  ));
  if(!ok) return;

  const invoice={
    number:nextNo("INV",db.invoices),
    customer:q.customer||"",
    customerId:q.customerId||"",
    phone:q.phone||"",
    address:q.address||"",
    date:todayLocalISODate()+"T12:00:00",
    items:(q.items||[]).map(x=>({...x})),
    notes:q.notes||"",
    terms:q.terms||"",
    sourceQuoteNumber:q.number,
    sub:+q.sub||0,
    discount:+q.discount||0,
    discountType:q.discountType||"percent",
    discountValue:+q.discountValue||0,
    afterDiscount:(q.afterDiscount!==undefined?+q.afterDiscount:(+q.total||0)),
    vat:+q.vat||0,
    vatEnabled:!!q.vatEnabled,
    vatRate:+q.vatRate||0,
    total:+q.total||0,
    paid:0,
    balance:+q.total||0,
    paidFull:false,
    status:"draft"
  };

  db.invoices.unshift(invoice);
  q.status="approved";
  q.convertedInvoiceNumber=invoice.number;
  q.convertedInvoiceDate=new Date().toISOString();
  saveDB();

  currentDocumentTab="invoices";
  renderDocuments();

  previewDoc=invoice;
  previewType="invoice";
  previewBack="documents";
  previewDocNo.textContent=invoice.number;
  renderPaper(invoice,"invoice");
  show("preview");
}

function openConvertedInvoice(number){
  const i=db.invoices.findIndex(inv=>inv.number===number);
  if(i>=0) openSavedInvoice(i);
}


document.addEventListener("click",function(ev){
  if(!document.getElementById("currencyResults")) return;
  const inside=ev.target.closest ? ev.target.closest(".currency-picker") : null;
  if(!inside) currencyResults.classList.add("hidden");
});


function customerInvoicesByIndex(i){
  const c=db.customers[i];
  if(!c) return [];
  const name=(c.name||"").trim().toLowerCase();
  const phone=(c.phone||"").trim();

  return db.invoices.filter(inv=>{
    const sameId=c.id && inv.customerId===c.id;
    const sameName=(inv.customer||"").trim().toLowerCase()===name;
    const samePhone=phone && (inv.phone||"").trim()===phone;
    return sameId || sameName || samePhone;
  }).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
}


function customerPaymentsByIndex(i){
  if(!Array.isArray(db.customerPayments)) db.customerPayments=[];
  const c=db.customers[i];
  if(!c) return [];

  return db.customerPayments
    .filter(p=>(c.id && p.customerId===c.id) || +p.customerIndex===+i)
    .sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
}


function statementDisplayDate(value, locale){
  if(!value) return "—";
  const raw=String(value);
  const dt=new Date(raw.length<=10 ? raw+"T00:00:00" : raw);
  if(isNaN(dt)) return raw;
  return dt.toLocaleDateString(locale||(lang==="ar"?"ar-OM":"en-GB"));
}


function allocatedPaymentTotalForInvoice(customerIndex,invoiceNumber){
  return customerPaymentsByIndex(customerIndex).reduce((sum,p)=>{
    return sum+(p.allocations||[]).reduce((s,a)=>{
      return s+(a.invoiceNumber===invoiceNumber?(+a.amount||0):0);
    },0);
  },0);
}

function invoiceUnloggedPaidAmount(customerIndex,inv){
  const invoicePaid=Math.max(+inv.paid||0,0);
  const loggedForInvoice=allocatedPaymentTotalForInvoice(customerIndex,inv.number);
  // The difference is money entered directly in the invoice Paid Amount field.
  // It must appear as its own receipt/advance-payment movement in the statement.
  return Math.max(Math.round((invoicePaid-loggedForInvoice)*1000)/1000,0);
}

function buildCustomerStatementLedger(i){
  const invoiceRows=customerInvoicesByIndex(i).map((inv,idx)=>{
    const date=inv.date||"";
    const baseStamp=new Date(
      String(date||"1970-01-01").length<=10
        ? String(date||"1970-01-01")+"T00:00:00"
        : String(date||"1970-01-01")
    ).getTime()||0;

    // Amount entered directly in the invoice Paid Amount field appears
    // in the SAME invoice row under Credit.
    const directPaid=invoiceUnloggedPaidAmount(i,inv);

    return {
      kind:"invoice",
      date,
      ref:inv.number||"",
      description:tr("Invoice","فاتورة"),
      debit:Math.round((+inv.total||0)*1000)/1000,
      credit:Math.round(directPaid*1000)/1000,
      sortStamp:baseStamp+idx/1000
    };
  });

  // Payments recorded later from the payment ledger remain separate movements.
  const payments=customerPaymentsByIndex(i).map((p,idx)=>{
    const date=p.date||"";
    const baseStamp=new Date(
      String(date||"1970-01-01").length<=10
        ? String(date||"1970-01-01")+"T00:00:00"
        : String(date||"1970-01-01")
    ).getTime()||0;

    return {
      kind:"payment",
      date,
      ref:p.receiptNo||p.id||"",
      description:tr("Payment","دفعة")+" - "+paymentMethodLabel(p.method||"cash"),
      debit:0,
      credit:Math.round((+p.amount||0)*1000)/1000,
      sortStamp:baseStamp+0.5+idx/1000
    };
  });

  const rows=invoiceRows.concat(payments)
    .sort((a,b)=>a.sortStamp-b.sortStamp || String(a.ref).localeCompare(String(b.ref)));

  let running=0;
  return rows.map(r=>{
    running=Math.round((running+(r.debit||0)-(r.credit||0))*1000)/1000;
    return {...r,balance:running};
  });
}

function localDateForInput(){
  const d=new Date();
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}


function snapshotInvoiceBalances(){
  return db.invoices.map(inv=>({
    number:inv.number,
    paid:+inv.paid||0,
    balance:+inv.balance||0,
    paidFull:!!inv.paidFull
  }));
}

function restoreInvoiceBalances(snapshot){
  snapshot.forEach(s=>{
    const inv=db.invoices.find(x=>x.number===s.number);
    if(inv){
      inv.paid=s.paid;
      inv.balance=s.balance;
      inv.paidFull=s.paidFull;
    }
  });
}

function reversePaymentAllocations(payment){
  (payment.allocations||[]).forEach(a=>{
    const inv=db.invoices.find(x=>x.number===a.invoiceNumber);
    if(!inv) return;
    inv.paid=Math.max(Math.round(((+inv.paid||0)-(+a.amount||0))*1000)/1000,0);
    inv.balance=Math.max(Math.round(((+inv.total||0)-inv.paid)*1000)/1000,0);
    inv.paidFull=(+inv.total||0)>0 && inv.balance<=0.0005;
  });
}

function allocatePaymentToCustomer(customerIndex,amount){
  const invs=customerInvoicesByIndex(customerIndex);
  let remaining=Math.round((+amount||0)*1000)/1000;
  const allocations=[];

  invs.forEach(inv=>{
    if(remaining<=0.0005) return;
    const bal=Math.max(+inv.balance||0,0);
    if(bal<=0.0005) return;

    const applied=Math.min(remaining,bal);
    inv.paid=Math.round(((+inv.paid||0)+applied)*1000)/1000;
    inv.balance=Math.max(Math.round(((+inv.total||0)-inv.paid)*1000)/1000,0);
    inv.paidFull=(+inv.total||0)>0 && inv.balance<=0.0005;

    allocations.push({
      invoiceNumber:inv.number,
      amount:Math.round(applied*1000)/1000
    });
    remaining=Math.max(Math.round((remaining-applied)*1000)/1000,0);
  });

  return {allocations,remaining};
}

function paymentCustomerIndex(payment){
  if(payment.customerId){
    const i=db.customers.findIndex(c=>c.id===payment.customerId);
    if(i>=0) return i;
  }
  if(Number.isInteger(+payment.customerIndex) && db.customers[+payment.customerIndex]) return +payment.customerIndex;

  const n=(payment.customerName||"").trim().toLowerCase();
  const p=(payment.customerPhone||"").trim();
  return db.customers.findIndex(c=>
    (n && (c.name||"").trim().toLowerCase()===n) ||
    (p && (c.phone||"").trim()===p)
  );
}

function paymentRecordById(id){
  return db.customerPayments.find(p=>p.id===id || p.receiptNo===id);
}

function editPayment(id){
  const p=paymentRecordById(id);
  if(!p) return;
  editingPaymentId=p.id;

  paymentEditReceipt.textContent=p.receiptNo||p.id||"";
  paymentEditAmount.value=+p.amount||0;
  paymentEditDate.value=p.date||todayLocalISODate();
  paymentEditMethod.value=p.method||"cash";
  paymentEditReference.value=p.reference||"";
  paymentEditNote.value=p.note||"";
  paymentEditCard.classList.remove("hidden");
  paymentEditCard.scrollIntoView({behavior:"smooth",block:"start"});
}

function cancelPaymentEdit(){
  editingPaymentId=null;
  if(document.getElementById("paymentEditCard")) paymentEditCard.classList.add("hidden");
}

function savePaymentEdit(){
  const p=paymentRecordById(editingPaymentId);
  if(!p) return;

  const amount=Math.round((+paymentEditAmount.value||0)*1000)/1000;
  if(amount<=0){
    alert(tr("Enter a payment amount greater than zero.","أدخل مبلغ دفعة أكبر من صفر."));
    return;
  }

  const ci=paymentCustomerIndex(p);
  if(ci<0){
    alert(tr("Customer record could not be found.","تعذر العثور على سجل العميل."));
    return;
  }

  const snapshot=snapshotInvoiceBalances();
  reversePaymentAllocations(p);

  const outstanding=customerInvoicesByIndex(ci).reduce((s,x)=>s+(+x.balance||0),0);
  if(amount>outstanding+0.0005){
    restoreInvoiceBalances(snapshot);
    alert(tr(
      "Payment cannot exceed the customer's outstanding balance of "+money(outstanding)+".",
      "لا يمكن أن تتجاوز الدفعة المبلغ المستحق على العميل وقدره "+money(outstanding)+"."
    ));
    return;
  }

  const result=allocatePaymentToCustomer(ci,amount);
  if(result.remaining>0.0005){
    restoreInvoiceBalances(snapshot);
    alert(tr("Could not allocate the full payment.","تعذر توزيع كامل مبلغ الدفعة."));
    return;
  }

  p.amount=amount;
  p.date=paymentEditDate.value||todayLocalISODate();
  p.method=paymentEditMethod.value||"cash";
  p.reference=paymentEditReference.value.trim();
  p.note=paymentEditNote.value.trim();
  p.allocations=result.allocations;
  p.updatedAt=new Date().toISOString();

  saveDB();
  editingPaymentId=null;
  paymentEditCard.classList.add("hidden");
  renderPaymentLedger();
  renderHome();
  if(statementCustomerIndex!==null) renderCustomerStatement();
}

function deletePayment(id){
  const p=paymentRecordById(id);
  if(!p) return;

  if(!confirm(tr(
    "Delete "+(p.receiptNo||"this payment")+" and restore the invoice balances?",
    "حذف "+(p.receiptNo||"هذه الدفعة")+" وإعادة أرصدة الفواتير؟"
  ))) return;

  reversePaymentAllocations(p);
  db.customerPayments=db.customerPayments.filter(x=>x!==p);
  saveDB();
  renderPaymentLedger();
  renderHome();
  if(statementCustomerIndex!==null) renderCustomerStatement();
}

function renderPaymentLedger(){
  if(!document.getElementById("paymentLedgerRows")) return;
  normalizeDB();

  const payments=(db.customerPayments||[]).slice().sort((a,b)=>
    new Date(b.date||b.createdAt||0)-new Date(a.date||a.createdAt||0)
  );
  paymentLedgerCount.textContent=String(payments.length);
  paymentLedgerTotal.textContent=money(payments.reduce((s,p)=>s+(+p.amount||0),0));

  paymentLedgerRows.innerHTML=payments.length
    ? payments.map(p=>{
      const refs=(p.allocations||[]).map(a=>a.invoiceNumber).join(", ");
      return `<div class="payment-ledger-row">
        <div class="payment-ledger-main">
          <div class="payment-ledger-head">
            <strong>${esc(p.receiptNo||p.id||"")}</strong>
            <span>${money(p.amount)}</span>
          </div>
          <small>${esc(p.customerName||"")} • ${new Date((p.date||todayLocalISODate())+"T00:00:00").toLocaleDateString(lang==="ar"?"ar-OM":"en-GB")}</small>
          <small>${esc(paymentMethodLabel(p.method||"cash"))}${p.reference?` • ${esc(p.reference)}`:""}</small>
          ${refs?`<small>${tr("Invoices","الفواتير")}: ${esc(refs)}</small>`:""}
          ${p.note?`<small>${esc(p.note)}</small>`:""}
        </div>
        <div class="payment-ledger-actions">
          <button onclick="editPayment('${esc(p.id)}')">${tr("Edit","تعديل")}</button>
          <button class="danger-btn" onclick="deletePayment('${esc(p.id)}')">${tr("Delete","حذف")}</button>
        </div>
      </div>`;
    }).join("")
    : `<div class="empty">${tr("No recorded payments","لا توجد دفعات مسجلة")}</div>`;
}

function addStatementPayment(){
  if(statementCustomerIndex===null || !db.customers[statementCustomerIndex]) return;

  const amount=Math.round((+statementPaymentAmount.value||0)*1000)/1000;
  const invs=customerInvoicesByIndex(statementCustomerIndex);
  const outstanding=Math.round(invs.reduce((s,x)=>s+(+x.balance||0),0)*1000)/1000;

  if(amount<=0){
    alert(tr("Enter a payment amount greater than zero.","أدخل مبلغ دفعة أكبر من صفر."));
    statementPaymentAmount.focus();
    return;
  }

  if(outstanding<=0){
    alert(tr("This customer has no outstanding balance.","لا يوجد مبلغ مستحق على هذا العميل."));
    return;
  }

  if(amount>outstanding+0.0005){
    alert(tr(
      "Payment cannot exceed the outstanding balance of "+money(outstanding)+".",
      "لا يمكن أن تتجاوز الدفعة المبلغ المتبقي وقدره "+money(outstanding)+"."
    ));
    return;
  }

  const result=allocatePaymentToCustomer(statementCustomerIndex,amount);
  if(result.remaining>0.0005){
    alert(tr("Could not allocate the full payment.","تعذر توزيع كامل مبلغ الدفعة."));
    return;
  }

  const c=db.customers[statementCustomerIndex];
  const record={
    id:"PAY-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    receiptNo:nextReceiptNo(),
    customerIndex:statementCustomerIndex,
    customerId:c.id||"",
    customerName:c.name||"",
    customerPhone:c.phone||"",
    date:statementPaymentDate.value||todayLocalISODate(),
    amount:amount,
    method:(document.getElementById("statementPaymentMethod")?statementPaymentMethod.value:"cash")||"cash",
    reference:(document.getElementById("statementPaymentReference")?statementPaymentReference.value.trim():""),
    note:statementPaymentNote.value.trim(),
    allocations:result.allocations,
    createdAt:new Date().toISOString()
  };

  db.customerPayments.push(record);
  saveDB();

  statementPaymentAmount.value="";
  statementPaymentNote.value="";
  if(document.getElementById("statementPaymentReference")) statementPaymentReference.value="";
  if(document.getElementById("statementPaymentMethod")) statementPaymentMethod.value="cash";
  statementPaymentDate.value=todayLocalISODate();

  renderCustomerStatement();
  renderHome();
  renderDocuments();

  alert(tr(
    "Payment "+record.receiptNo+" for "+money(amount)+" recorded successfully.",
    "تم تسجيل الدفعة "+record.receiptNo+" بمبلغ "+money(amount)+" بنجاح."
  ));
}

function openCustomerStatement(i){
  statementCustomerIndex=i;
  renderCustomerStatement();
  show("customerStatement");
  if(document.getElementById("statementPaymentDate") && !statementPaymentDate.value){
    statementPaymentDate.value=todayLocalISODate();
  }
  if(document.getElementById("statementPaymentMethod")) statementPaymentMethod.value="cash";
}

function renderCustomerStatement(){
  if(statementCustomerIndex===null || !db.customers[statementCustomerIndex]) return;

  const c=db.customers[statementCustomerIndex];
  const invs=customerInvoicesByIndex(statementCustomerIndex);
  const payments=customerPaymentsByIndex(statementCustomerIndex);
  const ledger=buildCustomerStatementLedger(statementCustomerIndex);

  const total=ledger.reduce((s,x)=>s+(+x.debit||0),0);
  const paid=ledger.reduce((s,x)=>s+(+x.credit||0),0);
  const balance=ledger.length?ledger[ledger.length-1].balance:0;

  statementCustomerName.textContent=c.name||"";
  statementTotal.textContent=money(total);
  statementPaid.textContent=money(paid);
  statementBalance.textContent=money(balance);
  statementCount.textContent=String(invs.length);

  if(document.getElementById("paymentOutstandingHint")){
    paymentOutstandingHint.textContent=tr("Outstanding: ","المتبقي: ")+money(balance);
  }

  statementCustomerInfo.innerHTML=`<strong>${esc(c.name||"")}</strong>${c.phone?`<span>${esc(c.phone)}</span>`:""}${c.address?`<span>${esc(c.address)}</span>`:""}`;

  statementRows.innerHTML=ledger.length ? ledger.map(row=>{
    const debit=(+row.debit||0)>0 ? money(row.debit) : "—";
    const credit=(+row.credit||0)>0 ? money(row.credit) : "—";
    const refCell=row.kind==="invoice"
      ? `<button class="statement-invoice-link" onclick="openStatementInvoice('${row.ref}')">${esc(row.ref)}</button>`
      : esc(row.ref||"—");
    const rowClass=(+row.balance||0)>0 ? "statement-due" : "statement-paid";
    return `<tr class="${row.kind==="invoice-payment"?"statement-advance-row":row.kind==="payment"?"statement-receipt-row":""}">
      <td>${statementDisplayDate(row.date)}</td>
      <td>${esc(row.description)}</td>
      <td>${refCell}</td>
      <td>${debit}</td>
      <td>${credit}</td>
      <td class="${rowClass}">${money(row.balance)}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="6" class="empty">${tr("No statement activity for this customer","لا توجد حركة لهذا العميل")}</td></tr>`;

  if(document.getElementById("statementPaymentRows")){
    statementPaymentRows.innerHTML=payments.length ? payments.slice().reverse().map(p=>{
      const refs=(p.allocations||[]).map(a=>`${esc(a.invoiceNumber)} (${money(a.amount)})`).join(", ");
      const note=[p.reference,p.note].filter(Boolean).join(" • ");
      return `<tr class="payment-history-row">
        <td>${esc(p.receiptNo||p.id||"")}</td>
        <td>${statementDisplayDate(p.date||todayLocalISODate())}</td>
        <td>${esc(paymentMethodLabel(p.method||"cash"))}</td>
        <td class="payment-amount">${money(p.amount)}</td>
        <td>${refs||"—"}</td>
        <td>${esc(note||"—")}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" class="empty">${tr("No payments recorded","لا توجد دفعات مسجلة")}</td></tr>`;
  }
}

function openStatementInvoice(number){
  const i=db.invoices.findIndex(x=>x.number===number);
  if(i>=0) openSavedInvoice(i);
}

function statementPDFData(){
  if(statementCustomerIndex===null || !db.customers[statementCustomerIndex]) throw new Error("No customer");
  const customer=db.customers[statementCustomerIndex];
  const invoices=customerInvoicesByIndex(statementCustomerIndex);
  const payments=customerPaymentsByIndex(statementCustomerIndex);
  const ledger=buildCustomerStatementLedger(statementCustomerIndex);
  return {customer,invoices,payments,ledger};
}

async function renderStatementCanvases(){
  const {customer,invoices,payments,ledger}=statementPDFData();
  const s=db.settings||{};
  const rtl=lang==="ar";
  const W=1240,H=1754,L=75,R=1165;
  const rowsPerPage=18;
  const chunks=[];
  if(!ledger.length) chunks.push([]);
  for(let i=0;i<ledger.length;i+=rowsPerPage) chunks.push(ledger.slice(i,i+rowsPerPage));
  const totalAll=ledger.reduce((n,x)=>n+(+x.debit||0),0);
  const paidAll=ledger.reduce((n,x)=>n+(+x.credit||0),0);
  const balAll=ledger.length?ledger[ledger.length-1].balance:0;
  const logo=await loadImageForCanvas(companyLogo());
  const canvases=[];

  for(let p=0;p<chunks.length;p++){
    const rows=chunks[p];
    const c=document.createElement("canvas"); c.width=W;c.height=H;
    const ctx=c.getContext("2d");
    const BLUE="#123f93", GOLD="#d6aa16", TEXT="#111827", PALE="#f4f7fd";
    ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);ctx.direction=rtl?"rtl":"ltr";

    if(logo){
      const box=100, ratio=Math.min(box/logo.width,box/logo.height),dw=logo.width*ratio,dh=logo.height*ratio;
      ctx.drawImage(logo,W/2-dw/2,45+(box-dh)/2,dw,dh);
    }
    ctx.fillStyle=BLUE;ctx.font="700 34px -apple-system,Arial";ctx.textAlign="center";
    ctx.fillText(s.company||tr("Company Name","اسم الشركة"),W/2,175);
    ctx.fillStyle=GOLD;ctx.font="800 50px -apple-system,Arial";
    ctx.fillText(tr("CUSTOMER STATEMENT","كشف حساب العميل"),W/2,235);
    ctx.fillStyle=TEXT;ctx.font="22px -apple-system,Arial";
    ctx.fillText(`${tr("Page","صفحة")} ${p+1} ${tr("of","من")} ${chunks.length}`,W/2,273);
    ctx.fillStyle=BLUE;ctx.fillRect(L,300,R-L,4);

    ctx.fillStyle=PALE;ctx.fillRect(L,335,R-L,140);
    ctx.fillStyle=TEXT;ctx.font="700 30px -apple-system,Arial";ctx.textAlign=rtl?"right":"left";
    ctx.fillText(customer.name||"",rtl?R-25:L+25,380);
    ctx.font="22px -apple-system,Arial";
    let cy=420;
    for(const line of [customer.phone,customer.address].filter(Boolean)){ctx.fillText(line,rtl?R-25:L+25,cy);cy+=30;}

    const y0=520;
    ctx.fillStyle=BLUE;ctx.fillRect(L,y0,R-L,56);
    const widths=[150,300,170,150,150,170];
    const headers=rtl
      ? [tr("Balance","الرصيد"),tr("Credit","منه"),tr("Debit","له"),tr("Reference","المرجع"),tr("Description","البيان"),tr("Date","التاريخ")]
      : [tr("Date","التاريخ"),tr("Description","البيان"),tr("Reference","المرجع"),tr("Debit","له"),tr("Credit","منه"),tr("Balance","الرصيد")];
    ctx.font="700 20px -apple-system,Arial";ctx.fillStyle="#fff";let x=L;
    headers.forEach((h,i)=>{ctx.textAlign="center";ctx.fillText(h,x+widths[i]/2,y0+36);x+=widths[i];});

    let yy=y0+56;ctx.font="19px -apple-system,Arial";ctx.fillStyle=TEXT;
    rows.forEach(row=>{
      const description=row.description;
      const debit=(+row.debit||0)>0 ? money(row.debit) : "—";
      const credit=(+row.credit||0)>0 ? money(row.credit) : "—";
      const vals=rtl
        ? [money(row.balance),credit,debit,row.ref||"—",description,statementDisplayDate(row.date, "ar-OM")]
        : [statementDisplayDate(row.date, "en-GB"),description,row.ref||"—",debit,credit,money(row.balance)];
      let xx=L;
      vals.forEach((v,i)=>{
        ctx.textAlign="center";
        const text=String(v);
        const max= i===1 || (rtl && i===4) ? 24 : 18;
        ctx.fillText(text.length>max ? text.slice(0,max-1)+"…" : text,xx+widths[i]/2,yy+33);
        xx+=widths[i];
      });
      ctx.strokeStyle="#dde3ed";ctx.beginPath();ctx.moveTo(L,yy+48);ctx.lineTo(R,yy+48);ctx.stroke(); yy+=48;
    });

    if(p===chunks.length-1){
      const sy=1388, sw=520, sh=54, sx=rtl?L:R-sw;
      const totals=[
        [tr("Total Invoiced","إجمالي الفواتير"),money(totalAll)],
        [tr("Total Received","إجمالي المقبوض"),money(paidAll)],
        [tr("Closing Balance","الرصيد الختامي"),money(balAll)]
      ];
      totals.forEach((r,i)=>{
        ctx.fillStyle=i===2?GOLD:(i===1?BLUE:"#fff");ctx.fillRect(sx,sy+i*sh,sw,sh);ctx.strokeStyle="#d8dee9";ctx.strokeRect(sx,sy+i*sh,sw,sh);
        ctx.fillStyle=i===1?"#fff":TEXT;ctx.font=(i===2?"700 ":"")+"22px -apple-system,Arial";
        ctx.textAlign=rtl?"right":"left";ctx.fillText(r[0],rtl?sx+sw-18:sx+18,sy+i*sh+34);
        ctx.textAlign=rtl?"left":"right";ctx.fillText(r[1],rtl?sx+18:sx+sw-18,sy+i*sh+34);
      });
    }

    ctx.fillStyle=GOLD;ctx.fillRect(L,1660,R-L,5);ctx.fillStyle=BLUE;ctx.fillRect(L,1665,R-L,64);
    ctx.fillStyle="#fff";ctx.font="20px -apple-system,Arial";ctx.textAlign="center";
    ctx.fillText([s.phone,s.email].filter(Boolean).join("  •  "),W/2,1705);
    canvases.push(c);
  }
  return canvases;
}

function jpegPagesToPDF(pages){
  const pageW=595.28,pageH=841.89;
  const obj=[]; const pageCount=pages.length;
  obj[1]=pdfAsciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
  const kids=[]; for(let i=0;i<pageCount;i++) kids.push(`${3+i*3} 0 R`);
  obj[2]=pdfAsciiBytes(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pageCount} >>`);
  for(let i=0;i<pageCount;i++){
    const pageObj=3+i*3,imgObj=4+i*3,contentObj=5+i*3;
    const pg=pages[i]; const jpgBytes=dataUrlToBytes(pg.canvas.toDataURL("image/jpeg",0.94));
    obj[pageObj]=pdfAsciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${i} ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`);
    obj[imgObj]=concatBytes([pdfAsciiBytes(`<< /Type /XObject /Subtype /Image /Width ${pg.canvas.width} /Height ${pg.canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgBytes.length} >>\nstream\n`),jpgBytes,pdfAsciiBytes("\nendstream")]);
    const content=pdfAsciiBytes(`q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im${i} Do\nQ\n`);
    obj[contentObj]=concatBytes([pdfAsciiBytes(`<< /Length ${content.length} >>\nstream\n`),content,pdfAsciiBytes("endstream")]);
  }
  const maxObj=2+pageCount*3; const header=concatBytes([pdfAsciiBytes("%PDF-1.4\n"),new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A])]);
  let parts=[header],offsets=[0],pos=header.length;
  for(let i=1;i<=maxObj;i++){offsets[i]=pos;const pre=pdfAsciiBytes(`${i} 0 obj\n`),post=pdfAsciiBytes("\nendobj\n");parts.push(pre,obj[i],post);pos+=pre.length+obj[i].length+post.length;}
  const xrefPos=pos;let xref=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;for(let i=1;i<=maxObj;i++) xref+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  xref+=`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  parts.push(pdfAsciiBytes(xref)); return concatBytes(parts);
}

async function makeCustomerStatementPDFFile(){
  const canvases=await renderStatementCanvases();
  const pages=canvases.map(canvas=>({canvas}));
  const bytes=jpegPagesToPDF(pages);
  const c=db.customers[statementCustomerIndex];
  const name=`Statement_${String(c.name||"Customer").replace(/[^\w\-]+/g,"_")}.pdf`;
  return new File([bytes],name,{type:"application/pdf",lastModified:Date.now()});
}

async function shareCustomerStatementPDF(){
  try{
    const file=await makeCustomerStatementPDFFile();
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file]}); return;
    }
    const url=URL.createObjectURL(file);const a=document.createElement("a");a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){if(e&&e.name==="AbortError")return;console.error(e);alert(tr("Could not share statement PDF.","تعذر مشاركة كشف الحساب PDF."));}
}

async function openCustomerStatementPDF(){
  const viewer=window.open("about:blank","_blank");
  try{
    if(viewer){viewer.document.write(`<div style="font-family:-apple-system,Arial;padding:30px;text-align:center">${tr("Creating statement PDF…","جاري إنشاء كشف الحساب PDF…")}</div>`);viewer.document.close();}
    const file=await makeCustomerStatementPDFFile(); const url=URL.createObjectURL(file);
    if(viewer) viewer.location.replace(url); else window.location.assign(url);
    setTimeout(()=>URL.revokeObjectURL(url),15*60*1000);
  }catch(e){console.error(e);try{if(viewer)viewer.close()}catch(_){ }alert(tr("Could not open statement PDF.","تعذر فتح كشف الحساب PDF."));}
}


function expensesForDocument(type,number){
  return db.expenses.filter(e=>e.documentType===type && e.documentNumber===number);
}

function documentExpenseTotal(type,number){
  return expensesForDocument(type,number).reduce((s,e)=>s+(+e.amount||0),0);
}

function invoiceGrossProfitEstimate(invoice){
  return (+invoice.total||0)-invoiceExpenseTotalAdvanced(invoice);
}


function dateInRange(value,start,end){
  const d=dateValueFromStored(value);
  if(start && d<start) return false;
  if(end && d>end) return false;
  return true;
}

function expensesForInvoiceAdvanced(inv){
  const quoteRefs=new Set();
  if(inv.sourceQuoteNumber) quoteRefs.add(inv.sourceQuoteNumber);

  db.quotes.forEach(q=>{
    if(q.convertedInvoiceNumber===inv.number) quoteRefs.add(q.number);
  });

  return db.expenses.filter(e=>
    (e.documentType==="invoice" && e.documentNumber===inv.number) ||
    (e.documentType==="quote" && quoteRefs.has(e.documentNumber))
  );
}

function invoiceExpenseTotalAdvanced(inv){
  return expensesForInvoiceAdvanced(inv).reduce((s,e)=>s+(+e.amount||0),0);
}

function firstDayThisMonth(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
}

function prepareProfitReport(){
  if(!document.getElementById("profitStart")) return;
  if(!profitStart.value) profitStart.value=firstDayThisMonth();
  if(!profitEnd.value) profitEnd.value=todayLocalISODate();
  renderProfitReport();
}

function setProfitThisMonth(){
  profitStart.value=firstDayThisMonth();
  profitEnd.value=todayLocalISODate();
  renderProfitReport();
}

function renderProfitReport(){
  if(!document.getElementById("profitRows")) return;

  const start=profitStart.value||"";
  const end=profitEnd.value||"";
  const invoices=db.invoices.filter(inv=>
    inv.status!=="cancelled" && dateInRange(inv.date,start,end)
  );

  let sales=0;
  let linked=0;

  profitRows.innerHTML=invoices.length ? invoices.map(inv=>{
    const revenue=+inv.total||0;
    const exp=invoiceExpenseTotalAdvanced(inv);
    const profit=revenue-exp;
    sales+=revenue;
    linked+=exp;
    return `<tr>
      <td><button class="statement-invoice-link" onclick="openReportInvoice('${inv.number}')">${esc(inv.number)}</button></td>
      <td>${esc(inv.customer||"")}</td>
      <td>${money(revenue)}</td>
      <td>${money(exp)}</td>
      <td class="${profit>=0?"profit-positive":"profit-negative"}">${money(profit)}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" class="empty">${tr("No invoices in this period","لا توجد فواتير في هذه الفترة")}</td></tr>`;

  const general=db.expenses.filter(e=>
    !e.documentNumber && dateInRange(e.date,start,end)
  ).reduce((s,e)=>s+(+e.amount||0),0);

  const net=sales-linked-general;

  profitSales.textContent=money(sales);
  profitLinkedExpenses.textContent=money(linked);
  profitGeneralExpenses.textContent=money(general);
  profitNet.textContent=money(net);
  profitNet.classList.toggle("profit-negative",net<0);
  profitNet.classList.toggle("profit-positive",net>=0);
}

function openReportInvoice(number){
  const i=db.invoices.findIndex(x=>x.number===number);
  if(i>=0) openSavedInvoice(i);
}




const AUTO_BACKUP_ENABLED_KEY="invoicepro_auto_daily_backup";
const AUTO_BACKUP_DAY_KEY="invoicepro_auto_daily_backup_day";
const AUTO_BACKUP_CLOUD_SAVED_KEY="invoicepro_auto_daily_cloud_saved";
const DAILY_BACKUP_DB="InvoiceProDailyBackups";
const DAILY_BACKUP_STORE="snapshots";
const DAILY_BACKUP_KEEP=14;
let dailyBackupTimer=null;

function autoDailyBackupEnabled(){
  const v=localStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
  return v===null ? true : v==="1";
}

function setAutoDailyBackup(enabled){
  localStorage.setItem(AUTO_BACKUP_ENABLED_KEY,enabled?"1":"0");

  if(document.getElementById("autoDailyBackupToggle")){
    autoDailyBackupToggle.checked=enabled;
  }

  if(enabled){
    if(!localStorage.getItem(AUTO_BACKUP_DAY_KEY)){
      localStorage.setItem(AUTO_BACKUP_DAY_KEY,todayLocalISODate());
    }
    scheduleDailyBackup();
    refreshDailyBackupUI();
  }else{
    if(dailyBackupTimer){
      clearTimeout(dailyBackupTimer);
      dailyBackupTimer=null;
    }
    refreshDailyBackupUI();
  }
}

function previousLocalDate(){
  const d=new Date();
  d.setDate(d.getDate()-1);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function openDailyBackupDB(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req=indexedDB.open(DAILY_BACKUP_DB,1);
    req.onupgradeneeded=()=>{
      const idb=req.result;
      if(!idb.objectStoreNames.contains(DAILY_BACKUP_STORE)){
        idb.createObjectStore(DAILY_BACKUP_STORE,{keyPath:"backupForDate"});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("Could not open backup database"));
  });
}

async function putDailyBackup(snapshot){
  const idb=await openDailyBackupDB();
  await new Promise((resolve,reject)=>{
    const tx=idb.transaction(DAILY_BACKUP_STORE,"readwrite");
    tx.objectStore(DAILY_BACKUP_STORE).put(snapshot);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error("Could not save daily backup"));
  });
  idb.close();
  await pruneDailyBackups();
}

async function getAllDailyBackups(){
  const idb=await openDailyBackupDB();
  const rows=await new Promise((resolve,reject)=>{
    const tx=idb.transaction(DAILY_BACKUP_STORE,"readonly");
    const req=tx.objectStore(DAILY_BACKUP_STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error||new Error("Could not read daily backups"));
  });
  idb.close();
  return rows.sort((a,b)=>String(a.backupForDate).localeCompare(String(b.backupForDate)));
}

async function getLatestDailyBackup(){
  const rows=await getAllDailyBackups();
  return rows.length?rows[rows.length-1]:null;
}

async function pruneDailyBackups(){
  const rows=await getAllDailyBackups();
  if(rows.length<=DAILY_BACKUP_KEEP) return;

  const remove=rows.slice(0,rows.length-DAILY_BACKUP_KEEP);
  const idb=await openDailyBackupDB();
  await new Promise((resolve,reject)=>{
    const tx=idb.transaction(DAILY_BACKUP_STORE,"readwrite");
    const store=tx.objectStore(DAILY_BACKUP_STORE);
    remove.forEach(x=>store.delete(x.backupForDate));
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error("Could not prune backups"));
  });
  idb.close();
}

function buildDailyBackupPayload(backupForDate){
  normalizeDB();
  saveDB();

  return {
    backupForDate,
    app:"Invoice Pro",
    version:"2026.09.09-AUTODAILYBACKUP",
    exportedAt:new Date().toISOString(),
    preferredCloud:localStorage.getItem("invoicepro_backup_destination")||"icloud",
    language:lang,
    data:JSON.parse(JSON.stringify(db))
  };
}

async function createDailyBackup(backupForDate){
  if(!autoDailyBackupEnabled()) return null;

  const snapshot=buildDailyBackupPayload(backupForDate);
  await putDailyBackup(snapshot);

  localStorage.setItem(AUTO_BACKUP_CLOUD_SAVED_KEY,
    localStorage.getItem(AUTO_BACKUP_CLOUD_SAVED_KEY)||""
  );

  await refreshDailyBackupUI();
  return snapshot;
}

async function checkDailyBackup(){
  if(!autoDailyBackupEnabled()) return;

  const today=todayLocalISODate();
  let marker=localStorage.getItem(AUTO_BACKUP_DAY_KEY);

  if(!marker){
    localStorage.setItem(AUTO_BACKUP_DAY_KEY,today);
    scheduleDailyBackup();
    await refreshDailyBackupUI();
    return;
  }

  if(marker!==today){
    // The state currently stored is the final state from the last day the app was used.
    // Create that missed end-of-day snapshot before the user makes new changes today.
    try{
      await createDailyBackup(marker);
    }catch(e){
      console.error("Daily backup failed",e);
    }
    localStorage.setItem(AUTO_BACKUP_DAY_KEY,today);
  }

  scheduleDailyBackup();
  await refreshDailyBackupUI();
}

function scheduleDailyBackup(){
  if(dailyBackupTimer){
    clearTimeout(dailyBackupTimer);
    dailyBackupTimer=null;
  }
  if(!autoDailyBackupEnabled()) return;

  const now=new Date();
  const next=new Date(now);
  next.setHours(24,0,2,0);
  const delay=Math.max(next.getTime()-now.getTime(),1000);

  dailyBackupTimer=setTimeout(async()=>{
    try{
      const finishedDate=previousLocalDate();
      await createDailyBackup(finishedDate);
      localStorage.setItem(AUTO_BACKUP_DAY_KEY,todayLocalISODate());
    }catch(e){
      console.error("Scheduled daily backup failed",e);
    }
    scheduleDailyBackup();
  },delay);
}

async function refreshDailyBackupUI(){
  if(document.getElementById("autoDailyBackupToggle")){
    autoDailyBackupToggle.checked=autoDailyBackupEnabled();
  }

  let latest=null;
  try{
    latest=await getLatestDailyBackup();
  }catch(e){
    console.error(e);
  }

  if(document.getElementById("lastDailyBackupText")){
    lastDailyBackupText.textContent=latest
      ? `${latest.backupForDate} • ${new Date(latest.exportedAt).toLocaleTimeString(lang==="ar"?"ar-OM":"en-GB",{hour:"2-digit",minute:"2-digit"})}`
      : tr("Not created yet","لم يتم إنشاؤها بعد");
  }

  const cloudSaved=localStorage.getItem(AUTO_BACKUP_CLOUD_SAVED_KEY)||"";
  const pending=!!(latest && latest.backupForDate!==cloudSaved);

  if(document.getElementById("dailyBackupNotice")){
    dailyBackupNotice.classList.toggle("hidden",!pending);
    if(pending && document.getElementById("dailyBackupNoticeText")){
      const dest=(localStorage.getItem("invoicepro_backup_destination")||"icloud")==="google"
        ?"Google Drive":"iCloud Drive";
      dailyBackupNoticeText.textContent=tr(
        `Daily backup ${latest.backupForDate} is ready. Save it to ${dest}.`,
        `نسخة ${latest.backupForDate} اليومية جاهزة. احفظها في ${dest}.`
      );
    }
  }

  if(document.getElementById("saveLatestDailyBackupBtn")){
    saveLatestDailyBackupBtn.disabled=!latest;
  }
}

async function shareLatestDailyBackup(){
  let snapshot=null;
  try{
    snapshot=await getLatestDailyBackup();
  }catch(e){
    console.error(e);
  }

  if(!snapshot){
    alert(tr(
      "No automatic daily backup has been created yet.",
      "لم يتم إنشاء نسخة احتياطية يومية تلقائية بعد."
    ));
    return;
  }

  const dest=localStorage.getItem("invoicepro_backup_destination")||"icloud";
  const suffix=dest==="google"?"GoogleDrive":"iCloudDrive";
  const fileName=`InvoicePro-Daily-${snapshot.backupForDate}-${suffix}.json`;
  const file=new File([JSON.stringify(snapshot,null,2)],fileName,{type:"application/json"});

  try{
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title:fileName});
      localStorage.setItem(AUTO_BACKUP_CLOUD_SAVED_KEY,snapshot.backupForDate);
      await refreshDailyBackupUI();
      return;
    }
  }catch(e){
    if(e && e.name==="AbortError") return;
    console.error(e);
  }

  const url=URL.createObjectURL(file);
  const a=document.createElement("a");
  a.href=url;
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);

  localStorage.setItem(AUTO_BACKUP_CLOUD_SAVED_KEY,snapshot.backupForDate);
  await refreshDailyBackupUI();
}

function initAutoDailyBackup(){
  if(localStorage.getItem(AUTO_BACKUP_ENABLED_KEY)===null){
    // The user requested automatic daily backup, so enable it by default.
    localStorage.setItem(AUTO_BACKUP_ENABLED_KEY,"1");
  }

  if(!localStorage.getItem(AUTO_BACKUP_DAY_KEY)){
    localStorage.setItem(AUTO_BACKUP_DAY_KEY,todayLocalISODate());
  }

  checkDailyBackup();

  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"){
      checkDailyBackup();
    }
  });
}

function selectBackupDestination(dest){
  const value=dest==="google"?"google":"icloud";
  if(document.getElementById("backupDestination")) backupDestination.value=value;
  localStorage.setItem("invoicepro_backup_destination",value);
  if(document.getElementById("backupICloudBtn")) backupICloudBtn.classList.toggle("active",value==="icloud");
  if(document.getElementById("backupGoogleBtn")) backupGoogleBtn.classList.toggle("active",value==="google");
  renderBackupDestinationHint();
  if(typeof refreshDailyBackupUI==="function") refreshDailyBackupUI();
}

function renderBackupDestinationHint(){
  if(!document.getElementById("backupDestinationHint")) return;
  const dest=(document.getElementById("backupDestination")?backupDestination.value:"icloud")||"icloud";
  backupDestinationHint.textContent=dest==="google"
    ? tr("When the share window opens, choose Google Drive, or Save to Files → Google Drive.","عند فتح نافذة المشاركة اختر Google Drive، أو حفظ في الملفات ← Google Drive.")
    : tr("When the share window opens, choose Save to Files → iCloud Drive.","عند فتح نافذة المشاركة اختر حفظ في الملفات ← iCloud Drive.");
}

function loadBackupDestination(){
  const saved=localStorage.getItem("invoicepro_backup_destination")||"icloud";
  selectBackupDestination(saved);
}

async function exportCloudBackup(){
  normalizeDB();
  saveDB();
  const dest=(document.getElementById("backupDestination")?backupDestination.value:"icloud")||"icloud";
  const payload={
    app:"Invoice Pro",
    version:"2026.09.09-CLOUDBACKUP",
    exportedAt:new Date().toISOString(),
    preferredCloud:dest,
    language:lang,
    data:db
  };
  const json=JSON.stringify(payload,null,2);
  const suffix=dest==="google"?"GoogleDrive":"iCloudDrive";
  const fileName=`InvoicePro-Backup-${todayLocalISODate()}-${suffix}.json`;
  const file=new File([json],fileName,{type:"application/json"});

  try{
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title:fileName});
      return;
    }
  }catch(e){
    if(e && e.name==="AbortError") return;
    console.error(e);
  }

  const url=URL.createObjectURL(file);
  const a=document.createElement("a");
  a.href=url;
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

async function exportBackup(){
  normalizeDB();
  saveDB();

  const payload={
    app:"Invoice Pro",
    version:"2026.09.09-CLOUDBACKUP",
    exportedAt:new Date().toISOString(),
    language:lang,
    data:db
  };
  const json=JSON.stringify(payload,null,2);
  const fileName="InvoicePro-Backup-"+todayLocalISODate()+".json";
  const file=new File([json],fileName,{type:"application/json"});

  try{
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:fileName});
      return;
    }
  }catch(e){
    if(e && e.name==="AbortError") return;
  }

  const url=URL.createObjectURL(file);
  const a=document.createElement("a");
  a.href=url;
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

function validateBackupData(data){
  return data && typeof data==="object" &&
    Array.isArray(data.invoices) &&
    Array.isArray(data.quotes) &&
    Array.isArray(data.customers) &&
    Array.isArray(data.products) &&
    Array.isArray(data.expenses);
}

function importBackupFile(event){
  const file=event.target.files&&event.target.files[0];
  if(!file) return;

  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const incoming=parsed.data||parsed;

      if(!validateBackupData(incoming)){
        throw new Error("Invalid backup");
      }

      if(!confirm(tr(
        "Restore this backup? Current local data will be replaced.",
        "هل تريد استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية."
      ))){
        event.target.value="";
        return;
      }

      db=incoming;
      if(parsed.language==="ar" || parsed.language==="en"){
        lang=parsed.language;
        localStorage.setItem("invoicepro_lang",lang);
      }
      normalizeDB();
      saveDB();
      localStorage.setItem(AUTO_BACKUP_DAY_KEY,todayLocalISODate());

      editingInvoiceIndex=null;
      editingQuoteIndex=null;
      editingCustomerIndex=null;
      editingPaymentId=null;
      statementCustomerIndex=null;
      previewDoc=null;

      setLang(lang);
      renderHome();
      populate();
      alert(tr("Backup restored successfully.","تمت استعادة النسخة الاحتياطية بنجاح."));
      show("home");
    }catch(e){
      console.error(e);
      alert(tr("This file is not a valid Invoice Pro backup.","هذا الملف ليس نسخة احتياطية صالحة للتطبيق."));
    }finally{
      event.target.value="";
    }
  };
  reader.readAsText(file);
}
