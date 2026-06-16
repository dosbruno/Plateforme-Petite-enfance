
function initResourcesFilter(){
  const b=document.querySelectorAll('.filter-btn'),i=document.querySelectorAll('#resourceList .resource');
  if(!b.length)return;
  b.forEach(x=>x.addEventListener('click',()=>{
    b.forEach(y=>y.classList.remove('active'));
    x.classList.add('active');
    const f=x.dataset.filter;
    i.forEach(it=>it.style.display=f==='all'||it.dataset.cat===f?'block':'none');
  }));
}

function initAuthorSearch(){
  const input=document.getElementById('authorSearch'),cards=document.querySelectorAll('.author-card');
  if(!input)return;
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    cards.forEach(c=>c.style.display=c.innerText.toLowerCase().includes(q)?'block':'none');
  });
}

let currentQuizKey=null;

const QUIZ_ADVICE = {
  reglementation: "Relire les repères réglementaires puis reprendre les questions liées au projet d’établissement, au RSAI et à la qualité d’accueil.",
  qualite2025: "Revenir sur les trois axes : relation à l’enfant, relation aux parents et qualité organisationnelle.",
  sante_securite: "Reprendre les réflexes du quotidien : hygiène, sécurité des espaces, repas, bruit et vigilance collective.",
  gestes_postures: "Observer une situation concrète de travail et chercher une petite amélioration d’organisation ou de matériel.",
  inclusion_pai: "Reprendre les notions d’accueil inclusif, de confidentialité, d’adaptation et de rôle du RSAI.",
  bientraitance: "Revenir sur les faits observables, les pratiques respectueuses et les circuits d’alerte prévus.",
  relation_familles: "Travailler les formulations de transmission : factuelles, courtes, utiles et respectueuses.",
  developpement: "Reprendre les besoins fondamentaux : sécurité affective, jeu, langage, rythme, émotions et exploration.",
  pedagogie: "Relier chaque auteur à une pratique concrète, sans transformer les références en recettes."
};

function initQuiz(){
  const menu=document.getElementById('quizMenu'),app=document.getElementById('quizApp');
  if(!menu||!app||typeof QUIZ_SETS==='undefined')return;
  menu.innerHTML=Object.entries(QUIZ_SETS).map(([key,quiz],idx)=>`
    <button class="quiz-choice ${idx===0?'active':''}" data-quiz="${key}">
      <strong>${quiz.title}</strong><br>
      <span class="small">${quiz.description}</span>
    </button>`).join('');
  menu.querySelectorAll('.quiz-choice').forEach(btn=>btn.addEventListener('click',()=>{
    menu.querySelectorAll('.quiz-choice').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderQuiz(btn.dataset.quiz);
  }));
  renderQuiz(Object.keys(QUIZ_SETS)[0]);
  updateLastQuizScore();
}

function renderQuiz(key){
  currentQuizKey=key;
  const quiz=QUIZ_SETS[key],app=document.getElementById('quizApp');
  app.innerHTML=`
    <h2>${quiz.title}</h2>
    <p class="small">${quiz.description}</p>
    <hr class="soft">
    <form id="currentQuizForm">
      ${quiz.questions.map((q,i)=>`
        <div class="quiz-question">
          <h3>Question ${i+1}</h3>
          <p>${q.question}</p>
          <div class="options">
            ${q.options.map((opt,j)=>`
              <label class="option"><input type="radio" name="q${i}" value="${j}"><span>${opt}</span></label>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button type="button" class="btn secondary" onclick="submitQuiz()">Valider et voir mon bilan</button>
      <button type="button" class="btn ghost" onclick="renderQuiz(currentQuizKey)">Réinitialiser</button>
    </form>
    <div id="quizResult" class="quiz-result"></div>`;
}

function getGlobalAdvice(percent, key){
  const specific = QUIZ_ADVICE[key] || "Relire la fiche associée et refaire le quiz après un temps d’échange.";
  if(percent>=90) return {
    title:"Excellent résultat",
    text:"Les repères sont très bien maîtrisés. Pour aller plus loin : utiliser ce quiz comme support d’échange avec l’équipe ou approfondir une situation concrète.",
    specific
  };
  if(percent>=70) return {
    title:"Bon socle",
    text:"Les bases sont solides. Les quelques erreurs peuvent servir de point de départ pour une discussion rapide ou une relecture ciblée.",
    specific
  };
  if(percent>=50) return {
    title:"À consolider",
    text:"Le thème est globalement compris, mais plusieurs repères méritent d’être repris tranquillement.",
    specific
  };
  return {
    title:"À reprendre en priorité",
    text:"Le résultat indique qu’une reprise du thème serait utile avant de refaire le quiz.",
    specific
  };
}

function submitQuiz(){
  const quiz=QUIZ_SETS[currentQuizKey],form=document.getElementById('currentQuizForm');
  let score=0,answered=0,correct=[],wrong=[];
  quiz.questions.forEach((q,i)=>{
    const s=form.querySelector(`input[name="q${i}"]:checked`);
    if(s){
      answered++;
      const v=Number(s.value),ok=v===q.answer;
      const item={i:i+1,q:q.question,selected:q.options[v],answer:q.options[q.answer],explanation:q.explanation};
      if(ok){score++;correct.push(item)}else{wrong.push(item)}
    } else {
      wrong.push({i:i+1,q:q.question,selected:'Pas de réponse',answer:q.options[q.answer],explanation:q.explanation});
    }
  });
  const r=document.getElementById('quizResult');
  r.style.display='block';
  if(answered<quiz.questions.length){
    r.innerHTML=`<h2>Quiz incomplet</h2><p>Tu as répondu à ${answered}/${quiz.questions.length} questions.</p>`;
    r.scrollIntoView({behavior:'smooth'});
    return;
  }
  const total=quiz.questions.length,pct=Math.round(score/total*100),advice=getGlobalAdvice(pct,currentQuizKey);
  const hist=JSON.parse(localStorage.getItem('pe_quiz_history')||'[]');
  hist.unshift({quiz:quiz.title,score,total,percent:pct,date:new Date().toLocaleDateString('fr-FR')});
  localStorage.setItem('pe_quiz_history',JSON.stringify(hist.slice(0,10)));

  const goodList = correct.length ? correct.map(c=>`<li>Question ${c.i} : ${c.q}</li>`).join('') : "<li>Aucune bonne réponse pour ce quiz.</li>";
  const wrongList = wrong.length ? wrong.map(c=>`
    <div class="correction-item">
      <p><strong>Question ${c.i} :</strong> ${c.q}</p>
      <p class="wrong">Ta réponse : ${c.selected}</p>
      <p class="correct">Bonne réponse : ${c.answer}</p>
      <p class="small">${c.explanation}</p>
    </div>`).join('') : "<p class='correct'>Aucune erreur : toutes les réponses sont justes.</p>";

  r.innerHTML=`
    <h2>Bilan du quiz</h2>
    <div class="grid">
      <div class="card span-4 flat"><h3>Note</h3><p style="font-size:34px;margin:0;color:var(--primary-dark);font-weight:800">${score}/${total}</p><p class="small">${pct} % de réussite</p></div>
      <div class="card span-4 flat"><h3>Bonnes réponses</h3><p style="font-size:34px;margin:0;color:#26764e;font-weight:800">${correct.length}</p><p class="small">repères acquis</p></div>
      <div class="card span-4 flat"><h3>À retravailler</h3><p style="font-size:34px;margin:0;color:#a33a49;font-weight:800">${wrong.length}</p><p class="small">points à revoir</p></div>
    </div>
    <div class="callout good"><h3>${advice.title}</h3><p>${advice.text}</p><p>${advice.specific}</p></div>
    <h3>Ce qui est acquis</h3>
    <ul>${goodList}</ul>
    <h3>Correction des erreurs</h3>
    ${wrongList}
    <button type="button" class="btn ghost" onclick="renderQuiz(currentQuizKey)">Refaire ce quiz</button>
  `;
  updateLastQuizScore();
  r.scrollIntoView({behavior:'smooth'});
}

function updateLastQuizScore(){
  const t=document.getElementById('lastQuizScore');
  if(!t)return;
  const h=JSON.parse(localStorage.getItem('pe_quiz_history')||'[]');
  t.innerHTML=h.length?`${h[0].quiz}<br><strong>${h[0].score}/${h[0].total}</strong> (${h[0].percent} %) — ${h[0].date}`:'Aucun quiz terminé sur cet appareil.';
}

function clearQuizHistory(){
  localStorage.removeItem('pe_quiz_history');
  updateLastQuizScore();
}

document.addEventListener('DOMContentLoaded',()=>{initResourcesFilter();initAuthorSearch();initQuiz()});
