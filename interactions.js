(() => {
  const storageKey='economic-atlas-v1';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}
  const explored=new Set(Array.isArray(saved.explored)?saved.explored:[]);
  const regionIds=['foundation-1','foundation-2','module-3','module-4','module-5','module-6','module-7'];
  for(const id of explored) if(!regionIds.includes(id)) explored.delete(id);
  let dark=saved.dark===true;
  function store(){try{localStorage.setItem(storageKey,JSON.stringify({explored:[...explored],dark}));}catch{}}
  const themeButton=document.getElementById('theme-button');
  function theme(){document.body.classList.toggle('dark',dark);themeButton.textContent=dark?'Light mode':'Dark mode';themeButton.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} appearance`);}
  theme();themeButton.addEventListener('click',()=>{dark=!dark;theme();store();});
  const printButton=document.getElementById('print-button');
  printButton.addEventListener('click',()=>window.print());
  function updateExploration(){
    document.getElementById('explored-count').textContent=`${explored.size} of 7 regions explored`;
    document.getElementById('explored-fill').style.width=`${explored.size/7*100}%`;
    document.querySelectorAll('[data-explored]').forEach(button=>{const done=explored.has(button.dataset.explored);button.setAttribute('aria-pressed',String(done));button.textContent=done?'Explored ✓ · click to unmark':'Mark this region as explored';});
    document.querySelectorAll('[data-nav-check]').forEach(node=>node.textContent=explored.has(node.dataset.navCheck)?'✓':'');
  }
  document.querySelectorAll('[data-explored]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.explored;explored.has(id)?explored.delete(id):explored.add(id);updateExploration();store();}));
  updateExploration();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===entry.target.id));}}},{rootMargin:'-8% 0px -68% 0px',threshold:0});
  document.querySelectorAll('.chapter,#home').forEach(section=>observer.observe(section));
  function reading(){const available=document.documentElement.scrollHeight-innerHeight;document.getElementById('reading-progress-fill').style.width=`${available>0?Math.min(100,Math.max(0,scrollY/available*100)):0}%`;}
  window.addEventListener('scroll',reading,{passive:true});window.addEventListener('resize',reading);reading();
  const currency=(n,decimals=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(n);
  const signedPercent=n=>`${n>0?'+':''}${n.toFixed(1)}%`;
  const stages=[
    {borrower:[10000,0,0],bank:[400000,100000,450000,50000],note:'Before borrowing, the borrower has CU 10,000 of assets and no debt. The bank holds CU 500,000 of assets, CU 450,000 of deposits, and CU 50,000 of equity.'},
    {borrower:[60000,0,50000],bank:[450000,100000,500000,50000],note:'The loan creates CU 50,000 of deposits and an equal loan obligation. The borrower’s net worth stays CU 10,000; bank equity stays CU 50,000.'},
    {borrower:[10000,50000,50000],bank:[450000,100000,500000,50000],note:'The borrower exchanges CU 50,000 of deposits for equipment. The supplier holds the deposit at the same bank, so total bank deposits stay unchanged. Equipment is booked at its purchase cost.'},
    {borrower:[0,50000,40000],bank:[440000,100000,490000,50000],note:'CU 10,000 of principal repayment reduces the borrower’s deposit and debt, and reduces the bank’s loan asset and deposit liability. Net worth stays unchanged in this simplified transaction.'}
  ];
  function values(id,rows){document.getElementById(id).replaceChildren(...rows.map(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=`CU ${currency(value)}`;row.append(dt,dd);return row;}));}
  function loan(stage){const s=stages[stage];const [deposit,equipment,debt]=s.borrower;const [loans,reserves,deposits,equity]=s.bank;values('borrower-values',[['Deposit asset',deposit],['Equipment asset',equipment],['Loan liability',debt],['Net worth',deposit+equipment-debt]]);values('bank-values',[['Loan assets',loans],['Reserves / settlement funds',reserves],['Deposit liabilities',deposits],['Equity',equity]]);document.getElementById('loan-note').textContent=s.note;document.querySelectorAll('[data-loan]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.loan)===stage)));}
  document.querySelectorAll('[data-loan]').forEach(button=>button.addEventListener('click',()=>loan(Number(button.dataset.loan))));loan(0);
  function fiscal(){const ids=['fiscal-revenue','fiscal-spending','fiscal-interest'];const nums=ids.map(id=>{const input=document.getElementById(id);return input.value.trim()===''?NaN:Number(input.value);});const target=document.getElementById('fiscal-result');if(nums.some(n=>!Number.isFinite(n)||n<0||n>1000000)){target.textContent='Enter valid nonnegative amounts up to CU 1,000,000 million.';return;}const [revenue,spending,interest]=nums;const balance=spending-revenue;const total=balance+interest;const describe=(n)=>Math.abs(n)<1e-9?'Balanced':`${n>0?'Deficit':'Surplus'} of CU ${currency(Math.abs(n),1)} million`;target.textContent=`Primary balance: ${describe(balance)}. Overall balance: ${describe(total)}.`;}
  ['fiscal-revenue','fiscal-spending','fiscal-interest'].forEach(id=>document.getElementById(id).addEventListener('input',fiscal));fiscal();
  function bond(){const y=Number(document.getElementById('bond-yield').value);const price=1050/(1+y/100);document.getElementById('bond-yield-label').textContent=`${y.toFixed(1)}%`;document.getElementById('bond-price').textContent=`CU ${currency(price,2)}`;document.getElementById('bond-bar').style.width=`${price/1100*100}%`;document.getElementById('bond-note').textContent=`CU 1,050 ÷ ${currency(1+y/100,3)} = CU ${currency(price,2)}. The coupon stays CU 50. The bar uses CU 1,100 as a display scale, not a valuation target.`;}
  document.getElementById('bond-yield').addEventListener('input',bond);bond();
  function fx(){const r=Number(document.getElementById('fx-rate').value);document.getElementById('fx-rate-label').textContent=r.toFixed(2);document.getElementById('fx-cost').textContent=`LCU ${currency(1000*r)}`;const movement=(r/7-1)*100;const inverse=(7/r-1)*100;document.getElementById('fx-note').textContent=`Compared with 7.00 LCU per US$1, invoice cost changes ${signedPercent(movement)}. One LCU’s dollar value changes ${signedPercent(inverse)}. Invoice costs and final retail prices can move differently.`;}
  document.getElementById('fx-rate').addEventListener('input',fx);fx();
  function leverage(){const shock=Number(document.getElementById('leverage-shock').value);const assets=100*(1+shock/100);const equity=assets-80;document.getElementById('leverage-label').textContent=`${shock>0?'+':''}${shock}%`;document.getElementById('leverage-asset').textContent=`CU ${currency(assets,0)}`;document.getElementById('leverage-equity').textContent=`CU ${currency(equity,0)}`;document.getElementById('leverage-note').textContent=`Equity changes ${signedPercent((equity/20-1)*100)} while debt remains CU 80. ${equity<0?'Negative equity means assets are worth less than the debt. Contract terms and local law determine repayment and loss allocation.':equity===0?'The original equity is exhausted in this simplified balance sheet.':'Cash available for today’s payment is a separate question from asset value.'}`;}
  document.getElementById('leverage-shock').addEventListener('input',leverage);leverage();
  document.querySelectorAll('[data-quiz]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const selected=form.querySelector('input:checked');const feedback=form.querySelector('.quiz-feedback');if(!selected){feedback.textContent='Choose an answer first.';feedback.classList.add('error');return;}const correct=Number(selected.value)===Number(feedback.dataset.correct);feedback.classList.toggle('error',!correct);feedback.textContent=`${correct?'Correct.':'Review the mechanism.'} ${feedback.dataset.explanation}`;}));
  let detailsBeforePrint=[];
  window.addEventListener('beforeprint',()=>{detailsBeforePrint=[...document.querySelectorAll('details')].map(d=>[d,d.open]);detailsBeforePrint.forEach(([d])=>d.open=true);});
  window.addEventListener('afterprint',()=>detailsBeforePrint.forEach(([d,wasOpen])=>d.open=wasOpen));
})();
