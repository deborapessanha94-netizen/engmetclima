const app = document.querySelector('#app');
const USER_KEY = 'engmetclima-pwa-user';
const ACCOUNT_KEY = 'engmetclima-pwa-account';
const LAST_EMAIL_KEY = 'engmetclima-pwa-last-email';
const FAVORITES_KEY = 'engmetclima-pwa-favorites';
const SETTINGS_KEY = 'engmetclima-pwa-settings';
const DISASTER_COUNTRY_KEY = 'engmetclima-pwa-disaster-countries';
const COUNTRY_CODES = 'AF,AL,DZ,AD,AO,AG,AR,AM,AU,AT,AZ,BS,BH,BD,BB,BY,BE,BZ,BJ,BT,BO,BA,BW,BR,BN,BG,BF,BI,CV,KH,CM,CA,CF,TD,CL,CN,CY,CO,KM,CG,CD,CR,CI,HR,CU,CZ,DK,DJ,DM,DO,EC,EG,SV,GQ,ER,EE,SZ,ET,FJ,FI,FR,GA,GM,GE,DE,GH,GR,GD,GT,GN,GW,GY,HT,HN,HU,IS,IN,ID,IR,IQ,IE,IL,IT,JM,JP,JO,KZ,KE,KI,KW,KG,LA,LV,LB,LS,LR,LY,LI,LT,LU,MG,MW,MY,MV,ML,MT,MH,MR,MU,MX,FM,MD,MC,MN,ME,MA,MZ,MM,NA,NR,NP,NL,NZ,NI,NE,NG,KP,MK,NO,OM,PK,PW,PA,PG,PY,PE,PH,PL,PT,QA,RO,RU,RW,KN,LC,VC,WS,SM,ST,SA,SN,RS,SC,SL,SG,SK,SI,SB,SO,ZA,KR,SS,ES,LK,SD,SR,SE,CH,SY,TJ,TZ,TH,TL,TG,TO,TT,TN,TR,TM,TV,UG,UA,AE,GB,US,UY,UZ,VU,VA,VE,VN,YE,ZM,ZW,PS'.split(',');
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(USER_KEY)) void requestCurrentLocation();
});
const LOCATIONS = [
  { id:'rio-das-ostras', name:'Rio das Ostras', latitude:-22.523, longitude:-41.946, marine:true },
  { id:'macae', name:'Macaé', latitude:-22.371, longitude:-41.786, marine:true },
  { id:'imbarie', name:'Imbariê', latitude:-22.753, longitude:-43.454 },
  { id:'santo-aleixo', name:'Santo Aleixo', latitude:-22.663, longitude:-43.021 },
  { id:'rio', name:'Rio de Janeiro', latitude:-22.906, longitude:-43.173, marine:true }
];
const TIDE_STATIONS = [
  {name:'Terminal de Imbetiba', city:'Macaé, RJ', latitude:-22.378, longitude:-41.778, tableFile:'39 - TERMINAL MARÍTIMO DE IMBETIBA - 127 - 129.pdf'},
  {name:'Porto do Forno', city:'Arraial do Cabo, RJ', latitude:-22.966, longitude:-42.027, tableFile:'42 - PORTO DO FORNO - 136 - 138.pdf'},
  {name:'Ilha Fiscal', city:'Rio de Janeiro, RJ', latitude:-22.897, longitude:-43.177, tableFile:'40 - PORTO DO RIO DE JANEIRO - I FISCAL - 130 - 132.pdf'},
  {name:'Ponta da Armação', city:'Niterói, RJ', latitude:-22.904, longitude:-43.118},
  {name:'Angra dos Reis', city:'Angra dos Reis, RJ', latitude:-23.006, longitude:-44.318},
  {name:'Porto de Vitória', city:'Vitória, ES', latitude:-20.319, longitude:-40.333},
  {name:'Porto de Santos', city:'Santos, SP', latitude:-23.996, longitude:-46.314},
  {name:'Porto de Paranaguá', city:'Paranaguá, PR', latitude:-25.510, longitude:-48.523},
  {name:'Porto de Itajaí', city:'Itajaí, SC', latitude:-26.904, longitude:-48.651},
  {name:'Porto de Rio Grande', city:'Rio Grande, RS', latitude:-32.030, longitude:-52.105},
  {name:'Porto de Salvador', city:'Salvador, BA', latitude:-12.973, longitude:-38.516},
  {name:'Porto de Recife', city:'Recife, PE', latitude:-8.055, longitude:-34.872},
  {name:'Porto de Fortaleza', city:'Fortaleza, CE', latitude:-3.721, longitude:-38.521},
  {name:'Porto de Belém', city:'Belém, PA', latitude:-1.450, longitude:-48.504},
  {name:'Porto de Manaus', city:'Manaus, AM', latitude:-3.134, longitude:-60.021}
];
const TABS = [['inicio','⌂','Início'],['tempo','☁︎','Tempo'],['guia','?','Guia'],['oportunidades','⌑','Vagas'],['oceano','◉','Oceano'],['raios','ϟ','Raios'],['terra','◉','Terra'],['ciclones','↻','Ciclones'],['desastres','♨︎','Riscos'],['clima','✦','Clima'],['globo','◎','Globo'],['favoritos','☆','Favoritos'],['alertas','⚠︎','Alertas'],['lua','☾','Lua'],['configuracoes','⚙︎','Ajustes']];
let active='inicio', selected=LOCATIONS[0], weather, air, quakes=[], quakesLoaded=false, marine, disasters=[], brazilDisasters=[], brazilDisasterUpdatedAt='', cyclones=[], painelCyclones=[], locationMessage='', officialTide=null, maritimeWarnings=[], warningsStatus='', disasterCountryFilter='', ensoMode='el-nino', climateMonitors=[], climateUpdatedAt='', climateLoading=false, cycloneUpdatedAt='', cycloneStatus='Consultando centros meteorológicos.', favoriteWeather={}, favoriteWeatherLoading=false, globePaused=false, globeSelectedEvent=null, globeEngine=null, updateAlarmTimer=null;
const PAINEL_GLOBAL_CYCLONES_URL='https://www.painelglobal.com.br/furacoes.php?versao=classica';
const DEFAULT_SETTINGS={alertsRain:true,alertsWind:true,alertsThunder:true,alertsSea:true,alertsEarthquake:true,updateInterval:'ao abrir',updateAlarm:false,wifiOnly:false,temperatureUnit:'°C',windUnit:'km/h',rainUnit:'mm',pressureUnit:'hPa',waveUnit:'m',distanceUnit:'km',timeFormat:'24 horas',globeStyle:'científico',theme:'escuro',highContrast:false,reduceMotion:false};
let atlasRows=[], atlasColumns=[], atlasStatus='A base oficial ainda não foi carregada neste navegador.', atlasFilters={uf:'',year:'',city:'',type:''};
const ATLAS_CSV_URL='https://atlasdigital.mdr.gov.br/arquivos/BD_Atlas_1991_2025_v1.0_2026.04.23_Consolidado.csv';
const ENSO_OFFICIAL = {
  status:'Aviso de El Niño',
  issued:'09/07/2026',
  nino34:'+1,2 °C',
  outlook:'97% de chance de persistir até o início da primavera de 2027',
  source:'NOAA / Centro de Previsão Climática'
};
const CLIMATE_MONITORS = [
  {name:'Manaus — AM', region:'Norte', latitude:-3.119, longitude:-60.021},
  {name:'Salvador — BA', region:'Nordeste', latitude:-12.977, longitude:-38.501},
  {name:'Rio de Janeiro — RJ', region:'Sudeste', latitude:-22.907, longitude:-43.173},
  {name:'Porto Alegre — RS', region:'Sul', latitude:-30.034, longitude:-51.230}
];
const escape = x => String(x ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt = x => Number.isFinite(Number(x)) ? Math.round(Number(x)) : '—';
const nowTime = () => new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const status = code => code === 0 ? 'Céu limpo' : code <= 3 ? 'Parcialmente nublado' : code < 80 ? 'Possibilidade de chuva' : 'Tempo instável';
const card = (title,value,detail='') => `<article class="card"><p class="card-title">${title}</p><p class="card-value">${value}</p><p class="card-detail">${detail}</p></article>`;
const chips = () => `<div class="chips">${LOCATIONS.map(x=>`<button class="chip ${x.id===selected.id?'selected':''}" data-location="${x.id}">${x.name}</button>`).join('')}</div>`;
const windDirection = degrees => ['N','NE','L','SE','S','SO','O','NO'][Math.round((Number(degrees)%360)/45)%8] || '—';
const todayValue = (field, fallback='—') => weather?.daily?.[field]?.[0] ?? fallback;
const maxNext24 = field => Math.max(...(weather?.hourly?.[field]?.slice(0,24).map(Number).filter(Number.isFinite) || [0]));
function thunderRisk(){ const cape=maxNext24('cape'), rain=maxNext24('precipitation_probability'), code=weather?.current?.weather_code; if(code>=95 || (cape>=1200&&rain>=50)) return 'Alto'; if(cape>=500&&rain>=30) return 'Possível'; return 'Baixo'; }
function ozoneImpact(value){ const ozone=Number(value); if(!Number.isFinite(ozone)) return 'sem leitura'; if(ozone<100) return 'baixo risco'; if(ozone<160) return 'atenção para pessoas sensíveis'; return 'pode prejudicar a saúde'; }
function fireRisk(){ if(!weather) return 'Carregando…'; const humidity=Number(weather.current.relative_humidity_2m), wind=Number(weather.current.wind_speed_10m), rain=Number(todayValue('precipitation_sum',0)); if(humidity<=25&&wind>=25&&rain<2) return 'Alto (estimativa)'; if(humidity<=40&&rain<5) return 'Moderado (estimativa)'; return 'Baixo (estimativa)'; }
function droughtSignal(){ if(!weather) return 'Carregando…'; const rain=(weather.daily?.precipitation_sum||[]).slice(0,7).reduce((sum,value)=>sum+Number(value||0),0); return rain<10?'Semana com pouca chuva prevista':'Há chuva prevista na próxima semana'; }
function fireRiskDetail(){
  if(!weather) return {level:'green',title:'Consultando risco de fogo',detail:'Carregando temperatura, umidade, vento e chuva prevista.'};
  const temperature=Number(todayValue('temperature_2m_max',0)), humidity=Number(weather.current.relative_humidity_2m), wind=Number(weather.current.wind_speed_10m), rain=Number(todayValue('precipitation_sum',0));
  if(temperature>30&&humidity<30&&wind>15) return {level:'red',title:'Risco alto de propagação de fogo',detail:`Máx. ${fmt(temperature)}°C, umidade ${fmt(humidity)}% e vento ${fmt(wind)} km/h: combinação crítica na triagem meteorológica.`};
  if(temperature>30&&humidity<30) return {level:'orange',title:'Risco elevado de propagação de fogo',detail:`Máx. ${fmt(temperature)}°C e umidade ${fmt(humidity)}%. O vento atual é ${fmt(wind)} km/h.`};
  return {level:'green',title:'Risco meteorológico baixo de propagação',detail:`Máx. ${fmt(temperature)}°C · umidade ${fmt(humidity)}% · vento ${fmt(wind)} km/h · chuva prevista ${fmt(rain)} mm.`};
}
function landslideRiskDetail(){
  if(!weather) return {level:'green',title:'Consultando risco de deslizamento',detail:'Carregando chuva e condição de tempo da localidade.'};
  const rain=Number(todayValue('precipitation_sum',0)), chance=Number(todayValue('precipitation_probability_max',0)), thunder=thunderRisk();
  if(rain>=50||(rain>=30&&thunder==='Alto')) return {level:'red',title:'Atenção para risco associado à chuva',detail:`Previsão de ${fmt(rain)} mm e ${fmt(chance)}% de chuva. Em encostas, áreas de corte, solo encharcado ou locais vulneráveis, acompanhe os alertas oficiais.`};
  if(rain>=20||chance>=70) return {level:'orange',title:'Risco meteorológico moderado',detail:`Previsão de ${fmt(rain)} mm e ${fmt(chance)}% de chuva. O risco real depende do relevo, solo, drenagem e ocupação local.`};
  return {level:'green',title:'Sem sinal meteorológico forte nesta previsão',detail:`Previsão de ${fmt(rain)} mm e ${fmt(chance)}% de chuva. Isto não substitui o índice local do GeoRisk.`};
}
function droughtRiskDetail(){
  if(!weather) return {level:'green',title:'Consultando risco de seca',detail:'Carregando a previsão semanal de chuva.'};
  const rain=(weather.daily?.precipitation_sum||[]).slice(0,7).reduce((sum,value)=>sum+Number(value||0),0);
  if(rain<5) return {level:'orange',title:'Semana muito seca prevista',detail:`A previsão soma ${fmt(rain)} mm nos próximos 7 dias. Para monitoramento de seca, é preciso considerar também a chuva observada e a umidade do solo.`};
  if(rain<15) return {level:'orange',title:'Pouca chuva prevista',detail:`A previsão soma ${fmt(rain)} mm nos próximos 7 dias. Acompanhe o painel Alerta Secas para a avaliação territorial.`};
  return {level:'green',title:'Há chuva prevista na semana',detail:`A previsão soma ${fmt(rain)} mm nos próximos 7 dias. Isso não determina, isoladamente, a condição de seca.`};
}
function geohydrologicalRiskDetail(){
  if(!weather) return {level:'green',title:'Consultando risco geo-hidrológico',detail:'Carregando a previsão local.'};
  const rain=Number(todayValue('precipitation_sum',0)), gust=Number(todayValue('wind_gusts_10m_max',0)), thunder=thunderRisk();
  if(rain>=50||thunder==='Alto') return {level:'red',title:'Atenção: condição favorável a impactos',detail:`Chuva prevista ${fmt(rain)} mm, trovoadas ${thunder.toLowerCase()} e rajadas até ${fmt(gust)} km/h. Consulte imediatamente os alertas oficiais.`};
  if(rain>=20||gust>=50||thunder==='Possível') return {level:'orange',title:'Condição de atenção meteorológica',detail:`Chuva prevista ${fmt(rain)} mm, trovoadas ${thunder.toLowerCase()} e rajadas até ${fmt(gust)} km/h.`};
  return {level:'green',title:'Sem condição crítica identificada',detail:`Chuva prevista ${fmt(rain)} mm e rajadas até ${fmt(gust)} km/h. Acompanhe mudanças rápidas do tempo.`};
}
function extremeForecast(){ if(!weather) return 'Carregando…'; const max=Math.max(...(weather.daily.temperature_2m_max||[])), gust=Math.max(...(weather.daily.wind_gusts_10m_max||[])), rain=Math.max(...(weather.daily.precipitation_sum||[])); const notes=[]; if(max>=35)notes.push(`calor até ${fmt(max)}°C`); if(gust>=60)notes.push(`rajadas até ${fmt(gust)} km/h`); if(rain>=50)notes.push(`chuva diária até ${fmt(rain)} mm`); return notes.length?notes.join(' · '):'Nenhum extremo automático nos próximos 7 dias'; }
function weatherAlerts(){ if(!weather||!air) return [{level:'green',title:'Carregando alertas',detail:'Consultando os dados da localidade.'}]; const alerts=[]; const rain=Number(todayValue('precipitation_sum',0)), gust=Number(todayValue('wind_gusts_10m_max',0)), uv=Number(todayValue('uv_index_max',0)); if(gust>=50) alerts.push({level:'orange',title:'Rajadas fortes',detail:`Rajadas previstas de até ${fmt(gust)} km/h.`}); if(rain>=40) alerts.push({level:'orange',title:'Chuva intensa',detail:`Acumulado diário previsto de ${fmt(rain)} mm.`}); if(thunderRisk()==='Alto') alerts.push({level:'orange',title:'Trovoadas',detail:'Ambiente favorável a trovoadas; acompanhe o radar e avisos oficiais.'}); if(Number(weather.current.relative_humidity_2m)<=30) alerts.push({level:'orange',title:'Baixa umidade',detail:`Umidade relativa de ${fmt(weather.current.relative_humidity_2m)}%.`}); if(uv>=8) alerts.push({level:'orange',title:'Índice UV alto',detail:`UV máximo previsto: ${fmt(uv)}.`}); if(Number(air.current.european_aqi)>=80) alerts.push({level:'orange',title:'Qualidade do ar',detail:`AQI ${fmt(air.current.european_aqi)} requer atenção.`}); return alerts.length?alerts:[{level:'green',title:'Sem alerta automático relevante',detail:'A triagem educativa não substitui alertas do INMET e da Defesa Civil.'}]; }
function distanceKm(a,b){ const radius=6371, toRad=value=>value*Math.PI/180, dLat=toRad(b.latitude-a.latitude), dLon=toRad(b.longitude-a.longitude); const h=Math.sin(dLat/2)**2+Math.cos(toRad(a.latitude))*Math.cos(toRad(b.latitude))*Math.sin(dLon/2)**2; return 2*radius*Math.asin(Math.sqrt(h)); }
function nearestTideStation(){ if(!Number.isFinite(selected?.latitude)||!Number.isFinite(selected?.longitude)) return null; const here={latitude:selected.latitude,longitude:selected.longitude}; const nearest=TIDE_STATIONS.map(station=>({...station,distance:distanceKm(here,station)})).sort((a,b)=>a.distance-b.distance)[0]; return nearest?.distance<=350?nearest:null; }
function tideReference(){ const station=nearestTideStation(); return station ? card('Estação de maré mais próxima',`${station.name} · ${station.city}`,`Aproximadamente ${Math.round(station.distance)} km da localidade escolhida. Confira a tábua oficial desta estação antes de usar em navegação.`) : card('Estação de maré mais próxima','Sem estação de referência na base atual','A localidade está fora da área de cobertura cadastrada. Consulte a publicação oficial da Marinha ou a autoridade marítima local.'); }
const MARINHA_TIDES_PAGE='https://www.marinha.mil.br/chm/tabuas-de-mare-6';
const MARINHA_WARNINGS_PAGE='https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo';
const OFFICIAL_TIDE_CACHE={
  '2026-07-31|Terminal de Imbetiba':[
    {time:'03:32',height:'1.33'}, {time:'10:12',height:'0.01'}, {time:'16:12',height:'1.28'}, {time:'22:21',height:'0.34'}
  ]
};
const OFFICIAL_WARNING_CACHE={
  '2026-07-31':[
    {title:'Vento forte',detail:'Área costeira entre Maricá/RJ e Armação dos Búzios/RJ até 60 MN da costa. Vento E/NE força 7. Vigência até 02/08 às 12:00Z.'},
    {title:'Vento forte/duro',detail:'Área costeira entre Chuí/RS e Laguna/SC até 300 MN da costa. Vento NE/NW força 7, com rajadas força 8/9. Vigência até 02/08 às 12:00Z.'},
    {title:'Mar grosso/muito grosso',detail:'Área oceânica do Atlântico Sul. Ondas de NE/NW entre 3,0 e 5,0 metros. Vigência até 02/08 às 12:00Z.'},
    {title:'Vento forte/muito forte',detail:'Área oceânica entre 31S043W, 29S049W, 23S042W e 28S040W. Vento NE/NW força 7, com rajadas força 8. Vigência até 02/08 às 21:00Z.'}
  ]
};
function marinhaPdfUrl(file){ return `https://www.marinha.mil.br/chm/sites/www.marinha.mil.br.chm/files/dados_de_mare/${encodeURIComponent(file)}`; }
function monthName(index){ return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][index]; }
function tideCache(station){ const now=new Date(); const key=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}|${station?.name}`; const entries=OFFICIAL_TIDE_CACHE[key]; return entries?{station:station.name,date:now.toLocaleDateString('pt-BR'),entries,message:''}:null; }
function warningCache(){ const now=new Date(); return OFFICIAL_WARNING_CACHE[`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`]||[]; }
function tideTodayCard(){
  const station=nearestTideStation();
  if(!station) return card('Tábua de marés de hoje','Estação não disponível','Escolha uma localidade brasileira próxima à costa para consultar uma estação de referência.');
  if(officialTide?.station!==station.name) return card('Tábua de marés de hoje','Consultando a Marinha…',`Buscando a tábua oficial de ${station.name}.`);
  if(!officialTide.entries?.length) return card('Tábua de marés de hoje','Não disponível agora',officialTide.message || `Abra a tábua oficial de ${station.name} para conferir os horários.`);
  return card(`Tábua de marés · ${officialTide.date}`,station.name,officialTide.entries.map(item=>`${item.time} · ${item.height} m`).join('  |  '));
}
async function readTidePdf(station){
  const cached=tideCache(station);
  if(cached) return cached;
  if(!station?.tableFile || !globalThis.pdfjsLib) return {station:station?.name,entries:[],message:'A leitura automática desta estação ainda não está disponível. Use a publicação oficial.'};
  const pdf=await pdfjsLib.getDocument({url:marinhaPdfUrl(station.tableFile),disableWorker:true}).promise;
  let text='';
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber+=1){ const page=await pdf.getPage(pageNumber); const content=await page.getTextContent(); text+=`\n${content.items.map(item=>item.str).join('\n')}`; }
  const now=new Date(), month=monthName(now.getMonth()), nextMonth=monthName((now.getMonth()+1)%12), monthStart=text.indexOf(month);
  const section=monthStart>=0?text.slice(monthStart,text.indexOf(nextMonth,monthStart+month.length)>monthStart?text.indexOf(nextMonth,monthStart+month.length):undefined):text;
  const day=String(now.getDate()).padStart(2,'0');
  const match=section.match(new RegExp(`(?:^|\\n)0?${day}\\s+[^\\n]+((?:\\s+\\d{4}\\s+-?\\d+(?:[.,]\\d+)?) {2,4})`));
  const values=match?.[1] ? [...match[1].matchAll(/(\d{4})\s+(-?\d+(?:[.,]\d+)?)/g)].map(([,time,height])=>({time:`${time.slice(0,2)}:${time.slice(2)}`,height:Number(height.replace(',','.')).toFixed(2)})) : [];
  return values.length?{station:station.name,date:now.toLocaleDateString('pt-BR'),entries:values,message:''}:{station:station.name,entries:[],message:'Não foi possível interpretar os horários da tábua hoje. Confira a publicação oficial.'};
}
function parseMaritimeWarnings(markup){
  const text=new DOMParser().parseFromString(markup,'text/html').body.textContent.replace(/\s+/g,' ').trim();
  const blocks=text.split(/(?=ÁREA\s+(?:ALFA|BRAVO|CHARLIE|DELTA|SUL OCEÂNICA).*?AVISO NR)/g).filter(block=>/AVISO DE/i.test(block));
  return blocks.slice(0,8).map(block=>{
    const title=(block.match(/AVISO DE\s+([A-ZÁÀÂÃÇÉÊÍÓÔÕÚ\s/]+)/i)?.[1]||'Aviso marítimo').trim();
    return {title,detail:block.slice(0,360)};
  });
}
async function fetchMaritimeWarnings(){
  const sources=[MARINHA_WARNINGS_PAGE,`https://api.allorigins.win/raw?url=${encodeURIComponent(MARINHA_WARNINGS_PAGE)}`];
  let lastError;
  for(const source of sources){ try{ const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000); const response=await fetch(source,{signal:controller.signal}); clearTimeout(timer); if(!response.ok) throw new Error('Resposta indisponível'); const markup=await response.text(); if(markup.length>200) return markup; }catch(error){ lastError=error; } }
  throw lastError||new Error('Avisos indisponíveis');
}
async function loadOfficialMarine(){
  const station=nearestTideStation();
  officialTide=null;
  warningsStatus='Consultando avisos da Marinha…';
  const [tideResult,warningsResult]=await Promise.allSettled([
    readTidePdf(station),
    fetchMaritimeWarnings()
  ]);
  officialTide=tideResult.status==='fulfilled'?tideResult.value:(tideCache(station)||{station:station?.name,entries:[],message:'A tábua oficial não pôde ser carregada agora.'});
  if(warningsResult.status==='fulfilled') { maritimeWarnings=parseMaritimeWarnings(warningsResult.value); warningsStatus=maritimeWarnings.length?'Atualizado pela Marinha. Horários dos avisos em UTC (Zulu).':'Nenhum aviso marítimo identificado no boletim atual.'; }
  else { maritimeWarnings=warningCache(); warningsStatus=maritimeWarnings.length?'Boletim oficial recente da Marinha disponível; tente atualizar para consultar a página ao vivo.':'Não foi possível consultar os avisos agora. Abra a página oficial da Marinha.'; }
}
function nav(){ return `<nav class="bottom-nav">${TABS.map(([id,icon,label])=>`<button class="nav-item ${active===id?'active':''}" data-tab="${id}" aria-label="${label}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>`; }
function head(title='Engmetclima',subtitle='Atmosfera, Oceano e Terra em tempo real'){ const locationButton=active==='inicio'?'<button class="refresh" id="use-location" title="Usar minha localização">⌖</button>':''; return `<header class="header"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="header-actions">${locationButton}<button class="refresh" id="refresh" title="Atualizar dados">↻</button></div></header>`; }
async function requestCurrentLocation(){
  if(!navigator.geolocation){ locationMessage='Este navegador não oferece localização.'; render(); return; }
  locationMessage='Solicitando acesso à sua localização…';
  render();
  navigator.geolocation.getCurrentPosition(async position=>{
    selected={id:'current-location',name:'Sua localização',latitude:position.coords.latitude,longitude:position.coords.longitude,marine:true};
    locationMessage='Localização atualizada. Carregando as condições locais…';
    render();
    await loadAll();
  },error=>{
    locationMessage=error.code===1?'Permissão de localização negada. Autorize o navegador e tente novamente.':'Não foi possível obter a localização agora. Verifique o GPS e tente novamente.';
    render();
  }, {enableHighAccuracy:true,timeout:10000,maximumAge:300000});
}
function home(){ const strongest=quakes[0]; return `${head()}<section class="stack">${locationMessage?`<p class="location-status">${locationMessage}</p>`:''}${card(selected.name,weather?`${fmt(weather.current.temperature_2m)}°C`:'Carregando…',weather?`${status(weather.current.weather_code)} · Sensação ${fmt(weather.current.apparent_temperature)}°C`:'Consultando previsão')}${card('Qualidade do ar',air?`AQI ${fmt(air.current.european_aqi)}`:'Carregando…',air?`PM2,5 ${air.current.pm2_5} µg/m³ · Ozônio ${air.current.ozone} µg/m³ · AQI mede a qualidade do ar: quanto menor, melhor.`:'Consultando ar')}${card('Boletim sísmico',quakes.length?`${quakes.length} eventos`:quakesLoaded?'Sem dados disponíveis':'Carregando…',strongest?`Maior: M${strongest.properties.mag} — ${magnitude(strongest.properties.mag)}`:quakesLoaded?'Não foi possível obter eventos do USGS agora.':'Consultando USGS')}<p class="note">Dados observados, previstos e educativos têm fontes diferentes. Confira sempre avisos oficiais.</p><button class="logout" id="logout">Sair do aplicativo</button></section>`; }
function tempo(){ const h=weather?.hourly, alerts=weatherAlerts(), favoriteSummary=favoriteWeatherSummary(); return `${head('Meteorologia','Condições locais, trovoadas e previsão horária')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade analisada</p><div class="search"><input id="weather-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="weather-location-search">Buscar</button></div><p class="picker-current">Exibindo dados de <strong>${escape(selected.name)}</strong></p><div id="weather-location-results" class="list"></div></div>${favoriteSummary}<h2>Condições e alertas</h2>${alerts.map(alert=>`<article class="alert ${alert.level}"><small>TRIAGEM METEOROLÓGICA</small><strong>${alert.title}</strong><p>${alert.detail}</p></article>`).join('')}${card(selected.name,weather?`${fmt(weather.current.temperature_2m)}°C`:'—',weather?`${status(weather.current.weather_code)} · Sensação ${fmt(weather.current.apparent_temperature)}°C`:'')}${card('Temperatura de hoje',weather?`${fmt(todayValue('temperature_2m_max'))}° / ${fmt(todayValue('temperature_2m_min'))}°`:'—',weather?`Sensação: ${fmt(todayValue('apparent_temperature_max'))}° / ${fmt(todayValue('apparent_temperature_min'))}°`:'')}${card('Chuva e trovoadas',weather?`${fmt(todayValue('precipitation_probability_max'))}% de chance`:'—',weather?`Acumulado: ${fmt(todayValue('precipitation_sum'))} mm · Trovoadas: ${thunderRisk()}`:'')}${card('Vento e rajadas',weather?`${fmt(weather.current.wind_speed_10m)} km/h · ${windDirection(weather.current.wind_direction_10m)}`:'—',weather?`Direção ${fmt(weather.current.wind_direction_10m)}° · Rajada atual ${fmt(weather.current.wind_gusts_10m)} km/h · máxima ${fmt(todayValue('wind_gusts_10m_max'))} km/h`:'')}${card('Atmosfera',weather?`${fmt(weather.current.relative_humidity_2m)}% de umidade`:'—',weather?`Pressão ${fmt(weather.current.pressure_msl)} hPa · Nuvens ${fmt(weather.current.cloud_cover)}% · UV máx. ${fmt(todayValue('uv_index_max'))}`:'')}${card('Qualidade do ar',air?`AQI ${fmt(air.current.european_aqi)}`:'—',air?`PM10 ${air.current.pm10} · PM2,5 ${air.current.pm2_5} · O₃ ${air.current.ozone} µg/m³ (${ozoneImpact(air.current.ozone)})`:'')}${card('Ondas e temperatura do mar',marine?`${marine.current.wave_height?.toFixed(1) ?? '—'} m de ondas`:'Sem cobertura marítima',marine?`Mar ${marine.current.sea_surface_temperature?.toFixed(1) ?? '—'}°C · período ${marine.current.wave_period?.toFixed(1) ?? '—'} s · direção ${fmt(marine.current.wave_direction)}°`:'Os dados aparecem quando houver grade oceânica próxima à localidade.')}${card('Previsões extremas',extremeForecast(),'Resumo automático dos próximos 7 dias. Consulte os alertas oficiais para decisões de segurança.')}${card('Seca e incêndio',droughtSignal(),`Risco de incêndio: ${fireRisk()}. É uma estimativa meteorológica, não um alerta oficial.`)}${card('Tempo para esportes',sportLabel(),'Estimativa baseada em chuva, UV, vento e trovoadas.')}<h2>Próximas 24 horas</h2><div class="scroller">${h?.time?.slice(0,24).map((t,i)=>`<article class="hour"><b>${new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b><strong>${fmt(h.temperature_2m[i])}°</strong><small>Chuva ${fmt(h.precipitation_probability[i])}%</small><small>Raj. ${fmt(h.wind_gusts_10m[i])} km/h</small><small>${Number(h.cape?.[i]||0)>=500?'Instabilidade':'Sem instab. relevante'}</small></article>`).join('') || '<p class="note">Carregando previsão horária…</p>'}</div><h2>Próximos 7 dias</h2><div class="scroller">${weather?.daily?.time?.map((t,i)=>`<article class="hour"><b>${new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit'}).format(new Date(t+'T12:00:00'))}</b><strong>${fmt(weather.daily.temperature_2m_max[i])}° / ${fmt(weather.daily.temperature_2m_min[i])}°</strong><small>Chuva ${fmt(weather.daily.precipitation_probability_max[i])}% · ${fmt(weather.daily.precipitation_sum[i])} mm</small><small>UV ${fmt(weather.daily.uv_index_max[i])} · Raj. ${fmt(weather.daily.wind_gusts_10m_max[i])} km/h</small></article>`).join('') || ''}</div></section>`; }
function oceano(){ return `${head('Oceano','Ondas, temperatura do mar, marés e avisos marítimos')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade costeira analisada</p><div class="search"><input id="ocean-location-query" placeholder="Pesquise uma cidade litorânea, como Rio de Janeiro" /><button id="ocean-location-search">Buscar</button></div><p class="picker-current">Exibindo dados de <strong>${escape(selected.name)}</strong></p><div id="ocean-location-results" class="list"></div></div>${marine?card(selected.name,`Ondas: ${marine.current.wave_height?.toFixed(1) ?? '—'} m`, `Período ${marine.current.wave_period?.toFixed(1) ?? '—'} s · Direção ${fmt(marine.current.wave_direction)}° · Mar ${marine.current.sea_surface_temperature?.toFixed(1) ?? '—'}°C`):card(selected.name,'Sem dados oceânicos','Esta localidade pode estar distante da costa ou não ter dados marítimos disponíveis.')}${tideReference()}${tideTodayCard()}<h2>Avisos marítimos do dia</h2><p class="note">${warningsStatus || 'Consultando a Marinha…'}</p>${maritimeWarnings.length?maritimeWarnings.map(warning=>`<article class="alert orange"><small>MARINHA · METAREA V</small><strong>${escape(warning.title)}</strong><p>${escape(warning.detail)}</p></article>`).join(''):''}<a class="link-card" href="${MARINHA_TIDES_PAGE}" target="_blank">Tábua de marés · Abrir publicação oficial</a><a class="link-card" href="${MARINHA_WARNINGS_PAGE}" target="_blank">Avisos marítimos · Abrir Marinha</a><p class="notice">Maré astronômica, altura de onda e nível real do mar são grandezas diferentes.</p></section>`; }
function terra(){ return `${head('Terra','Boletim sísmico mundial — últimas 24 horas')}<section class="stack"><div class="stats"><div><b>${quakes.length}</b><small>sismos</small></div><div><b>${averageMag()}</b><small>média M</small></div><div><b>${quakes.filter(q=>q.properties.mag>=5).length}</b><small>M5+</small></div><div><b>${quakes.filter(q=>q.geometry.coordinates[2]<70).length}</b><small>rasos</small></div></div>${quakes.slice(0,30).map(q=>`<article class="event"><b class="mag ${Number(q.properties.mag)>5?'severe':''}">${Number(q.properties.mag).toFixed(1)}</b><div><strong>${escape(q.properties.place)}</strong><p>${magnitude(q.properties.mag)} · ${depth(q.geometry.coordinates[2])} · ${q.geometry.coordinates[2].toFixed(1)} km</p><small>${new Date(q.properties.time).toLocaleString('pt-BR')}</small></div></article>`).join('') || '<p class="note">Carregando boletim sísmico…</p>'}</section>`; }
function translateCycloneText(value){ const changes=[[/tropical depression/gi,'depressão tropical'],[/tropical storm/gi,'tempestade tropical'],[/tropical cyclone/gi,'ciclone tropical'],[/subtropical storm/gi,'tempestade subtropical'],[/extratropical cyclone/gi,'ciclone extratropical'],[/hurricane/gi,'furacão'],[/typhoon/gi,'tufão'],[/cyclone/gi,'ciclone'],[/storm/gi,'tempestade'],[/north atlantic/gi,'Atlântico Norte'],[/eastern pacific/gi,'Pacífico Leste'],[/central pacific/gi,'Pacífico Central'],[/western pacific/gi,'Pacífico Oeste'],[/indian ocean/gi,'Oceano Índico'],[/movement/gi,'movimento'],[/stationary/gi,'quase estacionário'],[/northward/gi,'para norte'],[/southward/gi,'para sul'],[/eastward/gi,'para leste'],[/westward/gi,'para oeste']]; return changes.reduce((text,[pattern,translation])=>text.replace(pattern,translation),String(value||'')); }
function globalStormType(value){ const text=String(value||'').toLowerCase(); if(text.includes('anticyclone')||text.includes('anticiclone')) return 'Anticiclone'; if(text.includes('hurricane')||text.includes('furacão')) return 'Furacão'; if(text.includes('typhoon')||text.includes('tufão')) return 'Tufão'; if(text.includes('extratropical')) return 'Ciclone extratropical'; if(text.includes('subtropical')) return 'Ciclone subtropical'; if(text.includes('tropical depression')||text.includes('depressão tropical')) return 'Depressão tropical'; if(text.includes('tropical storm')||text.includes('tempestade tropical')) return 'Tempestade tropical'; if(text.includes('tropical cyclone')||text.includes('ciclone tropical')) return 'Ciclone tropical'; if(text.includes('cyclone')||text.includes('ciclone')) return 'Ciclone'; if(text.includes('storm')||text.includes('tempestade')) return 'Tempestade em monitoramento'; return 'Sistema atmosférico em monitoramento'; }
function cycloneType(system){ return globalStormType(`${system.classification||system.type||system.stormType||''} ${system.stormName||system.name||''}`); }
function cycloneLocation(system){ const label=system.location||system.locationName||system.area||system.advisoryLocation; if(label) return label; const latitude=Number(system.latitude??system.lat??system.latDecimal), longitude=Number(system.longitude??system.lon??system.long??system.lonDecimal); if(Number.isFinite(latitude)&&Number.isFinite(longitude)) return `${Math.abs(latitude).toFixed(1)}°${latitude>=0?'N':'S'}, ${Math.abs(longitude).toFixed(1)}°${longitude>=0?'L':'O'}`; return 'Localização não informada pela fonte'; }
function cycloneAnalysis(system){ const kind=cycloneType(system); const basin=translateCycloneText(system.basin||'bacia não informada'); const movement=translateCycloneText(system.movement||system.motion||'movimento não informado'); const intensity=translateCycloneText(system.intensity||'intensidade não informada'); return `${kind} · ${intensity} · ${basin} · ${movement} · Localização: ${cycloneLocation(system)}`; }
function globalStormLocation(event){ const coordinates=event.geometry?.[0]?.coordinates; if(Array.isArray(coordinates)&&coordinates.length>=2){ const [longitude,latitude]=coordinates; return `${Math.abs(latitude).toFixed(1)}°${latitude>=0?'N':'S'}, ${Math.abs(longitude).toFixed(1)}°${longitude>=0?'L':'O'}`; } return 'Localização não informada pela fonte'; }
function globalStormSystems(){ const nhc=cyclones.map(system=>({name:translateCycloneText(system.stormName||system.name||'Sistema tropical'),type:cycloneType(system),detail:cycloneAnalysis(system),source:'Centro Nacional de Furacões dos EUA (NHC)'})); const painel=painelCyclones.map(system=>({...system,source:'Painel Global'})); const eonet=disasters.filter(event=>event.categories?.some(category=>/storm|cyclone/i.test(category.title))).map(event=>({name:translateCycloneText(event.title||'Tempestade'),type:globalStormType(`${event.title||''} ${event.categories?.map(category=>category.title).join(' ')||''}`),detail:`Localização: ${globalStormLocation(event)} · ${event.country||'País em identificação'} · Atualização: ${event.geometry?.[0]?.date?new Date(event.geometry[0].date).toLocaleDateString('pt-BR'):'horário não informado'}`,source:'Catálogo global da NASA (EONET)'})); const unique=new Map(); [...nhc,...painel,...eonet].forEach(system=>{ const key=`${atlasKey(system.name)}-${system.type}`; const existing=unique.get(key); if(!existing) unique.set(key,system); else if(system.source==='Painel Global'&&!existing.source.includes('Painel Global')) existing.source=`${existing.source} + Painel Global`; }); return [...unique.values()]; }
function cycloneLocationFromDetail(detail){ return String(detail||'').match(/Localização:\s*([^·]+)/i)?.[1]?.trim() || 'Localização não informada pela fonte'; }
function cycloneStatusLines(systems){ const relevant=['Furacão','Tufão','Ciclone tropical','Depressão tropical','Tempestade tropical','Ciclone extratropical','Ciclone subtropical','Ciclone']; return relevant.map(type=>{ const items=systems.filter(system=>system.type===type); if(!items.length) return ''; return `${type}${items.length>1?'s':''}: ${items.map(system=>`${system.name} (${cycloneLocationFromDetail(system.detail)})`).join('; ')}`; }).filter(Boolean); }
function pressureAnalysis(){ const pressure=Number(weather?.current?.pressure_msl); if(!Number.isFinite(pressure)) return card('Anticiclone e baixa pressão','Consultando pressão local','A análise local usa a pressão ao nível médio do mar da localidade selecionada.'); if(pressure>=1022) return card('Anticiclone / alta pressão local',`${fmt(pressure)} hPa`,'Pressão relativamente alta: costuma favorecer tempo mais estável. A confirmação de um anticiclone completo exige um mapa de pressão regional.'); if(pressure<=1010) return card('Baixa pressão local',`${fmt(pressure)} hPa`,'Pressão relativamente baixa: pode favorecer nuvens e instabilidade, dependendo dos demais fatores.'); return card('Pressão local',`${fmt(pressure)} hPa`,'Valor intermediário. O mapa de pressão regional será integrado para identificar centros de alta e baixa pressão.'); }
function ciclones(){
  const systems=globalStormSystems();
  const statusLines=cycloneStatusLines(systems);
  const types=['Ciclone tropical','Depressão tropical','Tempestade tropical','Furacão','Tufão','Ciclone subtropical','Ciclone extratropical','Anticiclone'];
  return `${head('Ciclones','Sistemas tropicais e de pressão no mundo')}<section class="stack">
    ${pressureAnalysis()}
    <article class="notice"><strong>Como os nomes funcionam</strong><p>Furacão, tufão e ciclone tropical são o mesmo tipo de sistema; o nome varia conforme a bacia oceânica. Anticiclone é um centro de alta pressão, não uma tempestade.</p></article>
    <p class="note">${cycloneStatus}${cycloneUpdatedAt?` · Atualizado em ${cycloneUpdatedAt}`:''}</p>
    <div class="stats"><div><b>${systems.length}</b><small>sistemas listados</small></div><div><b>${systems.filter(system=>system.type==='Furacão').length}</b><small>furacões</small></div><div><b>${systems.filter(system=>system.type==='Tempestade tropical').length}</b><small>tempestades</small></div><div><b>${systems.filter(system=>system.type==='Depressão tropical').length}</b><small>depressões</small></div></div>
    <h2>Resumo do que está ativo</h2>${statusLines.length?statusLines.map(line=>`<article class="event"><div><strong>${escape(line)}</strong></div></article>`).join('') : '<p class="note">Nenhum furacão, ciclone tropical, tempestade tropical ou depressão foi retornado pelas fontes nesta consulta.</p>'}
    <h2>Sistemas em acompanhamento</h2>
    ${systems.length?systems.map(system=>card(system.name,system.type,`${system.detail} · Fonte: ${system.source}`)).join(''):card('Nenhum sistema retornado agora','Atualize para consultar novamente','A ausência na lista não substitui a consulta aos centros regionais, principalmente no Pacífico Oeste, Índico e Hemisfério Sul.')}
    <h2>Tipos acompanhados</h2><p class="note">${types.join(' · ')}</p>
    <article class="notice"><strong>Cobertura e conferência</strong><p>Os cartões combinam Painel Global, Centro Nacional de Furacões dos EUA (Atlântico e Pacífico Leste/Central) e o catálogo global de tempestades da NASA. O Windy não aparece nesta tela. Para tufões e outros sistemas do Pacífico Oeste, consulte também o Centro de Tufões da Agência Meteorológica do Japão.</p></article>
    <a class="link-card" href="${PAINEL_GLOBAL_CYCLONES_URL}" target="_blank" rel="noopener">Painel Global · Monitoramento de furacões e ciclones</a>
    <a class="link-card" href="https://www.nhc.noaa.gov/cyclones/" target="_blank" rel="noopener">NHC · Sistemas tropicais ativos</a>
    <a class="link-card" href="https://www.data.jma.go.jp/multi/cyclone/cyclone.html?lang=en" target="_blank" rel="noopener">Agência Meteorológica do Japão · Tufões ativos</a>
  </section>`;
}
function translateDisasterText(value){ const replacements=[[/wildfires?/gi,'Incêndios florestais'],[/wildfire/gi,'Incêndio florestal'],[/floods?/gi,'Inundações'],[/severe storms?/gi,'Tempestades severas'],[/tropical cyclones?/gi,'Ciclones tropicais'],[/volcanoes?/gi,'Vulcões'],[/volcanic/gi,'Vulcânico'],[/earthquakes?/gi,'Terremotos'],[/landslides?/gi,'Deslizamentos de terra'],[/droughts?/gi,'Secas'],[/dust and haze/gi,'Poeira e névoa seca'],[/sea and lake ice/gi,'Gelo marinho e lacustre'],[/event/gi,'Evento']]; return replacements.reduce((text,[pattern,translation])=>text.replace(pattern,translation),String(value||'')); }
function disasterCategory(event){ const categories=event.categories?.map(category=>translateDisasterText(category.title)).filter(Boolean); return categories?.join(', ')||'Evento natural monitorado'; }
function disasterTitle(event){ return translateDisasterText(event.title||'Evento natural'); }
function disasterCoordinates(event){ const coordinates=event.geometry?.[0]?.coordinates; return Array.isArray(coordinates)&&coordinates.length>=2?{longitude:Number(coordinates[0]),latitude:Number(coordinates[1])}:null; }
function disasterCountryCache(){ try{return JSON.parse(localStorage.getItem(DISASTER_COUNTRY_KEY)||'{}')}catch{return {}} }
function allCountries(){ const names=globalThis.Intl?.DisplayNames?new Intl.DisplayNames(['pt-BR'],{type:'region'}):null; return COUNTRY_CODES.map(code=>({code,name:names?.of(code)||code})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')); }
function selectedCountry(){ return allCountries().find(country=>country.code===disasterCountryFilter); }
async function enrichDisasterCountries(events){
  const cache=disasterCountryCache();
  events.forEach(event=>{const saved=cache[event.id]; if(saved){ event.country=typeof saved==='string'?saved:saved.name; event.countryCode=typeof saved==='string'?'':saved.code; }});
  const pending=events.filter(event=>!event.countryCode&&disasterCoordinates(event)).slice(0,15);
  if(!pending.length) return;
  await Promise.allSettled(pending.map(async event=>{
    const point=disasterCoordinates(event);
    const response=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${point.latitude}&longitude=${point.longitude}&localityLanguage=pt`);
    if(!response.ok) throw new Error('Geocodificação indisponível');
    const data=await response.json();
    if(data.countryName){ event.country=data.countryName; event.countryCode=data.countryCode||''; cache[event.id]={name:event.country,code:event.countryCode}; }
  }));
  localStorage.setItem(DISASTER_COUNTRY_KEY,JSON.stringify(cache));
  if(active==='desastres') render();
}
function desastresView(){
  const fire=fireRiskDetail(), landslide=landslideRiskDetail(), drought=droughtRiskDetail(), geo=geohydrologicalRiskDetail();
  return `${head('Riscos','Análise da localidade escolhida')}<section class="stack">
    <div class="location-picker"><p class="picker-label">Localidade analisada</p><div class="search"><input id="risk-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="risk-location-search">Buscar</button></div><p class="picker-current">Exibindo riscos para <strong>${escape(selected.name)}</strong></p><div id="risk-location-results" class="list"></div></div>
    <article class="notice"><strong>Como ler esta aba</strong><p>Esta é uma triagem baseada nas condições meteorológicas previstas para a localidade. Ela orienta o acompanhamento, mas não substitui um alerta oficial, avaliação de encosta ou vistoria da Defesa Civil.</p></article>
    <h2>Riscos para ${escape(selected.name)}</h2>
    <article class="alert ${fire.level}"><small>PROPAGAÇÃO DE FOGO</small><strong>${fire.title}</strong><p>${fire.detail}</p></article>
    <article class="alert ${landslide.level}"><small>DESLIZAMENTO DE TERRA</small><strong>${landslide.title}</strong><p>${landslide.detail}</p></article>
    <article class="alert ${drought.level}"><small>SECA</small><strong>${drought.title}</strong><p>${drought.detail}</p></article>
    <article class="alert ${geo.level}"><small>RISCOS GEO-HIDROLÓGICOS</small><strong>${geo.title}</strong><p>${geo.detail}</p></article>
    <h2>Fontes oficiais de consulta</h2>
    <a class="link-card" href="https://produtos.cemaden.gov.br/fogo/" target="_blank" rel="noopener">CEMADEN · Risco de propagação de fogo</a>
    <a class="link-card" href="https://georisk.cemaden.gov.br/" target="_blank" rel="noopener">CEMADEN · GeoRisk: risco de deslizamento</a>
    <a class="link-card" href="https://alertasecas.cemaden.gov.br/" target="_blank" rel="noopener">CEMADEN · Alerta Secas</a>
    <a class="link-card" href="https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos/" target="_blank" rel="noopener">CEMADEN · Boletins de riscos geo-hidrológicos</a>
    <a class="link-card" href="https://alertas2.inmet.gov.br/" target="_blank" rel="noopener">INMET · Avisos meteorológicos</a>
  </section>`;
}
function brazilDisasterLocation(event){ const coordinates=event.geometry?.[0]?.coordinates; if(Array.isArray(coordinates)&&coordinates.length>=2) return `Posição: ${Math.abs(Number(coordinates[1])).toFixed(1)}°${Number(coordinates[1])>=0?'N':'S'}, ${Math.abs(Number(coordinates[0])).toFixed(1)}°${Number(coordinates[0])>=0?'L':'O'}`; return 'Área indicada pela fonte não possui coordenada pontual'; }
function isBrazilEvent(event){ const coordinates=event.geometry?.[0]?.coordinates; if(!Array.isArray(coordinates)||coordinates.length<2) return false; const longitude=Number(coordinates[0]), latitude=Number(coordinates[1]); return longitude>=-74.2&&longitude<=-34.2&&latitude>=-34.9&&latitude<=5.5; }
function climateEventSummary(){
  if(!disasters.length) return 'Catálogo global em atualização.';
  const counts={};
  disasters.forEach(event=>event.categories?.forEach(category=>{
    const label=translateDisasterText(category.title);
    counts[label]=(counts[label]||0)+1;
  }));
  const listed=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name,count])=>`${count} ${name.toLowerCase()}`);
  return listed.length ? `${disasters.length} evento(s) aberto(s): ${listed.join(' · ')}.` : `${disasters.length} evento(s) aberto(s) no catálogo global.`;
}
function climateMonitorCards(){
  if(climateLoading && !climateMonitors.length) return card('Brasil hoje','Atualizando monitoramento','Consultando previsões diárias nas quatro regiões de referência.');
  if(!climateMonitors.length) return card('Brasil hoje','Dados temporariamente indisponíveis','Tente atualizar novamente para consultar o monitoramento regional.');
  return climateMonitors.map(item=>card(`${item.region} · ${item.name}`,`${fmt(item.temperature)} °C`,
    `Máx. ${fmt(item.maximum)} °C · mín. ${fmt(item.minimum)} °C · chuva prevista: ${fmt(item.rain)} mm`)).join('');
}
function clima(){
  const elNino=ensoMode==='el-nino';
  const title=elNino?'El Niño':'La Niña';
  const description=elNino?'Aquecimento persistente das águas superficiais do Pacífico Equatorial central e leste.':'Resfriamento persistente das águas superficiais do Pacífico Equatorial central e leste.';
  const brazil=elNino?'Pode aumentar a chance de chuva acima da média no Sul e favorecer períodos mais quentes ou secos em partes do Norte e Nordeste. No Sudeste, a resposta depende muito da estação e de outros sistemas atmosféricos.':'Pode aumentar a chance de chuva em partes do Norte e Nordeste e reduzir a chuva no Sul. No Sudeste, a resposta depende muito da estação e de outros sistemas atmosféricos.';
  const global=elNino?'Pode alterar os padrões de chuva, temperatura e circulação atmosférica em diferentes regiões do planeta.':'Pode alterar os padrões de chuva, temperatura e circulação atmosférica em diferentes regiões do planeta.';
  const official=elNino
    ? `${ENSO_OFFICIAL.status} · discussão oficial de ${ENSO_OFFICIAL.issued}. Niño 3.4: ${ENSO_OFFICIAL.nino34}. Perspectiva: ${ENSO_OFFICIAL.outlook}.`
    : `A La Niña não é a fase indicada no último diagnóstico disponível (${ENSO_OFFICIAL.issued}); a referência atual é ${ENSO_OFFICIAL.status}. Esta aba mantém os efeitos típicos da La Niña para estudo e comparação.`;
  return `${head('Clima global','El Niño, La Niña e monitoramento diário')}<section class="stack">
    <div class="location-picker"><p class="picker-label">Fenômeno climático</p><div class="chips"><button class="chip ${elNino?'selected':''}" id="show-el-nino">El Niño</button><button class="chip ${!elNino?'selected':''}" id="show-la-nina">La Niña</button></div><p class="picker-current">Escolha o fenômeno para comparar seus possíveis efeitos.</p></div>
    ${card('Situação oficial mais recente',ENSO_OFFICIAL.status,official)}
    ${card(title,elNino?'Aquecimento do Pacífico Equatorial':'Resfriamento do Pacífico Equatorial',description)}
    ${card('Possíveis efeitos no Brasil',title,brazil)}
    ${card('Possíveis efeitos no mundo',title,global)}
    <article class="notice"><strong>Leitura correta dos impactos</strong><p>El Niño ou La Niña alteram probabilidades; não explicam sozinhos um evento local. Chuva, seca, incêndio ou calor precisam ser avaliados junto com os demais sistemas atmosféricos e a vulnerabilidade de cada região.</p></article>
    <h2>Monitoramento diário no Brasil</h2><p class="note">${climateUpdatedAt?`Atualizado em ${climateUpdatedAt}`:'Será atualizado ao consultar os dados.'} · Dados meteorológicos de referência, não atribuição automática ao ENSO.</p>
    ${climateMonitorCards()}
    <h2>Panorama global de eventos</h2>${card('Eventos em acompanhamento',`${disasters.length || '—'} no catálogo global`,climateEventSummary())}
    <p class="note">O catálogo mostra eventos abertos no mundo. Eles não devem ser classificados como “causados” por El Niño ou La Niña sem análise científica específica.</p>
    ${card('Como confirmar a fase','Índice ONI, oceano e atmosfera','O oceano sozinho não define o evento: o diagnóstico oficial combina temperatura do Pacífico, ventos e resposta da atmosfera. A classificação oficial é mensal; este painel atualiza diariamente os indicadores e impactos monitorados.')}
    <a class="link-card" href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" target="_blank">Diagnóstico oficial do ENSO · NOAA</a>
  </section>`;
}
function lightningRiskDetail(){
  if(!weather) return {title:'Consultando condições locais',detail:'Carregando chuva, instabilidade e previsão para estimar o risco de trovoadas.',level:'green'};
  const risk=thunderRisk();
  const rain=fmt(todayValue('precipitation_probability_max'));
  const cape=fmt(maxNext24('cape'));
  if(risk==='Alto') return {title:'Risco alto de trovoadas',detail:`Há sinais de instabilidade: chuva prevista de até ${rain}% e CAPE de até ${cape} J/kg nas próximas 24 horas. Acompanhe o mapa de raios e os avisos oficiais.`,level:'orange'};
  if(risk==='Possível') return {title:'Possibilidade de trovoadas',detail:`Há alguma instabilidade prevista: chuva de até ${rain}% e CAPE de até ${cape} J/kg nas próximas 24 horas.`,level:'orange'};
  return {title:'Baixa possibilidade de trovoadas',detail:`Chuva prevista de até ${rain}% e CAPE de até ${cape} J/kg nas próximas 24 horas. Isso não elimina a chance de uma descarga isolada.`,level:'green'};
}
function raios(){
  const risk=lightningRiskDetail();
  const hourly=weather?.hourly;
  const lightningHours=hourly?.time?.slice(0,12).map((time,index)=>{
    const probability=Number(hourly.precipitation_probability?.[index]||0);
    const cape=Number(hourly.cape?.[index]||0);
    const level=(cape>=1200&&probability>=50)||Number(hourly.weather_code?.[index])>=95?'Alto':cape>=500&&probability>=30?'Possível':'Baixo';
    return `<article class="hour"><b>${new Date(time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</b><strong>${level}</strong><small>Chuva ${fmt(probability)}%</small><small>Instabilidade ${fmt(cape)} J/kg</small></article>`;
  }).join('');
  return `${head('Raios e trovoadas','Risco previsto para a localidade escolhida')}<section class="stack">
    <div class="location-picker"><p class="picker-label">Localidade analisada</p><div class="search"><input id="lightning-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="lightning-location-search">Buscar</button></div><p class="picker-current">Exibindo dados de <strong>${escape(selected.name)}</strong></p><div id="lightning-location-results" class="list"></div></div>
    <article class="alert ${risk.level}"><small>ANÁLISE DA LOCALIDADE</small><strong>${risk.title}</strong><p>${risk.detail}</p></article>
    ${card('Localidade analisada',escape(selected.name),weather?`Condição atual: ${status(weather.current.weather_code)} · chuva atual ${fmt(weather.current.precipitation)} mm.`:'Carregando condições locais.')}
    <h2>Previsão de trovoadas · próximas 12 horas</h2>
    <div class="scroller">${lightningHours||'<p class="note">Carregando previsão horária.</p>'}</div>
    <h2>Como interpretar</h2>
    ${card('Raio, relâmpago e trovão','São partes do mesmo fenômeno','Raio é a descarga elétrica; relâmpago é a luz observada; trovão é o som produzido pela rápida expansão do ar aquecido.')}
    ${card('Como este risco é calculado','Chuva, instabilidade e condição do tempo','A análise combina probabilidade de chuva, instabilidade atmosférica (CAPE) e código de tempo previsto para a localidade selecionada. A RINDAT é usada apenas como referência de monitoramento, sem incorporar sua página ao aplicativo.')}
    <article class="notice"><strong>Segurança durante trovoadas</strong><p>Ao ouvir trovão, interrompa atividades ao ar livre e procure abrigo em construção fechada ou veículo com teto metálico. Evite praia, água, áreas abertas, árvores isoladas e objetos metálicos. Espere pelo menos 30 minutos após o último trovão antes de retomar a atividade.</p></article>
    <a class="link-card" href="https://alertas2.inmet.gov.br/" target="_blank" rel="noopener">INMET · Avisos oficiais de tempestade</a>
  </section>`;
}
function globeIllustration(){ return `${head('Globo','Monitoramento global em camadas')}<section class="stack"><article class="globe ${globePaused?'paused':''}"><div class="globe-stage" role="img" aria-label="Globo holográfico com grade azul e continentes em laranja"><svg class="holo-globe ${globePaused?'paused':''}" viewBox="0 0 500 500" aria-hidden="true"><defs><clipPath id="globe-clip"><circle cx="250" cy="250" r="190" /></clipPath><radialGradient id="ocean-glow"><stop offset="0" stop-color="#0b3152"/><stop offset=".67" stop-color="#061b35"/><stop offset="1" stop-color="#020a17"/></radialGradient><filter id="orange-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle class="globe-aura" cx="250" cy="250" r="197"/><circle class="globe-fill" cx="250" cy="250" r="190" fill="url(#ocean-glow)"/><g class="globe-grid" clip-path="url(#globe-clip)"><ellipse cx="250" cy="250" rx="78" ry="190"/><ellipse cx="250" cy="250" rx="145" ry="190"/><path d="M60 170 Q250 245 440 170M60 210 Q250 265 440 210M60 250 Q250 285 440 250M60 290 Q250 305 440 290M60 330 Q250 315 440 330M75 130 Q250 205 425 130M75 370 Q250 295 425 370"/><path d="M250 60V440M130 82Q250 250 370 418M90 135Q250 250 410 365M410 135Q250 250 90 365M370 82Q250 250 130 418"/></g><g class="continent-outline" clip-path="url(#globe-clip)" filter="url(#orange-glow)"><path d="M94 155l31-25 36 6 16 18 29 10 4 22-23 9-24-10-18 11-23-9-23 7-15-14z"/><path d="M167 205l24 8 16 24-8 25 19 27-15 43-21 42-18-25 7-35-15-33 11-28-4-24z"/><path d="M270 145l33-16 26 8 13 19-17 15 7 21-26 21-13 30-19-9 5-29-15-16z"/><path d="M307 247l22 13 22 42-11 26-4 47-24 28-16-23 3-38-14-29 12-28z"/><path d="M365 185l24-7 24 19 14 9-3 29-20 10-20-11-17-24z"/><path d="M381 294l38 12 21 35-13 20-24-8-11-24-23-14z"/><path d="M231 378l30 8 13 23-22 17-31-11-9-21z"/></g><circle class="globe-rim" cx="250" cy="250" r="190"/></svg><span class="globe-pulse pulse-one"></span><span class="globe-pulse pulse-two"></span></div><button class="secondary-action globe-toggle" id="globe-toggle" aria-pressed="${globePaused}">${globePaused?'▶ Continuar rotação':'❚❚ Pausar globo'}</button><div class="globe-legend"><span><i class="legend-dot quake"></i>${quakes.length} sismos</span><span><i class="legend-dot cyclone"></i>${cyclones.length} ciclones</span><span><i class="legend-dot disaster"></i>${disasters.length} eventos</span></div>${globePaused?`<p class="globe-status">Globo pausado para leitura: ${quakes.length} sismos, ${cyclones.length} ciclones e ${disasters.length} eventos nas camadas ativas.</p>`:''}</article><article class="notice"><strong>Visualização global</strong><p>Use o botão para pausar a rotação e consultar os dados exibidos sem movimento. A próxima etapa será associar marcadores clicáveis a cada informação.</p></article></section>`; }
function globePoints(){
  const earthquakePoints=quakes.slice(0,180).map(event=>({type:'Sismo',name:event.properties.place||'Terremoto',latitude:Number(event.geometry.coordinates[1]),longitude:Number(event.geometry.coordinates[0]),detail:`Magnitude ${Number(event.properties.mag).toFixed(1)} · profundidade ${Number(event.geometry.coordinates[2]).toFixed(1)} km`,color:Number(event.properties.mag)>=5?'#ff526d':'#ffd25c'}));
  const disasterPoints=disasters.slice(0,80).map(event=>{ const point=disasterCoordinates(event); return point?{type:'Evento natural',name:disasterTitle(event),latitude:point.latitude,longitude:point.longitude,detail:disasterCategory(event),color:'#ff9b54'}:null; }).filter(Boolean);
  const cyclonePoints=cyclones.map(system=>{ const latitude=Number(system.latitude??system.lat??system.latDecimal),longitude=Number(system.longitude??system.lon??system.long??system.lonDecimal); return Number.isFinite(latitude)&&Number.isFinite(longitude)?{type:cycloneType(system),name:translateCycloneText(system.stormName||system.name||'Sistema atmosférico'),latitude,longitude,detail:cycloneAnalysis(system),color:'#61d9ff'}:null; }).filter(Boolean);
  return [...earthquakePoints,...disasterPoints,...cyclonePoints];
}
function globe(){
  const selectedInfo=globeSelectedEvent?`<article class="notice"><strong>${escape(globeSelectedEvent.type)} · ${escape(globeSelectedEvent.name)}</strong><p>${escape(globeSelectedEvent.detail)} · ${Math.abs(globeSelectedEvent.latitude).toFixed(2)}°${globeSelectedEvent.latitude>=0?'N':'S'}, ${Math.abs(globeSelectedEvent.longitude).toFixed(2)}°${globeSelectedEvent.longitude>=0?'L':'O'}</p></article>`:'';
  return `${head('Globo','Mapa terrestre interativo com camadas')}<section class="stack"><article class="interactive-globe-card"><div id="interactive-globe" class="interactive-globe"><p class="note">Preparando o globo terrestre…</p></div><button class="secondary-action globe-toggle" id="globe-toggle" aria-pressed="${globePaused}">${globePaused?'▶ Continuar rotação':'❚❚ Pausar globo'}</button><div class="globe-legend"><span><i class="legend-dot quake"></i>${quakes.length} sismos</span><span><i class="legend-dot cyclone"></i>${cyclones.length} ciclones</span><span><i class="legend-dot disaster"></i>${disasters.length} eventos</span></div><p class="note">Arraste para girar, use a roda do mouse ou pinça para aproximar e toque em um marcador para ver os detalhes.</p></article>${selectedInfo}<article class="notice"><strong>Camadas do mapa</strong><p>Países e oceanos formam a base do globo. Marcadores amarelos representam sismos, azuis representam ciclones e laranjas representam eventos naturais. A visualização exige conexão com a internet para carregar a cartografia.</p></article></section>`;
}
function mountInteractiveGlobe(){
  const target=document.querySelector('#interactive-globe');
  if(!target||!globalThis.Globe){ if(target) target.innerHTML='<p class="notice">O mapa 3D não pôde ser carregado agora. Verifique sua conexão e atualize a tela.</p>'; return; }
  try{
    const width=Math.max(300,Math.floor(target.getBoundingClientRect().width||600));
    const points=globePoints();
    const world=globalThis.Globe()(target)
      .width(width).height(470)
      .backgroundColor('#020711')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true).atmosphereColor('#61d9ff').atmosphereAltitude(0.13)
      .showGraticules(true)
      .pointsData(points).pointLat('latitude').pointLng('longitude').pointColor('color').pointAltitude(0.03).pointRadius(0.23)
      .pointLabel(point=>`<b>${escape(point.type)}</b><br>${escape(point.name)}<br>${escape(point.detail)}`)
      .onPointClick(point=>{ globeSelectedEvent=point; globePaused=true; render(); });
    world.controls().autoRotate=!globePaused;
    world.controls().autoRotateSpeed=0.55;
    world.controls().enableDamping=true;
    world.pointOfView({lat:-12,lng:-45,altitude:2.1},0);
    globeEngine=world;
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(response=>response.json()).then(topology=>{
      if(!globalThis.topojson||active!=='globo') return;
      const countries=globalThis.topojson.feature(topology,topology.objects.countries).features;
      world.polygonsData(countries).polygonCapColor(()=> 'rgba(4,18,36,0.18)').polygonSideColor(()=> 'rgba(0,0,0,0)').polygonStrokeColor(()=> 'rgba(115,217,255,0.55)').polygonAltitude(0.002);
    }).catch(()=>{});
  }catch{ target.innerHTML='<p class="notice">Não foi possível iniciar o globo 3D neste navegador.</p>'; }
}
function favorites(){ const f=getFavorites(); return `${head('Favoritos','Escolha as localidades que deseja acompanhar')}<section class="stack"><div class="search"><input id="location-query" placeholder="Pesquisar cidade ou localidade" /><button id="location-search">Buscar</button></div><div id="search-results"></div>${f.length?f.map((p,i)=>`<article class="event"><b class="mag">★</b><div><strong>${escape(p.name)}</strong><p>${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}</p></div><button class="remove" data-remove="${i}">Remover</button></article>`).join(''):'<p class="note">Você ainda não escolheu favoritos.</p>'}</section>`; }
function getSettings(){ try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return {...DEFAULT_SETTINGS}} }
function saveSettings(settings){ localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); applySettings(settings); scheduleUpdateAlarm(settings); }
function applySettings(settings=getSettings()){ document.documentElement.dataset.theme=settings.theme; document.documentElement.dataset.contrast=settings.highContrast?'alto':'normal'; document.documentElement.dataset.motion=settings.reduceMotion?'reduzido':'normal'; }
function notificationStatus(){ if(!('Notification'in window)) return 'Este navegador não oferece notificações.'; if(Notification.permission==='granted') return 'Notificações autorizadas neste aparelho.'; if(Notification.permission==='denied') return 'Notificações bloqueadas no navegador. Libere-as nas permissões do site.'; return 'Permissão ainda não concedida.'; }
async function sendUpdateAlarm(){
  await loadAll();
  if('Notification'in window&&Notification.permission==='granted') new Notification('Engmetclima · atualização', {body:`Dados atualizados para ${selected.name}. Abra o aplicativo para ver o resumo.`,tag:'engmetclima-update'});
}
function scheduleUpdateAlarm(settings=getSettings()){
  if(updateAlarmTimer){ clearInterval(updateAlarmTimer); updateAlarmTimer=null; }
  const delays={'a cada 30 minutos':30*60*1000,'a cada hora':60*60*1000};
  const delay=delays[settings.updateInterval];
  if(settings.updateAlarm&&delay&&'Notification'in window&&Notification.permission==='granted') updateAlarmTimer=setInterval(()=>void sendUpdateAlarm(),delay);
}
async function enableUpdateNotifications(){
  if(!('Notification'in window)){ alert('Este navegador não oferece notificações.'); return; }
  const permission=await Notification.requestPermission();
  const settings=getSettings();
  settings.updateAlarm=permission==='granted';
  saveSettings(settings);
  render();
}
function settingToggle(key,label,detail,settings){ return `<label class="setting-row"><span><strong>${label}</strong><small>${detail}</small></span><input type="checkbox" data-setting="${key}" ${settings[key]?'checked':''} /></label>`; }
function configuracoes(){
  const settings=getSettings(), user=JSON.parse(localStorage.getItem(USER_KEY)||'{}'), favorites=getFavorites();
  return `${head('Configurações','Preferências do seu Engmetclima')}<section class="stack">
    <h2>Conta</h2>
    ${card('Conta conectada',escape(user.email||'Não identificada'),`Profissão: ${escape(user.profession||'não informada')} · Nascimento: ${user.birthDate?new Date(`${user.birthDate}T12:00:00`).toLocaleDateString('pt-BR'):'não informado'}`)}
    <button class="secondary-action" id="settings-logout">Sair da conta</button>
    <h2>Localidades</h2>
    ${card('Favoritos salvos',`${favorites.length} localidade(s)`,`Aparecem como resumo na aba Tempo. ${selected.name} é a localidade atualmente analisada.`)}
    <button class="secondary-action" id="settings-favorites">Gerenciar favoritos</button>
    <h2>Alertas</h2>
    <div class="settings-panel">${settingToggle('alertsRain','Chuva forte e alagamentos','Exibir triagem para acumulados elevados de chuva.',settings)}${settingToggle('alertsWind','Vento e rajadas','Exibir triagem para ventos e rajadas fortes.',settings)}${settingToggle('alertsThunder','Raios e trovoadas','Exibir risco previsto de atividade elétrica.',settings)}${settingToggle('alertsSea','Mar grosso e ressaca','Exibir avisos marítimos e riscos costeiros.',settings)}${settingToggle('alertsEarthquake','Sismos fortes','Destacar terremotos de maior magnitude.',settings)}</div>
    <h2>Atualizações</h2>
    <div class="settings-panel"><label class="setting-select"><span><strong>Frequência de atualização</strong><small>As fontes atualizam em intervalos diferentes.</small></span><select data-setting="updateInterval"><option ${settings.updateInterval==='ao abrir'?'selected':''}>ao abrir</option><option ${settings.updateInterval==='a cada 30 minutos'?'selected':''}>a cada 30 minutos</option><option ${settings.updateInterval==='a cada hora'?'selected':''}>a cada hora</option></select></label>${settingToggle('updateAlarm','Alarme de atualização','Envia uma notificação quando o horário de atualização chegar.',settings)}${settingToggle('wifiOnly','Atualizar somente no Wi‑Fi','Preferência preparada para a versão instalada do aplicativo.',settings)}<button class="secondary-action" id="settings-enable-notifications">Habilitar notificações do aparelho</button><p class="setting-note">${notificationStatus()} Para receber alarmes, escolha 30 minutos ou 1 hora e mantenha o aplicativo aberto.</p><button class="secondary-action" id="settings-clear-cache">Limpar dados temporários e atualizar</button></div>
    <h2>Unidades</h2>
    <div class="settings-panel"><label class="setting-select"><span><strong>Temperatura</strong><small>Previsão e sensação térmica.</small></span><select data-setting="temperatureUnit"><option ${settings.temperatureUnit==='°C'?'selected':''}>°C</option><option ${settings.temperatureUnit==='°F'?'selected':''}>°F</option></select></label><label class="setting-select"><span><strong>Velocidade do vento</strong><small>Vento, rajadas e sistemas atmosféricos.</small></span><select data-setting="windUnit"><option ${settings.windUnit==='km/h'?'selected':''}>km/h</option><option ${settings.windUnit==='m/s'?'selected':''}>m/s</option><option ${settings.windUnit==='nós'?'selected':''}>nós</option></select></label><label class="setting-select"><span><strong>Chuva e acumulados</strong><small>Precipitação prevista e observada.</small></span><select data-setting="rainUnit"><option ${settings.rainUnit==='mm'?'selected':''}>mm</option><option ${settings.rainUnit==='polegadas'?'selected':''}>polegadas</option></select></label><label class="setting-select"><span><strong>Pressão atmosférica</strong><small>Pressão ao nível médio do mar.</small></span><select data-setting="pressureUnit"><option ${settings.pressureUnit==='hPa'?'selected':''}>hPa</option><option ${settings.pressureUnit==='mmHg'?'selected':''}>mmHg</option><option ${settings.pressureUnit==='inHg'?'selected':''}>inHg</option></select></label><label class="setting-select"><span><strong>Ondas</strong><small>Altura de ondas e marés.</small></span><select data-setting="waveUnit"><option ${settings.waveUnit==='m'?'selected':''}>m</option><option ${settings.waveUnit==='pés'?'selected':''}>pés</option></select></label><label class="setting-select"><span><strong>Distância</strong><small>Estações, localidades e coordenadas.</small></span><select data-setting="distanceUnit"><option ${settings.distanceUnit==='km'?'selected':''}>km</option><option ${settings.distanceUnit==='milhas'?'selected':''}>milhas</option></select></label><label class="setting-select"><span><strong>Formato de horário</strong><small>Horários de previsão, maré e astronomia.</small></span><select data-setting="timeFormat"><option ${settings.timeFormat==='24 horas'?'selected':''}>24 horas</option><option ${settings.timeFormat==='12 horas'?'selected':''}>12 horas</option></select></label></div>
    ${card('Padrões atuais escolhidos',`${settings.temperatureUnit} · ${settings.windUnit} · ${settings.rainUnit} · ${settings.pressureUnit}`,`Ondas: ${settings.waveUnit} · distância: ${settings.distanceUnit} · horário: ${settings.timeFormat}.`)}
    <h2>Mapa e globo</h2>
    <div class="settings-panel"><label class="setting-select"><span><strong>Estilo do globo</strong><small>Preferência visual salva para o próximo globo interativo.</small></span><select data-setting="globeStyle"><option ${settings.globeStyle==='científico'?'selected':''}>científico</option><option ${settings.globeStyle==='satélite realista'?'selected':''}>satélite realista</option><option ${settings.globeStyle==='híbrido'?'selected':''}>híbrido</option></select></label>${settingToggle('reduceMotion','Reduzir animações','Diminui efeitos de movimento no globo e na interface.',settings)}</div>
    <h2>Acessibilidade e aparência</h2>
    <div class="settings-panel"><label class="setting-select"><span><strong>Tema</strong><small>Escolha entre o visual escuro, claro ou o padrão do seu aparelho.</small></span><select data-setting="theme"><option ${settings.theme==='escuro'?'selected':''}>escuro</option><option ${settings.theme==='claro'?'selected':''}>claro</option><option ${settings.theme==='sistema'?'selected':''}>sistema</option></select></label>${settingToggle('highContrast','Alto contraste','Aumenta a separação visual entre textos e painéis.',settings)}</div>
    <h2>Dados e fontes</h2>
    <article class="notice"><strong>Fontes consultadas</strong><p>INMET, Marinha do Brasil, CEMADEN, USGS, NOAA, NASA EONET, Open-Meteo e demais fontes oficiais indicadas em cada aba. Dados previstos, observados e educativos podem ter horários de atualização diferentes.</p></article>
  </section>`;
}
function alerts(){ const list=buildAlerts(); return `${head('Central de alertas','Triagem automática e consulta aos órgãos oficiais')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade monitorada</p><div class="search"><input id="alerts-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="alerts-location-search">Buscar</button></div><p class="picker-current">Exibindo alertas para <strong>${escape(selected.name)}</strong></p><div id="alerts-location-results" class="list"></div></div>${list.map(a=>`<article class="alert ${a.level}"><small>${a.level==='green'?'SEM ALERTA AUTOMÁTICO':'ATENÇÃO'}</small><strong>${a.title}</strong><p>${a.detail}</p></article>`).join('')}<a class="link-card" href="https://alertas2.inmet.gov.br/" target="_blank">INMET · Avisos meteorológicos</a><a class="link-card" href="https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo" target="_blank">Marinha · Avisos de mau tempo</a><a class="link-card" href="https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil" target="_blank">Defesa Civil · Orientações</a></section>`; }
function oportunidades(){ const cards=[['Cursos e capacitações','INPE / CPTEC','Cursos técnicos em previsão do tempo, nowcasting e emissão de alertas. Verifique o calendário e os requisitos da turma atual.','https://www.gov.br/inpe/pt-br/assuntos/ultimas-noticias'],['Cursos ambientais','ANA · Ambiente Virtual de Aprendizagem','Formações em recursos hídricos, educação ambiental e gestão da água.','https://www.gov.br/ana/pt-br/assuntos/capacitacao'],['Cursos ambientais','Escolas de governo e órgãos ambientais','Acompanhe formações gratuitas ou de extensão em meio ambiente, clima e políticas públicas.','https://www.gov.br/mma/pt-br/assuntos/educacaoambiental'],['Mestrados públicos','UNIFAL-MG · Ciências Ambientais','Acompanhe editais do Programa de Pós-Graduação em Ciências Ambientais e confirme o prazo da seleção vigente.','https://www.unifal-mg.edu.br/portal/2026/06/22/mestrado-em-ciencias-ambientais-4/'],['Mestrados públicos','UFPel · Ciências Ambientais','Consulte o programa para chamadas de mestrado e doutorado em ciências ambientais.','https://wp.ufpel.edu.br/ppgcamb/'],['Concursos e seleções','NAV Brasil · Meteorologista','Edital e cronograma para o cargo de meteorologista devem ser conferidos diretamente na página oficial.','https://www.navbrasil.gov.br/wp-content/uploads/2026/05/edital-01-2026-nav-brasil_retificado_08_05.pdf'],['Concursos e seleções','CEMADEN · Oportunidades','Bolsas, estágios, seleções e editais relacionados a monitoramento e desastres naturais.','https://www.gov.br/cemaden/pt-br/acesso-a-informacao/oportunidades'],['Concursos e seleções','MMA, IBAMA e ICMBio','Portais oficiais para editais e processos seletivos na área ambiental.','https://www.gov.br/mma/pt-br/acesso-a-informacao/concursos-publicos']]; return `${head('Oportunidades','Cursos, pós-graduação e seleções em meteorologia, ciências e meio ambiente')}<section class="stack"><article class="notice"><strong>Consulta responsável</strong><p>Este painel reúne fontes oficiais. Sempre confirme o edital, os requisitos e a data de encerramento na página da instituição antes de se inscrever.</p></article><div class="stats"><div><b>3</b><small>fontes de cursos</small></div><div><b>2</b><small>programas públicos</small></div><div><b>3</b><small>portais de seleções</small></div><div><b>Hoje</b><small>última revisão</small></div></div>${cards.map(([type,title,detail,url])=>`<a class="link-card" href="${url}" target="_blank" rel="noopener"><small>${type}</small><br><strong>${title}</strong><br><span>${detail}</span></a>`).join('')}<article class="notice"><strong>Atualizações automáticas</strong><p>Para listar somente inscrições abertas todos os dias, o Engmetclima precisará de um serviço no servidor que pesquise, valide prazos e registre fontes oficiais. Isso evita que um edital encerrado apareça como aberto.</p></article></section>`; }
const GUIDE_CONCEPTS=[
  ['Tempo × clima','tempo, clima, previsão','Tempo é o estado da atmosfera agora ou nos próximos dias. Clima descreve os padrões de uma região ao longo de muitos anos.'],
  ['Temperatura e sensação térmica','temperatura, sensação, calor, frio','A sensação combina temperatura, umidade e vento. Com muito vento, o corpo pode perder calor mais rápido; com umidade alta, o suor evapora com mais dificuldade.'],
  ['Umidade relativa','umidade, ar seco, vapor','É a porcentagem de vapor d’água no ar em relação ao máximo que ele consegue manter naquela temperatura. Ela costuma cair durante as horas mais quentes.'],
  ['Pressão atmosférica','pressão, alta pressão, baixa pressão, anticiclone','É o peso do ar sobre uma área. Áreas de baixa pressão costumam favorecer convergência, nuvens e instabilidade; altas pressões, em geral, favorecem tempo mais estável.'],
  ['Vento e rajada','vento, rajada, direção','Vento tem velocidade e direção. Rajada é um aumento breve da velocidade, por isso pode ser maior que o vento sustentado mostrado no mesmo horário.'],
  ['Nuvens, chuva e trovoadas','nuvem, chuva, trovoada, tempestade, precipitação','Chuva é a precipitação medida em milímetros. A probabilidade de chuva informa a chance de ocorrer precipitação. Trovoadas precisam de convecção e eletricidade atmosférica; acompanhe avisos oficiais.'],
  ['Frente fria','frente fria, massa de ar','É a faixa de transição em que uma massa de ar frio avança sobre uma área mais quente. Pode provocar chuva, vento e queda de temperatura após a passagem.'],
  ['Cavado meteorológico','cavado, trough, baixa pressão alongada','Em meteorologia, cavado é uma área alongada de menor pressão ou menor altura geopotencial. Ele pode favorecer convergência de ar, nebulosidade, chuva e instabilidade, dependendo da umidade e de outros sistemas atuando na região.'],
  ['Índice UV','uv, ultravioleta, sol','Indica a intensidade da radiação ultravioleta solar. Quanto maior o índice, maior a necessidade de proteção contra exposição ao Sol.'],
  ['AQI e ozônio','aqi, qualidade do ar, ozônio, poluição','AQI é o índice que resume a qualidade do ar: quanto maior, maior a preocupação. O ozônio na estratosfera protege contra UV; já o ozônio perto do solo é um poluente que pode irritar as vias respiratórias.'],
  ['Ondas, maré e ressaca','onda, ondas, maré, marea, ressaca, swell, mar grosso','Ondas dependem de vento, swell e outras condições do mar. Maré é principalmente astronômica. Ressaca é a chegada de ondulação forte à costa — mesmo se o vento local estiver fraco.'],
  ['Ciclone e anticiclone','ciclone, anticiclone, furacão, furacao, tufão, tufao','Ciclone é uma área de baixa pressão e anticiclone, de alta pressão. Furacão e tufão são nomes regionais para ciclones tropicais intensos.'],
  ['Alertas e previsão','alerta, aviso, inmet, marinha','Dados observados, previsão de modelos e avisos oficiais não são a mesma coisa. Para segurança, dê prioridade a INMET, Marinha e Defesa Civil.'],
  ['Meteoro, meteoróide e meteorito','meteoro, meteoroide, meteoróide, meteorito, estrela cadente, chuva de meteoros','Meteoro é o brilho produzido quando um fragmento vindo do espaço entra na atmosfera. Se parte do material alcança o solo, recebe o nome de meteorito. “Estrela cadente” é o nome popular de um meteoro.']
];
function guiaPesquisa(){ return `${head('Guia de conceitos','Pesquise e entenda termos de meteorologia e meio ambiente')}<section class="stack"><div class="location-picker"><p class="picker-label">Pesquisar conceito</p><div class="search"><input id="guide-search-query" placeholder="Ex.: maré, umidade, ciclone ou ozônio" /><button id="guide-search-button">Buscar</button></div><p class="picker-current">Digite uma palavra para receber uma explicação breve.</p><div id="guide-search-results" class="stack"></div></div><article class="notice"><strong>Como usar este guia</strong><p>Os conceitos ajudam a interpretar os cartões do Engmetclima, mas não substituem avisos oficiais nem orientação de autoridades locais.</p></article>${GUIDE_CONCEPTS.map(([title,,detail])=>card(title,title,detail)).join('')}<h2>Fontes para estudar</h2><a class="link-card" href="https://portal.inmet.gov.br/sobre-meteorologia/meteorologia-b%C3%A1sica" target="_blank" rel="noopener">INMET · Meteorologia básica</a><a class="link-card" href="https://portal.inmet.gov.br/glossario/massa-de-ar" target="_blank" rel="noopener">INMET · Glossário meteorológico</a><a class="link-card" href="https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics" target="_blank" rel="noopener">EPA · Ozônio ao nível do solo</a></section>`; }
function guia(){ return guiaPesquisa(); }
function lua(){ const d=new Date(), syn=29.53059, age=((d-new Date('2026-01-18T19:52:00Z'))/86400000%syn+syn)%syn, illumination=(1-Math.cos(2*Math.PI*age/syn))/2; const phase=age<1.85?'Lua nova':age<9.23?'Crescente':age<18.46?'Lua cheia':'Minguante'; return `${head('Astronomia','Lua e Sol para a localidade selecionada')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade astronômica</p><div class="search"><input id="moon-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="moon-location-search">Buscar</button></div><p class="picker-current">Exibindo dados para <strong>${escape(selected.name)}</strong></p><div id="moon-location-results" class="list"></div></div>${card('Lua hoje',`🌙 ${phase}`,`${(illumination*100).toFixed(1)}% iluminada · idade ${age.toFixed(1)} dias · ${escape(selected.name)}`) }${card('Distância Terra–Lua','≈ 384.400 km','Estimativa astronômica. A distância é global; os horários de nascer e pôr dependem da localidade escolhida.')}${card('Sol','Dados por localidade',`Nascer, pôr, altura e azimute serão calculados para ${escape(selected.name)} durante a expansão de Astronomia.`)}</section>`; }
function astroClock(){ const offset=Number(weather?.utc_offset_seconds||0); return {local:new Date(Date.now()+offset*1000),offset}; }
function astroTime(value){ return value?String(value).split('T')[1]?.slice(0,5)||'—':'—'; }
function solarPosition(latitude,longitude,date,offsetSeconds){ const local=new Date(date.getTime()+offsetSeconds*1000),start=new Date(Date.UTC(local.getUTCFullYear(),0,0)),day=Math.floor((Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-start)/86400000),hour=local.getUTCHours()+local.getUTCMinutes()/60+local.getUTCSeconds()/3600,gamma=2*Math.PI/365*(day-1+(hour-12)/24),eq=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma)),decl=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma),timeOffset=eq+4*longitude-60*(offsetSeconds/3600),minutes=(hour*60+timeOffset+1440)%1440,angle=(minutes/4-180)*Math.PI/180,lat=latitude*Math.PI/180,zenith=Math.acos(Math.max(-1,Math.min(1,Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(angle)))),elevation=90-zenith*180/Math.PI,azimuth=(Math.atan2(Math.sin(angle),Math.cos(angle)*Math.sin(lat)-Math.tan(decl)*Math.cos(lat))*180/Math.PI+180+360)%360; return {elevation,azimuth}; }
function luaLocationAware(){ const d=new Date(),syn=29.53059,age=((d-new Date('2026-01-18T19:52:00Z'))/86400000%syn+syn)%syn,illumination=(1-Math.cos(2*Math.PI*age/syn))/2,phase=age<1.85?'Lua nova':age<9.23?'Crescente':age<18.46?'Lua cheia':'Minguante',clock=astroClock(),daily=weather?.daily,sun=solarPosition(selected.latitude,selected.longitude,d,clock.offset),localTime=clock.local.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}),localDate=clock.local.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}); return `${head('Astronomia','Lua e Sol calculados para a localidade selecionada')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade astronômica</p><div class="search"><input id="moon-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="moon-location-search">Buscar</button></div><p class="picker-current">Exibindo dados para <strong>${escape(selected.name)}</strong></p><div id="moon-location-results" class="list"></div></div>${card('Horário local',localTime,`${localDate} · ${escape(selected.name)}`)}${card('Lua agora',`🌙 ${phase}`,`${(illumination*100).toFixed(1)}% iluminada · idade ${age.toFixed(1)} dias. A fase lunar é global; os dados solares abaixo usam a localidade escolhida.`)}${card('Sol na localidade',daily?`${astroTime(daily.sunrise?.[0])} → ${astroTime(daily.sunset?.[0])}`:'Calculando…',daily?`Nascer e pôr do Sol em ${escape(selected.name)}.`:'Consultando a previsão astronômica desta localidade.')}${card('Posição solar agora',`${sun.elevation.toFixed(1)}° de altura`,`Azimute ${sun.azimuth.toFixed(0)}° · cálculo em tempo real para latitude ${selected.latitude.toFixed(3)}° e longitude ${selected.longitude.toFixed(3)}°.`)}</section>`; }
function atlasKey(value){ return String(value||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
const INMET_LUA_2026=[['2026-01-03T07:04:00-03:00','Lua cheia'],['2026-01-10T12:49:00-03:00','Lua minguante'],['2026-01-18T16:53:00-03:00','Lua nova'],['2026-01-26T01:48:00-03:00','Lua crescente'],['2026-02-01T19:10:00-03:00','Lua cheia'],['2026-02-09T09:44:00-03:00','Lua minguante'],['2026-02-17T09:03:00-03:00','Lua nova'],['2026-02-24T09:28:00-03:00','Lua crescente'],['2026-03-03T08:39:00-03:00','Lua cheia'],['2026-03-11T06:41:00-03:00','Lua minguante'],['2026-03-18T22:26:00-03:00','Lua nova'],['2026-03-25T16:19:00-03:00','Lua crescente'],['2026-04-01T23:13:00-03:00','Lua cheia'],['2026-04-10T01:55:00-03:00','Lua minguante'],['2026-04-17T08:54:00-03:00','Lua nova'],['2026-04-23T23:33:00-03:00','Lua crescente'],['2026-05-01T14:24:00-03:00','Lua cheia'],['2026-05-09T18:13:00-03:00','Lua minguante'],['2026-05-16T17:03:00-03:00','Lua nova'],['2026-05-23T08:12:00-03:00','Lua crescente'],['2026-05-31T05:46:00-03:00','Lua cheia'],['2026-06-08T07:03:00-03:00','Lua minguante'],['2026-06-14T23:56:00-03:00','Lua nova'],['2026-06-21T18:55:00-03:00','Lua crescente'],['2026-06-29T20:58:00-03:00','Lua cheia'],['2026-07-07T16:30:00-03:00','Lua minguante'],['2026-07-14T06:45:00-03:00','Lua nova'],['2026-07-21T08:05:00-03:00','Lua crescente'],['2026-07-29T11:37:00-03:00','Lua cheia'],['2026-08-05T23:22:00-03:00','Lua minguante'],['2026-08-12T14:37:00-03:00','Lua nova'],['2026-08-19T23:46:00-03:00','Lua crescente'],['2026-08-28T01:19:00-03:00','Lua cheia'],['2026-09-04T04:52:00-03:00','Lua minguante'],['2026-09-11T00:27:00-03:00','Lua nova'],['2026-09-18T17:44:00-03:00','Lua crescente'],['2026-09-26T13:50:00-03:00','Lua cheia'],['2026-10-03T10:26:00-03:00','Lua minguante'],['2026-10-10T12:50:00-03:00','Lua nova'],['2026-10-18T13:13:00-03:00','Lua crescente'],['2026-10-26T01:13:00-03:00','Lua cheia'],['2026-11-01T17:30:00-03:00','Lua minguante'],['2026-11-09T04:02:00-03:00','Lua nova'],['2026-11-17T08:48:00-03:00','Lua crescente'],['2026-11-24T11:55:00-03:00','Lua cheia'],['2026-12-01T03:10:00-03:00','Lua minguante'],['2026-12-08T21:52:00-03:00','Lua nova'],['2026-12-17T02:43:00-03:00','Lua crescente'],['2026-12-23T22:29:00-03:00','Lua cheia'],['2026-12-30T16:00:00-03:00','Lua minguante']].map(([date,phase])=>({date:new Date(date),phase}));
function inmetMoonInfo(date){ const current=[...INMET_LUA_2026].filter(item=>item.date<=date).at(-1)||INMET_LUA_2026[0],next=INMET_LUA_2026.find(item=>item.date>date); return {current,next}; }
function luaInmet(){ const d=new Date(),clock=astroClock(),daily=weather?.daily,sun=solarPosition(selected.latitude,selected.longitude,d,clock.offset),moon=inmetMoonInfo(d),localTime=clock.local.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}),localDate=clock.local.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}),formatPhase=item=>item?`${item.phase} · ${item.date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})} às ${item.date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}`:'Calendário do próximo ano ainda não publicado'; return `${head('Astronomia','Lua e Sol calculados para a localidade selecionada')}<section class="stack"><div class="location-picker"><p class="picker-label">Localidade astronômica</p><div class="search"><input id="moon-location-query" placeholder="Pesquise uma cidade, como Rio de Janeiro" /><button id="moon-location-search">Buscar</button></div><p class="picker-current">Exibindo dados para <strong>${escape(selected.name)}</strong></p><div id="moon-location-results" class="list"></div></div>${card('Horário local',localTime,`${localDate} · ${escape(selected.name)}`)}${card('Fase da Lua',moon.current.phase,`Fase oficial mais recente: ${formatPhase(moon.current)}.`)}${card('Próxima fase',moon.next?moon.next.phase:'—',formatPhase(moon.next))}${card('Sol na localidade',daily?`${astroTime(daily.sunrise?.[0])} → ${astroTime(daily.sunset?.[0])}`:'Calculando…',daily?`Nascer e pôr do Sol em ${escape(selected.name)}.`:'Consultando a previsão astronômica desta localidade.')}${card('Posição solar agora',`${sun.elevation.toFixed(1)}° de altura`,`Azimute ${sun.azimuth.toFixed(0)}° · cálculo em tempo real para latitude ${selected.latitude.toFixed(3)}° e longitude ${selected.longitude.toFixed(3)}°.`)}<a class="link-card" href="https://portal.inmet.gov.br/paginas/luas" target="_blank" rel="noopener">INMET · Calendário oficial de fases da Lua</a><p class="note">As fases são globais no instante em que ocorrem; horário local e posição do Sol variam conforme a localidade selecionada.</p></section>`; }
function atlasValue(raw, candidates){ const key=atlasColumns.find(column=>candidates.some(candidate=>column===candidate || column.includes(candidate))); return key ? raw[key] : ''; }
function atlasNumber(value){ const source=String(value??'').trim(); if(!source) return 0; const compact=source.replace(/[^0-9,.-]/g,''); const normalized=compact.includes(',') ? compact.replace(/\\./g,'').replace(',', '.') : compact.replace(/,/g,''); const number=Number(normalized); return Number.isFinite(number)?number:0; }
function csvRecord(line, delimiter){ const values=[]; let value='', quoted=false; for(let index=0;index<line.length;index+=1){ const char=line[index]; if(char==='"'){ if(quoted&&line[index+1]==='"'){ value+='"'; index+=1; } else quoted=!quoted; } else if(char===delimiter&&!quoted){ values.push(value); value=''; } else value+=char; } values.push(value); return values; }
function mapAtlasRow(values){ const raw={}; atlasColumns.forEach((column,index)=>{ raw[column]=values[index]??''; }); const publicLoss=atlasNumber(atlasValue(raw,['prejuizo publico','prejuizos publicos'])); const privateLoss=atlasNumber(atlasValue(raw,['prejuizo privado','prejuizos privados'])); const totalLoss=atlasNumber(atlasValue(raw,['prejuizo total','prejuizos','valor prejuizo'])); return { uf:atlasValue(raw,['sigla uf','uf','estado']), city:atlasValue(raw,['municipio','nome municipio']), year:atlasValue(raw,['ano ocorrencia','ano']), type:atlasValue(raw,['tipo desastre','tipologia','desastre']), deaths:atlasNumber(atlasValue(raw,['mortos','obitos','obito'])), affected:atlasNumber(atlasValue(raw,['afetados','pessoas afetadas','populacao afetada'])), losses:totalLoss||publicLoss+privateLoss }; }
function parseAtlasCsv(text){ const firstLine=text.split(/\\r?\\n/,1)[0]||''; const delimiter=(firstLine.match(/;/g)||[]).length>=(firstLine.match(/,/g)||[]).length?';':','; const lines=text.split(/\\r?\\n/).filter(Boolean); atlasColumns=csvRecord(lines.shift()||'',delimiter).map(atlasKey); atlasRows=lines.map(line=>mapAtlasRow(csvRecord(line,delimiter))).filter(row=>row.uf||row.city||row.type); }
function uniqueAtlasValues(key){ return [...new Set(atlasRows.map(row=>String(row[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')); }
function filteredAtlasRows(){ const city=atlasKey(atlasFilters.city); return atlasRows.filter(row=>(!atlasFilters.uf||row.uf===atlasFilters.uf)&&(!atlasFilters.year||String(row.year)===String(atlasFilters.year))&&(!atlasFilters.type||row.type===atlasFilters.type)&&(!city||atlasKey(row.city).includes(city))); }
function atlasSummary(rows){ return rows.reduce((total,row)=>({total:total.total+1,deaths:total.deaths+Number(row.deaths||0),affected:total.affected+Number(row.affected||0),losses:total.losses+Number(row.losses||0)}),{total:0,deaths:0,affected:0,losses:0}); }
function formatNumber(value){ return Number(value||0).toLocaleString('pt-BR'); }
function formatMoney(value){ const number=Number(value||0); return number>=1000000?`R$ ${(number/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})} mi`:number?`R$ ${number.toLocaleString('pt-BR',{maximumFractionDigits:0})}`:'R$ 0'; }
async function importAtlasFile(file){ atlasStatus='Lendo a base oficial do Atlas…'; render(); try{ parseAtlasCsv(await file.text()); atlasStatus=`Base oficial carregada: ${atlasRows.length.toLocaleString('pt-BR')} registros disponíveis para filtro.`; }catch{ atlasRows=[]; atlasColumns=[]; atlasStatus='Não foi possível ler este arquivo. Baixe o CSV oficial do Atlas e tente novamente.'; } render(); }
function wireDisasterFilters(){ document.querySelector('#atlas-file-button')?.addEventListener('click',()=>document.querySelector('#atlas-file')?.click()); document.querySelector('#atlas-file')?.addEventListener('change',event=>{ const file=event.target.files?.[0]; if(file) void importAtlasFile(file); }); document.querySelector('#atlas-apply')?.addEventListener('click',()=>{ atlasFilters={uf:document.querySelector('#atlas-uf')?.value||'',year:document.querySelector('#atlas-year')?.value||'',type:document.querySelector('#atlas-type')?.value||'',city:document.querySelector('#atlas-city')?.value||''}; render(); }); }
function view(){ return {inicio:home,tempo,guia,oportunidades,oceano,raios,terra,ciclones,desastres:desastresView,clima,globo:globe,favoritos:favorites,alertas:alerts,lua:luaInmet,configuracoes}[active](); }
function render(){ app.innerHTML=`<main class="mobile-shell">${view()}</main>${nav()}`; document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{active=b.dataset.tab;render()}); document.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>{selected=LOCATIONS.find(x=>x.id===b.dataset.location) || selected; loadLocation();render()}); document.querySelectorAll('[data-favorite-weather]').forEach(button=>button.onclick=async()=>{const place=getFavorites()[Number(button.dataset.favoriteWeather)]; if(!place) return; selected={id:`favorite-${place.latitude}-${place.longitude}`,name:place.name,latitude:place.latitude,longitude:place.longitude,marine:true}; weather=null;air=null;marine=null;render();await loadAll();}); document.querySelector('#logout')?.addEventListener('click',()=>{localStorage.removeItem(USER_KEY);login()}); document.querySelector('#refresh')?.addEventListener('click',()=>{favoriteWeather={};void loadAll()}); document.querySelector('#use-location')?.addEventListener('click',()=>void requestCurrentLocation()); document.querySelector('#globe-toggle')?.addEventListener('click',()=>{globePaused=!globePaused;render()}); document.querySelector('#disaster-country')?.addEventListener('change',event=>{disasterCountryFilter=event.target.value;render()}); document.querySelector('#show-el-nino')?.addEventListener('click',()=>{ensoMode='el-nino';render()}); document.querySelector('#show-la-nina')?.addEventListener('click',()=>{ensoMode='la-nina';render()}); document.querySelectorAll('[data-setting]').forEach(control=>control.addEventListener('change',()=>{const settings=getSettings(); settings[control.dataset.setting]=control.type==='checkbox'?control.checked:control.value; saveSettings(settings); })); document.querySelector('#settings-logout')?.addEventListener('click',()=>{localStorage.removeItem(USER_KEY);login()}); document.querySelector('#settings-favorites')?.addEventListener('click',()=>{active='favoritos';render()}); document.querySelector('#settings-enable-notifications')?.addEventListener('click',()=>void enableUpdateNotifications()); document.querySelector('#settings-clear-cache')?.addEventListener('click',()=>{favoriteWeather={}; void loadAll();}); if(active==='favoritos') wireFavorites(); if(active==='tempo') { wireWeatherLocationSearch(); wireFavoriteCarousel(); void loadFavoriteWeather(); } if(active==='oceano') wireOceanLocationSearch(); if(active==='raios') wireLightningLocationSearch(); if(active==='desastres') wireRiskLocationSearch(); if(active==='lua') wireMoonLocationSearch(); if(active==='alertas') wireAlertsLocationSearch(); if(active==='globo') setTimeout(mountInteractiveGlobe,0); }
function account(){ try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'null')}catch{return null} }
async function passwordFingerprint(value){
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  return btoa(unescape(encodeURIComponent(value)));
}
function login(mode='signin', message=''){
  const saved=account();
  const email=localStorage.getItem(LAST_EMAIL_KEY)||saved?.email||'';
  const create=mode==='create';
  const reset=mode==='reset';
  app.innerHTML=`<section class="login"><form class="login-card" id="login-form"><div class="mark">◌</div><p class="eyebrow">Atmosfera, oceano e Terra</p><h1>${reset?'Redefinir senha':create?'Criar conta':'Entrar no Engmetclima'}</h1><p class="subtle">${reset?'O código de redefinição será enviado ao e-mail cadastrado quando conectarmos o serviço de autenticação.':create?'Preencha os dados abaixo para criar seu perfil no aplicativo.':'Seu e-mail fica salvo neste navegador; informe apenas a senha para entrar.'}</p><label class="field">E-mail<input name="email" type="email" value="${escape(email)}" autocomplete="email" required ${reset?'':'autofocus'} /></label>${create?`<label class="field">Data de nascimento<input name="birthDate" type="date" autocomplete="bday" required /></label><label class="field">Profissão<input name="profession" type="text" maxlength="80" autocomplete="organization-title" placeholder="Ex.: estudante de Engenharia Meteorológica" required /></label>`:''}${reset?'':`<label class="field">Senha<input name="pass" type="password" minlength="6" autocomplete="current-password" required /></label>`}<p class="error" id="login-error">${message}</p><button class="primary">${reset?'Enviar código por e-mail':create?'Criar conta':'Entrar no aplicativo'}</button>${!reset?`<button class="text-button" type="button" id="reset-password">Esqueci minha senha</button>`:''}${create?`<button class="text-button" type="button" id="back-login">Já tenho uma conta</button>`:`<button class="text-button" type="button" id="create-account">Criar conta</button>`}</form></section>`;
  document.querySelector('#create-account')?.addEventListener('click',()=>login('create'));
  document.querySelector('#back-login')?.addEventListener('click',()=>login('signin'));
  document.querySelector('#reset-password')?.addEventListener('click',()=>login('reset'));
  document.querySelector('#login-form').onsubmit=async event=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget), email=String(data.get('email')).trim().toLowerCase();
    if(reset){ login('reset','O envio por e-mail precisa ser conectado a um serviço de autenticação antes de poder ser ativado com segurança.'); return; }
    const pass=String(data.get('pass'));
    const current=account();
    if(create){
      if(current){ login('signin','Já existe uma conta neste navegador.'); return; }
      const birthDate=String(data.get('birthDate')||'').trim(), profession=String(data.get('profession')||'').trim();
      if(!birthDate||!profession){ login('create','Informe a data de nascimento e a profissão para criar a conta.'); return; }
      localStorage.setItem(ACCOUNT_KEY,JSON.stringify({email,birthDate,profession,password:await passwordFingerprint(pass)}));
    } else {
      if(!current){ login('create','Crie a primeira conta para continuar.'); return; }
      if(current.email!==email || current.password!==await passwordFingerprint(pass)){ login('signin','E-mail ou senha incorretos.'); return; }
    }
    localStorage.setItem(LAST_EMAIL_KEY,email);
    const profile=account()||{};
    localStorage.setItem(USER_KEY,JSON.stringify({name:email.split('@')[0],email,birthDate:profile.birthDate||'',profession:profile.profession||''}));
    start();
    void requestCurrentLocation();
  };
}
function wireWeatherLocationSearch(){
  const button=document.querySelector('#weather-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#weather-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#weather-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-weather-place="${index}">Ver tempo</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-weather-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.weatherPlace)];
        selected={id:`search-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
function wireOceanLocationSearch(){
  const button=document.querySelector('#ocean-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#ocean-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#ocean-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-ocean-place="${index}">Ver oceano</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-ocean-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.oceanPlace)];
        selected={id:`ocean-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
function wireLightningLocationSearch(){
  const button=document.querySelector('#lightning-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#lightning-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#lightning-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-lightning-place="${index}">Ver raios</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-lightning-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.lightningPlace)];
        selected={id:`lightning-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
function wireRiskLocationSearch(){
  const button=document.querySelector('#risk-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#risk-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#risk-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-risk-place="${index}">Ver riscos</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-risk-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.riskPlace)];
        selected={id:`risk-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
function wireGuideSearch(){
  const input=document.querySelector('#guide-search-query'),button=document.querySelector('#guide-search-button'),results=document.querySelector('#guide-search-results');
  if(!input||!button||!results) return;
  const search=()=>{ const query=atlasKey(input.value); if(!query){ results.innerHTML='<p class="note">Digite um conceito, como “maré”.</p>'; return; } const matches=GUIDE_CONCEPTS.filter(([title,terms,detail])=>atlasKey(`${title} ${terms} ${detail}`).includes(query) || query.split(' ').some(word=>atlasKey(`${title} ${terms}`).includes(word))); results.innerHTML=matches.length?matches.map(([title,,detail])=>card(title,'Significado',detail)).join(''):`<article class="notice"><strong>Conceito ainda não encontrado</strong><p>Experimente uma palavra mais curta, como “vento”, “maré”, “chuva”, “ozônio” ou “ciclone”.</p></article>`; };
  button.onclick=search;
  input.addEventListener('keydown',event=>{ if(event.key==='Enter') search(); });
}
function searchGuideConcepts(){ const input=document.querySelector('#guide-search-query'),results=document.querySelector('#guide-search-results'); if(!input||!results) return; const query=atlasKey(input.value); if(!query){ results.innerHTML='<p class="note">Digite um conceito, como “maré”.</p>'; return; } const matches=GUIDE_CONCEPTS.filter(([title,terms,detail])=>atlasKey(`${title} ${terms} ${detail}`).includes(query) || query.split(' ').some(word=>atlasKey(`${title} ${terms}`).includes(word))); results.innerHTML=matches.length?matches.map(([title,,detail])=>card(title,'Significado',detail)).join(''):`<article class="notice"><strong>Conceito ainda não encontrado</strong><p>Experimente uma palavra mais curta, como “vento”, “maré”, “chuva”, “ozônio” ou “ciclone”.</p></article>`; }
async function searchGuideConceptsOnline(){ const input=document.querySelector('#guide-search-query'),results=document.querySelector('#guide-search-results'); if(!input||!results) return; const query=atlasKey(input.value); if(!query){ results.innerHTML='<p class="note">Digite um conceito, como “maré”.</p>'; return; } const matches=GUIDE_CONCEPTS.filter(([title,terms,detail])=>atlasKey(`${title} ${terms} ${detail}`).includes(query) || query.split(' ').some(word=>atlasKey(`${title} ${terms}`).includes(word))); if(matches.length){ results.innerHTML=matches.map(([title,,detail])=>card(title,'Significado',detail)).join(''); return; } results.innerHTML='<p class="note">Consultando uma referência complementar…</p>'; try{ const response=await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(input.value.trim())}&format=json&origin=*&srlimit=1`); const data=await response.json(); const result=data?.query?.search?.[0]; if(!result){ results.innerHTML=`<article class="notice"><strong>Termo não encontrado</strong><p>Ainda não encontrei uma explicação confiável para “${escape(input.value.trim())}”. Tente outra escrita ou consulte uma fonte especializada.</p></article>`; return; } const text=String(result.snippet||'').replace(/<[^>]*>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&'); const url=`https://pt.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g,'_'))}`; results.innerHTML=`${card(result.title,'Referência complementar',text||'Abra a fonte para ver a explicação completa.')}<a class="link-card" href="${url}" target="_blank" rel="noopener">Abrir referência complementar</a><p class="note">Para conceitos do Engmetclima, priorize as fontes oficiais indicadas no fim desta página.</p>`; }catch{ results.innerHTML='<article class="notice"><strong>Não foi possível consultar agora</strong><p>Confira sua conexão ou tente novamente. Os conceitos já cadastrados no Guia continuam disponíveis.</p></article>'; } }
async function searchGuideConceptsDicio(){ const input=document.querySelector('#guide-search-query'),results=document.querySelector('#guide-search-results'); if(!input||!results) return; const word=input.value.trim(); if(!word){ results.innerHTML='<p class="note">Digite uma palavra para pesquisar no dicionário.</p>'; return; } results.innerHTML='<p class="note">Consultando o Dicio…</p>'; try{ const response=await fetch(`/api/dicionario?palavra=${encodeURIComponent(word)}`); const data=await response.json(); if(response.ok&&data.definition){ results.innerHTML=`${card(data.word,'Significado · Dicio',escape(data.definition))}<a class="link-card" href="${data.source}" target="_blank" rel="noopener">Abrir verbete completo no Dicio</a>`; return; } throw new Error(data.error||'Verbete indisponível'); }catch{ const query=atlasKey(word),matches=GUIDE_CONCEPTS.filter(([title,terms,detail])=>atlasKey(`${title} ${terms} ${detail}`).includes(query) || query.split(' ').some(term=>atlasKey(`${title} ${terms}`).includes(term))); const source=`https://www.dicio.com.br/${encodeURIComponent(query.replace(/\s+/g,'-'))}/`; results.innerHTML=matches.length?`${matches.map(([title,,detail])=>card(title,'Explicação do Guia',detail)).join('')}<a class="link-card" href="${source}" target="_blank" rel="noopener">Pesquisar este verbete no Dicio</a>`:`<article class="notice"><strong>Verbete indisponível agora</strong><p>Não foi possível obter a definição de “${escape(word)}”. Tente novamente ou abra o Dicio para consultar o termo.</p></article><a class="link-card" href="${source}" target="_blank" rel="noopener">Abrir Dicio</a>`; } }
document.addEventListener('click',event=>{ if(event.target?.id==='guide-search-button') void searchGuideConceptsDicio(); });
document.addEventListener('keydown',event=>{ if(event.key==='Enter'&&event.target?.id==='guide-search-query') void searchGuideConceptsDicio(); });
function wireMoonLocationSearch(){
  const button=document.querySelector('#moon-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#moon-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#moon-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-moon-place="${index}">Ver Lua</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-moon-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.moonPlace)];
        selected={id:`moon-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
function wireAlertsLocationSearch(){
  const button=document.querySelector('#alerts-location-search');
  if(!button) return;
  button.onclick=async()=>{
    const query=document.querySelector('#alerts-location-query').value.trim();
    if(!query) return;
    const results=document.querySelector('#alerts-location-results');
    results.innerHTML='<p class="note">Pesquisando localidade…</p>';
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`);
      const data=await response.json();
      results.innerHTML=(data.results||[]).map((place,index)=>`<article class="event"><div><strong>${escape([place.name,place.admin1,place.country].filter(Boolean).join(' — '))}</strong><p>${place.latitude.toFixed(3)}, ${place.longitude.toFixed(3)}</p></div><button class="remove" data-alerts-place="${index}">Ver alertas</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';
      document.querySelectorAll('[data-alerts-place]').forEach(item=>item.onclick=async()=>{
        const place=data.results[Number(item.dataset.alertsPlace)];
        selected={id:`alerts-${place.id}`,name:[place.name,place.admin1,place.country].filter(Boolean).join(' — '),latitude:place.latitude,longitude:place.longitude,marine:true};
        weather=null; air=null; marine=null;
        render();
        await loadAll();
      });
    }catch{ results.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'; }
  };
}
async function loadLocation(){ const l=selected; const marineUrl=l.marine?`https://marine-api.open-meteo.com/v1/marine?latitude=${l.latitude}&longitude=${l.longitude}&current=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=auto`:null; const [weatherResult,airResult,marineResult]=await Promise.allSettled([fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l.latitude}&longitude=${l.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,wind_gusts_10m,weather_code,cape&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,rain_sum,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset&timezone=auto`).then(r=>r.json()),fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${l.latitude}&longitude=${l.longitude}&current=pm10,pm2_5,ozone,european_aqi&timezone=auto`).then(r=>r.json()),marineUrl?fetch(marineUrl).then(r=>r.json()):Promise.resolve(null)]); weather=weatherResult.status==='fulfilled'?weatherResult.value:null; air=airResult.status==='fulfilled'?airResult.value:null; marine=marineResult.status==='fulfilled'?marineResult.value:null; }
function favoriteWeatherKey(place){ return `${Number(place.latitude).toFixed(4)},${Number(place.longitude).toFixed(4)}`; }
function favoriteWeatherSummary(){
  const favorites=getFavorites();
  if(!favorites.length) return '<article class="notice"><strong>Seus favoritos aparecerão aqui</strong><p>Na aba Favoritos, adicione as localidades que você deseja acompanhar. Depois, elas ficarão reunidas nesta tela.</p></article>';
  return `<section class="stack"><div class="scroll-heading"><h2>Suas localidades favoritas</h2><div><button class="scroll-button" id="favorite-scroll-prev" aria-label="Ver favoritos anteriores">‹</button><button class="scroll-button" id="favorite-scroll-next" aria-label="Ver próximos favoritos">›</button></div></div><div class="scroller favorite-scroller" id="favorite-weather-scroller">${favorites.slice(0,8).map((place,index)=>{ const data=favoriteWeather[favoriteWeatherKey(place)], current=data?.current, daily=data?.daily; return `<article class="hour favorite-weather"><b>${escape(place.name)}</b><strong>${current?`${fmt(current.temperature_2m)}°C`:'Atualizando…'}</strong><small>${current?`${status(current.weather_code)} · sensação ${fmt(current.apparent_temperature)}°C`:'Consultando condição atual'}</small><small>${daily?`Máx. ${fmt(daily.temperature_2m_max?.[0])}° · chuva ${fmt(daily.precipitation_probability_max?.[0])}%`:''}</small><button class="remove" data-favorite-weather="${index}">Ver detalhes</button></article>`; }).join('')}</div><p class="note">Use as setas ou arraste os cartões para o lado.</p></section>`;
}
function wireFavoriteCarousel(){
  const scroller=document.querySelector('#favorite-weather-scroller');
  if(!scroller) return;
  document.querySelector('#favorite-scroll-prev')?.addEventListener('click',()=>scroller.scrollBy({left:-250,behavior:'smooth'}));
  document.querySelector('#favorite-scroll-next')?.addEventListener('click',()=>scroller.scrollBy({left:250,behavior:'smooth'}));
  let down=false,startX=0,startLeft=0;
  scroller.addEventListener('pointerdown',event=>{ down=true; startX=event.clientX; startLeft=scroller.scrollLeft; scroller.setPointerCapture?.(event.pointerId); });
  scroller.addEventListener('pointermove',event=>{ if(!down) return; scroller.scrollLeft=startLeft-(event.clientX-startX); });
  scroller.addEventListener('pointerup',()=>{down=false});
  scroller.addEventListener('pointercancel',()=>{down=false});
}
async function loadFavoriteWeather(){
  const favorites=getFavorites().slice(0,8);
  const missing=favorites.filter(place=>!favoriteWeather[favoriteWeatherKey(place)]);
  if(!missing.length||favoriteWeatherLoading) return;
  favoriteWeatherLoading=true;
  const results=await Promise.allSettled(missing.map(async place=>{
    const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`);
    if(!response.ok) throw new Error('Previsão indisponível');
    return {place,data:await response.json()};
  }));
  results.forEach(result=>{ if(result.status==='fulfilled') favoriteWeather[favoriteWeatherKey(result.value.place)]=result.value.data; });
  favoriteWeatherLoading=false;
  if(active==='tempo') render();
}
async function loadClimateUpdate(){
  climateLoading=true;
  if(active==='clima') render();
  const results=await Promise.allSettled(CLIMATE_MONITORS.map(async point=>{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}&longitude=${point.longitude}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FSao_Paulo`;
    const response=await fetch(url);
    if(!response.ok) throw new Error('Monitoramento indisponível');
    const data=await response.json();
    return {...point,temperature:data.current?.temperature_2m,maximum:data.daily?.temperature_2m_max?.[0],minimum:data.daily?.temperature_2m_min?.[0],rain:data.daily?.precipitation_sum?.[0]};
  }));
  climateMonitors=results.filter(result=>result.status==='fulfilled').map(result=>result.value);
  climateUpdatedAt=nowTime();
  climateLoading=false;
  if(active==='clima') render();
}
async function fetchActiveCyclones(){
  const source='https://www.nhc.noaa.gov/CurrentStorms.json';
  const endpoints=[source,`https://api.allorigins.win/raw?url=${encodeURIComponent(source)}`];
  let lastError;
  for(const endpoint of endpoints){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),9000);
      const response=await fetch(endpoint,{signal:controller.signal});
      clearTimeout(timer);
      if(!response.ok) throw new Error('Fonte indisponível');
      const data=await response.json();
      if(!Array.isArray(data.activeStorms)) throw new Error('Formato inesperado da fonte');
      return data.activeStorms;
    }catch(error){ lastError=error; }
  }
  throw lastError || new Error('Sistemas indisponíveis');
}
function parsePainelGlobalCyclones(markup){
  const documentText=new DOMParser().parseFromString(markup,'text/html').body.textContent.replace(/\s+/g,' ').trim();
  if(/não há registro de qualquer tempestade ciclônica em atividade/i.test(documentText)) return [];
  const found=[];
  const expression=/(super\s+tufão|tufão|furacão|ciclone\s+tropical|tempestade\s+tropical|depressão\s+tropical)\s+([^|]{1,90}?)(?=\s+(?:com\s+)?ventos?\s+(?:de\s+)?\d+|\s+\d{2,3}\s*km\/h)/gi;
  for(const match of documentText.matchAll(expression)){
    const type=globalStormType(match[1]);
    const name=`${match[1]} ${match[2]}`.replace(/\s+/g,' ').trim();
    const nextText=documentText.slice(match.index,match.index+280);
    const wind=nextText.match(/ventos?\s+(?:de\s+)?(\d+)\s*km\/h/i)?.[1] || nextText.match(/(\d+)\s*km\/h/i)?.[1];
    const direction=nextText.match(/(?:sentido|rumo)\s+([a-zà-ú-]+)(?:\s+a\s+(\d+)\s*km\/h)?/i);
    const movement=direction?`${direction[1]}${direction[2]?` a ${direction[2]} km/h`:''}`:'movimento não informado';
    found.push({name:translateCycloneText(name),type,detail:`Ventos: ${wind?`${wind} km/h`:'não informados'} · Deslocamento: ${movement} · Localização: consulte o boletim de origem.`});
  }
  const unique=new Map();
  found.forEach(system=>unique.set(`${atlasKey(system.name)}-${system.type}`,system));
  return [...unique.values()];
}
async function fetchPainelGlobalCyclones(){
  const endpoints=['/api/painel-global/ciclones',PAINEL_GLOBAL_CYCLONES_URL,`https://api.allorigins.win/raw?url=${encodeURIComponent(PAINEL_GLOBAL_CYCLONES_URL)}`];
  let lastError;
  for(const endpoint of endpoints){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),10000);
      const response=await fetch(endpoint,{signal:controller.signal});
      clearTimeout(timer);
      if(!response.ok) throw new Error('Fonte indisponível');
      const buffer=await response.arrayBuffer();
      const markup=new TextDecoder('windows-1252').decode(buffer);
      return parsePainelGlobalCyclones(markup);
    }catch(error){ lastError=error; }
  }
  throw lastError || new Error('Painel Global indisponível');
}
async function loadAll(){
  await loadLocation();
  const [quakeResult, disasterResult, cycloneResult, painelCycloneResult, brazilDisasterResult] = await Promise.allSettled([
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson').then(r=>r.json()),
    fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30&days=60').then(r=>r.json()),
    fetchActiveCyclones(),
    fetchPainelGlobalCyclones(),
    fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=100&bbox=-74,6,-34,-34').then(r=>r.json())
  ]);
  await loadOfficialMarine();
  quakesLoaded=true;
  if(quakeResult.status==='fulfilled') quakes=(quakeResult.value.features||[]).sort((a,b)=>b.properties.mag-a.properties.mag);
  if(disasterResult.status==='fulfilled') { disasters=disasterResult.value.events||[]; void enrichDisasterCountries(disasters); }
  if(brazilDisasterResult.status==='fulfilled') brazilDisasters=(brazilDisasterResult.value.events||[]).filter(isBrazilEvent).sort((a,b)=>new Date(b.geometry?.[0]?.date||0)-new Date(a.geometry?.[0]?.date||0));
  brazilDisasterUpdatedAt=nowTime();
  if(cycloneResult.status==='fulfilled') {
    cyclones=cycloneResult.value||[];
    cycloneStatus='Dados do Painel Global, NHC e catálogo global de tempestades em atualização.';
  } else cycloneStatus='Não foi possível consultar o NHC agora; a lista pode conter apenas os sistemas do catálogo global.';
  if(painelCycloneResult.status==='fulfilled') painelCyclones=painelCycloneResult.value||[];
  cycloneUpdatedAt=nowTime();
  render();
  void loadClimateUpdate();
}
function getFavorites(){return JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]')} function wireFavorites(){document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const f=getFavorites();f.splice(Number(b.dataset.remove),1);localStorage.setItem(FAVORITES_KEY,JSON.stringify(f));render()});document.querySelector('#location-search').onclick=async()=>{const query=document.querySelector('#location-query').value.trim();if(!query)return;const result=document.querySelector('#search-results');result.innerHTML='<p class="note">Pesquisando…</p>';try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=pt&format=json`);const data=await r.json();result.innerHTML=(data.results||[]).map((p,i)=>`<article class="event"><div><strong>${escape([p.name,p.admin1,p.country].filter(Boolean).join(' — '))}</strong></div><button class="remove" data-add="${i}">Adicionar</button></article>`).join('')||'<p class="note">Nenhuma localidade encontrada.</p>';document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const p=data.results[Number(b.dataset.add)],f=getFavorites();if(!f.some(x=>x.latitude===p.latitude&&x.longitude===p.longitude))f.push({name:[p.name,p.admin1,p.country].filter(Boolean).join(' — '),latitude:p.latitude,longitude:p.longitude});localStorage.setItem(FAVORITES_KEY,JSON.stringify(f));render()});}catch{result.innerHTML='<p class="notice">Não foi possível pesquisar agora.</p>'}}}
function magnitude(m){return m>=7?'Grande':m>=6?'Forte':m>=5?'Moderado':m>=4?'Leve':'Pequeno'}function depth(d){return d<70?'Raso':d<300?'Intermediário':'Profundo'}function averageMag(){return quakes.length?(quakes.reduce((a,q)=>a+Number(q.properties.mag||0),0)/quakes.length).toFixed(1):'—'}function sportLabel(){if(!weather)return'Carregando…';return weather.current.wind_gusts_10m>45?'Cuidado com vento':'Favorável com atenção ao UV'}function buildAlerts(){return weatherAlerts()}function start(){applySettings();scheduleUpdateAlarm();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');render();void loadAll()}localStorage.getItem(USER_KEY)?start():login();
