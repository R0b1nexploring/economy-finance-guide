(() => {
  const storageKey='economic-atlas-v1', languageKey='economic-atlas-language-v1';
  let saved={},language='both';
  try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};const choice=localStorage.getItem(languageKey);if(['both','en','zh'].includes(choice))language=choice;}catch{}
  const explored=new Set(Array.isArray(saved.explored)?saved.explored:[]);
  const regionIds=['foundation-1','foundation-2','module-3','module-4','module-5','module-6','module-7'];
  for(const id of explored)if(!regionIds.includes(id))explored.delete(id);
  let dark=saved.dark===true;
  function store(){try{localStorage.setItem(storageKey,JSON.stringify({explored:[...explored],dark}));localStorage.setItem(languageKey,language);}catch{}}
  function pair(target,en,zh){
    const first=document.createElement('span'),second=document.createElement('span');
    first.className='bi-en';first.lang='en';first.textContent=en;
    second.className='bi-zh';second.lang='zh-CN';second.textContent=zh;
    target.replaceChildren(first,second);
  }
  function languageMode(){
    document.body.dataset.language=language;
    document.documentElement.lang=language==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-language-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.languageChoice===language)));
    reading();
  }
  document.querySelectorAll('[data-language-choice]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.languageChoice;languageMode();store();}));
  const themeButton=document.getElementById('theme-button');
  function theme(){document.body.classList.toggle('dark',dark);pair(themeButton,dark?'Light mode':'Dark mode',dark?'浅色模式':'深色模式');themeButton.setAttribute('aria-label',dark?'Switch to light appearance / 切换为浅色模式':'Switch to dark appearance / 切换为深色模式');}
  theme();themeButton.addEventListener('click',()=>{dark=!dark;theme();store();});
  document.getElementById('print-button').addEventListener('click',()=>window.print());
  function updateExploration(){
    pair(document.getElementById('explored-count'),`${explored.size} of 7 regions explored`,`已探索${explored.size}／7个区域`);
    document.getElementById('explored-fill').style.width=`${explored.size/7*100}%`;
    document.querySelectorAll('[data-explored]').forEach(button=>{const done=explored.has(button.dataset.explored);button.setAttribute('aria-pressed',String(done));pair(button,done?'Explored ✓ · click to unmark':'Mark this region as explored',done?'已探索 ✓ · 点击取消标记':'将本区域标记为已探索');});
    document.querySelectorAll('[data-nav-check]').forEach(node=>node.textContent=explored.has(node.dataset.navCheck)?'✓':'');
  }
  document.querySelectorAll('[data-explored]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.explored;explored.has(id)?explored.delete(id):explored.add(id);updateExploration();store();}));
  updateExploration();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===entry.target.id));},{rootMargin:'-8% 0px -68% 0px',threshold:0});
  document.querySelectorAll('.chapter,#home').forEach(section=>observer.observe(section));
  function reading(){const available=document.documentElement.scrollHeight-innerHeight;document.getElementById('reading-progress-fill').style.width=`${available>0?Math.min(100,Math.max(0,scrollY/available*100)):0}%`;}
  window.addEventListener('scroll',reading,{passive:true});window.addEventListener('resize',reading);languageMode();
  const currency=(n,decimals=0)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(n);
  const signedPercent=n=>`${n>0?'+':''}${n.toFixed(1)}%`;
  const stages=[
    {borrower:[10000,0,0],bank:[400000,100000,450000,50000],en:'Before borrowing, the borrower has CU 10,000 of assets and no debt. The bank holds CU 500,000 of assets, CU 450,000 of deposits, and CU 50,000 of equity.',zh:'借款之前，借款人有CU 10,000资产，没有债务。银行持有CU 500,000资产，对应CU 450,000存款负债和CU 50,000权益。'},
    {borrower:[60000,0,50000],bank:[450000,100000,500000,50000],en:'The loan creates CU 50,000 of deposits and an equal loan obligation. The borrower’s net worth stays CU 10,000; bank equity stays CU 50,000.',zh:'贷款创造了CU 50,000存款，同时形成等额贷款义务。借款人的净资产仍为CU 10,000，银行权益仍为CU 50,000。'},
    {borrower:[10000,50000,50000],bank:[450000,100000,500000,50000],en:'The borrower exchanges CU 50,000 of deposits for equipment. The supplier holds the deposit at the same bank, so total bank deposits stay unchanged. Equipment is booked at its purchase cost.',zh:'借款人用CU 50,000存款换得设备。供应商也在同一家银行持有存款，因此该银行的存款总额不变。设备按购入成本入账。'},
    {borrower:[0,50000,40000],bank:[440000,100000,490000,50000],en:'CU 10,000 of principal repayment reduces the borrower’s deposit and debt, and reduces the bank’s loan asset and deposit liability. Net worth stays unchanged in this simplified transaction.',zh:'偿还CU 10,000本金，同时减少借款人的存款和债务，也减少银行的贷款资产与存款负债。在这笔简化交易中，净资产保持不变。'}
  ];
  const rowTranslations={'Deposit asset':'存款资产','Equipment asset':'设备资产','Loan liability':'贷款负债','Net worth':'净资产','Loan assets':'贷款资产','Reserves / settlement funds':'准备金／结算资金','Deposit liabilities':'存款负债','Equity':'权益'};
  function values(id,rows){document.getElementById(id).replaceChildren(...rows.map(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');pair(dt,label,rowTranslations[label]);dd.textContent=`CU ${currency(value)}`;row.append(dt,dd);return row;}));}
  function loan(stage){const s=stages[stage];const [deposit,equipment,debt]=s.borrower;const [loans,reserves,deposits,equity]=s.bank;values('borrower-values',[['Deposit asset',deposit],['Equipment asset',equipment],['Loan liability',debt],['Net worth',deposit+equipment-debt]]);values('bank-values',[['Loan assets',loans],['Reserves / settlement funds',reserves],['Deposit liabilities',deposits],['Equity',equity]]);pair(document.getElementById('loan-note'),s.en,s.zh);document.querySelectorAll('[data-loan]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.loan)===stage)));}
  document.querySelectorAll('[data-loan]').forEach(button=>button.addEventListener('click',()=>loan(Number(button.dataset.loan))));loan(0);
  function fiscal(){
    const nums=['fiscal-revenue','fiscal-spending','fiscal-interest'].map(id=>{const input=document.getElementById(id);return input.value.trim()===''?NaN:Number(input.value);});const target=document.getElementById('fiscal-result');
    if(nums.some(n=>!Number.isFinite(n)||n<0||n>1000000)){pair(target,'Enter valid nonnegative amounts up to CU 1,000,000 million.','请输入0至1,000,000之间的有效数值，单位为百万CU。');return;}
    const [revenue,spending,interest]=nums,balance=spending-revenue,total=balance+interest;
    const en=n=>Math.abs(n)<1e-9?'Balanced':`${n>0?'Deficit':'Surplus'} of CU ${currency(Math.abs(n),1)} million`;
    const zh=n=>Math.abs(n)<1e-9?'收支平衡':`${n>0?'赤字':'盈余'}${currency(Math.abs(n),1)}百万CU`;
    pair(target,`Primary balance: ${en(balance)}. Overall balance: ${en(total)}.`,`初级收支：${zh(balance)}；总体收支：${zh(total)}。`);
  }
  ['fiscal-revenue','fiscal-spending','fiscal-interest'].forEach(id=>document.getElementById(id).addEventListener('input',fiscal));fiscal();
  function bond(){const y=Number(document.getElementById('bond-yield').value),price=1050/(1+y/100);document.getElementById('bond-yield-label').textContent=`${y.toFixed(1)}%`;document.getElementById('bond-price').textContent=`CU ${currency(price,2)}`;document.getElementById('bond-bar').style.width=`${price/1100*100}%`;pair(document.getElementById('bond-note'),`CU 1,050 ÷ ${currency(1+y/100,3)} = CU ${currency(price,2)}. The coupon stays CU 50. The bar uses CU 1,100 as a display scale, not a valuation target.`,`CU 1,050 ÷ ${currency(1+y/100,3)}＝CU ${currency(price,2)}。票息仍为CU 50。条形图以CU 1,100作为显示刻度，并非估值目标。`);}
  document.getElementById('bond-yield').addEventListener('input',bond);bond();
  function fx(){const r=Number(document.getElementById('fx-rate').value);document.getElementById('fx-rate-label').textContent=r.toFixed(2);document.getElementById('fx-cost').textContent=`LCU ${currency(1000*r)}`;const movement=(r/7-1)*100,inverse=(7/r-1)*100;pair(document.getElementById('fx-note'),`Compared with 7.00 LCU per US$1, invoice cost changes ${signedPercent(movement)}. One LCU’s dollar value changes ${signedPercent(inverse)}. Invoice costs and final retail prices can move differently.`,`与每US$1对应7.00 LCU相比，发票的当地货币成本变化${signedPercent(movement)}；每1 LCU的美元价值变化${signedPercent(inverse)}。发票成本与最终零售价格的变化可能不同。`);}
  document.getElementById('fx-rate').addEventListener('input',fx);fx();
  function leverage(){const shock=Number(document.getElementById('leverage-shock').value),assets=100*(1+shock/100),equity=assets-80;document.getElementById('leverage-label').textContent=`${shock>0?'+':''}${shock}%`;document.getElementById('leverage-asset').textContent=`CU ${currency(assets,0)}`;document.getElementById('leverage-equity').textContent=`CU ${currency(equity,0)}`;const en=equity<0?'Negative equity means assets are worth less than the debt. Contract terms and local law determine repayment and loss allocation.':equity===0?'The original equity is exhausted in this simplified balance sheet.':'Cash available for today’s payment is a separate question from asset value.';const zh=equity<0?'净资产为负，意味着资产价值低于债务。合同条款和当地法律决定偿还责任与损失分配。':equity===0?'在这张简化的资产负债表中，最初投入的权益已全部耗尽。':'能否拿出现金支付今天的账单，是与资产价值不同的问题。';pair(document.getElementById('leverage-note'),`Equity changes ${signedPercent((equity/20-1)*100)} while debt remains CU 80. ${en}`,`净资产变化${signedPercent((equity/20-1)*100)}，债务仍为CU 80。${zh}`);}
  document.getElementById('leverage-shock').addEventListener('input',leverage);leverage();
  const explanations={
    'module-3':'新增存款是一项资产，新增贷款是一项负债。支付能力发生了变化，净资产却不会自动增加。',
    'module-4':'现有合同条款、风险、需求和政策传导共同影响结果。应追踪机制，而不是直接跳到结论。',
    'module-5':'相同的未来支付被更大的折现因子除，因此当前价格下降，合同约定的票息保持不变。',
    'module-6':'每1美元需要更多当地货币：200×6＝1,200。本币相对美元走弱，但汇率向零售价格的传导程度仍可能不同。',
    'module-7':'两个通胀率都是正数。“通胀放缓”是物价上涨速度减慢；“通货紧缩”是总体物价水平下降。'
  };
  document.querySelectorAll('[data-quiz]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const selected=form.querySelector('input:checked'),feedback=form.querySelector('.quiz-feedback');if(!selected){pair(feedback,'Choose an answer first.','请先选择一个答案。');feedback.classList.add('error');return;}const correct=Number(selected.value)===Number(feedback.dataset.correct);feedback.classList.toggle('error',!correct);pair(feedback,`${correct?'Correct.':'Review the mechanism.'} ${feedback.dataset.explanation}`,`${correct?'回答正确。':'请再检查传导机制。'}${explanations[form.dataset.quiz]}`);}));
  let detailsBeforePrint=[];
  window.addEventListener('beforeprint',()=>{detailsBeforePrint=[...document.querySelectorAll('details')].map(d=>[d,d.open]);detailsBeforePrint.forEach(([d])=>d.open=true);});
  window.addEventListener('afterprint',()=>detailsBeforePrint.forEach(([d,wasOpen])=>d.open=wasOpen));
})();
