/**
 * Neto Invest - Motor Interativo da Área de Membros (Terminal de Investimentos)
 * Baseado no artefato original de análise financeira do Neto Invest.
 */

(function(window) {
  'use strict';

  const D = window.NETO_DATA;
  if (!D) {
    console.error('Base de dados NETO_DATA não encontrada!');
    return;
  }

  const VIEWS = [
    { id: 'inicio', name: 'Início', ic: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>' },
    { id: 'carteira-neto', name: 'Carteira Neto Invest', ic: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>' },
    { id: 'carteira', name: 'Minha carteira', ic: '<path d="M3 7h18v13H3z"/><path d="M8 7V4h8v3"/><path d="M3 12h18"/>' },
    { id: 'ranking', name: 'Ranking de ações', ic: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
    { id: 'agenda', name: 'Agenda de dividendos', ic: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
    { id: 'ibov', name: 'IBOV e quedas', ic: '<path d="M3 17l5-6 4 3 8-9"/><path d="M3 21h18"/>' },
    { id: 'calculadoras', name: 'Calculadoras', ic: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>' },
  ];

  const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const NOW_M = 10; // novembro
  const PAL = ['#1B5FB8','#D62828','#111111','#7B2CBF','#2A9D3F','#F77F00','#00A6A6','#E63995','#E9B20E','#8D5524','#4CC9F0','#8A8F98','#9BC53D','#0A2A5E'];

  const fBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fBRL2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const fD = (v, d = 2) => v == null || isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (v, d = 1) => v == null || isNaN(v) ? '—' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
  const big = v => {
    const a = Math.abs(v);
    if (a >= 1e9) return 'R$ ' + fD(v / 1e9, 1) + ' bi';
    if (a >= 1e6) return 'R$ ' + fD(v / 1e6, 1) + ' mi';
    return fBRL.format(v);
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = s => document.querySelector(s);

  function parseMeses(s) {
    if (!s) return [];
    let t = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.includes('indefinido')) return [];
    const toks = t.split(/[^a-z]+/).filter(Boolean);
    const idx = [];
    let range = /-|\ba\b|\bate\b/.test(t.replace(/[^a-z\- ]/g, ' '));
    toks.forEach(w => {
      if (w.length < 3) return;
      const i = MES.findIndex(m => w.startsWith(m));
      if (i >= 0) idx.push(i);
    });
    if (range && idx.length === 2) {
      const o = [];
      for (let i = idx[0];; i = (i + 1) % 12) {
        o.push(i);
        if (i === idx[1]) break;
      }
      return o;
    }
    return [...new Set(idx)];
  }

  const BY = { pl: {}, bazin: {} };
  D.graham.forEach(s => BY.pl[s.t] = s);
  D.bazin.forEach(s => BY.bazin[s.t] = s);
  const SECT = [...new Set(D.bazin.map(s => s.s))].sort((a, b) => a.localeCompare(b, 'pt'));

  const KEY = 'netoinvest-terminal-v1';
  const DEF = () => ({
    carteira: D.carteira.map(x => ({ ...x })),
    growth: D.growth.slice(),
    gNeto: D.growth.slice(),
    method: 'bazin',
    sort: { k: 'mg', d: -1 },
    sector: '',
    q: ''
  });

  let S = { ...DEF(), carteira: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      S = { ...S, ...o };
    }
  } catch (e) {}

  if (!Array.isArray(S.growth) || S.growth.length < 4) S.growth = D.growth.slice();
  if (!Array.isArray(S.gNeto) || S.gNeto.length < 4) S.gNeto = D.growth.slice();

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        carteira: S.carteira,
        growth: S.growth,
        gNeto: S.gNeto,
        method: S.method,
        sort: S.sort,
        sector: S.sector
      }));
    } catch (e) {}
  };

  function toast(m) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = m;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function pos(x) {
    const r = BY.bazin[x.t];
    return {
      ...x,
      p: r ? r.p : x.p,
      lpa: x.lpa ?? (r && r.lpa),
      dpa: x.dpa ?? (r && r.dpa),
      meses: r ? parseMeses(r.meses) : null,
      e: r ? r.e : null,
      s: r ? r.s : null
    };
  }

  function portfolio(list = S.carteira) {
    const rows = list.map(pos).map(x => ({
      ...x,
      pat: x.q * x.p,
      lucro: x.q * x.lpa,
      renda: x.q * (x.dpa || 0)
    }));
    const pat = rows.reduce((a, b) => a + b.pat, 0);
    const lucro = rows.reduce((a, b) => a + b.lucro, 0);
    const renda = rows.reduce((a, b) => a + b.renda, 0);
    return {
      rows,
      pat,
      lucro,
      renda,
      ey: pat ? lucro / pat : 0,
      dy: pat ? renda / pat : 0
    };
  }

  function pieSVG(items, total) {
    const R = 90, r = 52, c = 100;
    let a = -Math.PI / 2, s = '';
    if (items.length === 1) {
      s = `<circle cx="${c}" cy="${c}" r="${(R + r) / 2}" fill="none" stroke="${PAL[0]}" stroke-width="${R - r}"/>`;
    } else {
      items.forEach((x, i) => {
        const f = x.pat / total, b = a + f * 2 * Math.PI, lg = f > 0.5 ? 1 : 0;
        const p = (ang, rad) => `${(c + rad * Math.cos(ang)).toFixed(2)},${(c + rad * Math.sin(ang)).toFixed(2)}`;
        s += `<path d="M${p(a, R)} A${R},${R} 0 ${lg} 1 ${p(b, R)} L${p(b, r)} A${r},${r} 0 ${lg} 0 ${p(a, r)} Z" fill="${PAL[i % PAL.length]}" stroke="var(--surface)" stroke-width="1.5"><title>${x.t}: ${pct(f)}</title></path>`;
        a = b;
      });
    }
    return `<svg viewBox="0 0 200 200" class="pie" role="img" aria-label="Gráfico de pizza da alocação por ativo">${s}<text x="100" y="96" text-anchor="middle" style="font-size:11px">${items.length} ativos</text><text x="100" y="114" text-anchor="middle" style="fill:var(--ink);font-size:13px;font-weight:500">${big(total)}</text></svg>`;
  }

  function projHTML(P, G) {
    const proj = [];
    let l = P.lucro, r = P.renda;
    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        const g = (G[i - 1] || 0);
        l *= 1 + g;
        r *= 1 + g;
      }
      proj.push({ a: 2027 + i, l, r, g: i ? G[i - 1] : null });
    }
    const maxP = Math.max(...proj.map(p => Math.max(p.l, p.r)), 1);
    const W = 900, H = 250, pl = 10, pb = 28, top = 36, bw = (W - pl * 2) / 5;
    const k = v => v >= 1e6 ? fD(v / 1e6, 2) + ' mi' : fD(v / 1e3, 0) + ' mil';
    let bars = '';
    proj.forEach((p, i) => {
      const x = pl + i * bw;
      const hl = (p.l / maxP) * (H - pb - top), hr = (p.r / maxP) * (H - pb - top);
      bars += `<rect x="${x + bw * 0.12}" y="${H - pb - hl}" width="${bw * 0.36}" height="${hl}" rx="3" fill="var(--accent)" opacity=".3"/>
      <rect x="${x + bw * 0.52}" y="${H - pb - hr}" width="${bw * 0.36}" height="${hr}" rx="3" fill="var(--accent)"/>
      <text x="${x + bw * 0.30}" y="${H - pb - hl - 7}" text-anchor="middle" style="fill:var(--ink);font-size:12px">${k(p.l)}</text>
      <text x="${x + bw * 0.70}" y="${H - pb - hr - 7}" text-anchor="middle" style="fill:var(--accent);font-size:12px;font-weight:500">${k(p.r)}</text>
      <text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" style="font-size:12px">${p.a}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Projeção de lucro e dividendos de 2027 a 2031">${bars}</svg>
    <div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>Ano</th><th class="n">Crescimento</th><th class="n">Lucro anual da holding</th><th class="n">Lucro mensal</th><th class="n">Dividendos anuais</th><th class="n">Renda mensal</th></tr></thead><tbody>
    ${proj.map(p => `<tr><td class="num">${p.a}</td><td class="n">${p.g == null ? 'base' : (p.g >= 0 ? '+' : '') + pct(p.g, 0)}</td><td class="n"><b>${fBRL.format(p.l)}</b></td><td class="n">${fBRL.format(p.l / 12)}</td><td class="n"><b>${fBRL.format(p.r)}</b></td><td class="n">${fBRL.format(p.r / 12)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function vCarteira(neto) {
    const L = neto ? D.carteira : S.carteira, G = neto ? S.gNeto : S.growth;
    const P = portfolio(L);
    const rows = P.rows.slice().sort((a, b) => b.pat - a.pat);
    const ranked = rows.filter(x => x.pat > 0);

    return `
    <header class="page">${neto ? `<div><div class="eyebrow">Carteira do canal · somente leitura</div><h1>Carteira Neto Invest</h1><p class="sub">A carteira acompanhada no canal, vista como uma holding: quanto lucro as empresas geram e quanto disso deve virar dividendo. Toque numa ação para ver os detalhes.</p></div>
    <div class="tools"><button id="copyNeto">Copiar para Minha carteira</button></div>` : `<div><div class="eyebrow">Sua carteira · preenchida por você</div><h1>Minha carteira</h1><p class="sub">Cadastre as ações que você tem e as quantidades. O site calcula o lucro que elas geram, os dividendos esperados e a renda mês a mês. Preços e projeções vêm da planilha de novembro.</p></div>
    <div class="tools"><select id="addSel" aria-label="Adicionar ação"><option value="">+ Adicionar ação…</option>${D.bazin.filter(s => !S.carteira.some(c => c.t === s.t)).map(s => `<option value="${s.t}">${s.t} · ${esc(s.e)}</option>`).join('')}</select></div>`}</header>
    <section class="kpis">
      <div class="kpi"><span class="eyebrow">Patrimônio</span><span class="v">${fBRL.format(P.pat)}</span><span class="h">${rows.length} ativos</span></div>
      <div class="kpi"><span class="eyebrow">Lucro anual da “holding”</span><span class="v">${fBRL.format(P.lucro)}</span><span class="h">Earning yield ${pct(P.ey)} · ${fBRL.format(P.lucro / 365)}/dia</span></div>
      <div class="kpi"><span class="eyebrow">Dividendos esperados no ano</span><span class="v">${fBRL.format(P.renda)}</span><span class="h">Dividend yield ${pct(P.dy)}</span></div>
      <div class="kpi hl"><span class="eyebrow">Renda média mensal</span><span class="v">${fBRL.format(P.renda / 12)}</span><span class="h">Lucro mensal ${fBRL.format(P.lucro / 12)}</span></div>
    </section>
    ${rows.length || neto ? '' : `<div class="panel" style="text-align:center;padding:36px 20px;display:flex;flex-direction:column;gap:12px;align-items:center"><h2>Cadastre sua primeira ação</h2><p class="sub" style="margin:0">Escolha a ação no menu “Adicionar ação” acima, ou abra o Ranking, toque numa ação e use “Adicionar à carteira”. Depois é só ajustar as quantidades na tabela.</p><div class="tools" style="justify-content:center"><button class="pri" id="loadEx">Copiar a carteira Neto Invest</button><a href="#carteira-neto" style="color:var(--accent);font-weight:600;text-decoration:none">Ver a carteira Neto Invest</a></div></div>`}
    <div class="panel" ${rows.length ? '' : 'hidden'}><div class="panel-h"><h2>Posições</h2><span class="note">Valores brutos estimados para 2027</span></div>
        <div class="tbl-wrap"><table><thead><tr><th>Ativo</th><th class="n">Qtd.</th><th class="n">Cotação</th><th class="n">Patrimônio</th><th class="n">Lucro/ano</th><th class="n">Dividendos/ano</th><th class="n">DY</th><th></th></tr></thead><tbody>
        ${rows.map(x => `<tr ${neto && BY.bazin[x.t] ? `class="click" data-t="${x.t}" tabindex="0"` : ''}><td><span class="tk">${x.t}</span>${x.e ? `<div class="co">${esc(x.e)}</div>` : ''}</td>
        <td class="n">${neto ? fN.format(x.q) : `<input class="q" data-t="${x.t}" type="number" min="0" step="100" value="${x.q}" id="q-${x.t}" aria-label="Quantidade de ${x.t}">`}</td>
        <td class="n">${fD(x.p)}</td><td class="n">${fBRL.format(x.pat)}</td><td class="n">${fBRL.format(x.lucro)}</td><td class="n">${fBRL.format(x.renda)}</td>
        <td class="n">${pct(x.p ? (x.dpa || 0) / x.p : 0)}</td><td>${neto ? '' : `<button class="x" data-del="${x.t}" title="Remover ${x.t}" aria-label="Remover ${x.t}">✕</button>`}</td></tr>`).join('')}
        </tbody></table></div></div>
    <section class="grid2" ${rows.length ? '' : 'hidden'}>
        <div class="panel" style="grid-column:1/-1"><div class="panel-h"><h2>Alocação</h2><span class="note">% do patrimônio</span></div>
          <div class="pie-wrap">${pieSVG(ranked, P.pat)}
          <div class="alist">${ranked.map((x, i) => `<div><span><i style="background:${PAL[i % PAL.length]}"></i><span class="tk">${x.t}</span></span><span class="num">${pct(x.pat / P.pat)}</span></div>`).join('')}</div></div>
        </div>
        <div class="panel" style="grid-column:1/-1"><div class="panel-h"><div><h2>Projeção da holding 2027–2031</h2><p class="note" style="margin:2px 0 0">A taxa de crescimento de cada ano, sobre o ano anterior, aumenta o lucro e os dividendos da holding.</p></div><div class="legend"><span><i style="background:var(--accent);opacity:.3"></i>Lucro anual</span><span><i style="background:var(--accent)"></i>Dividendos anuais</span></div></div>
          <div class="growth" style="margin:0 0 14px">Crescimento vs ano anterior: ${[2028, 2029, 2030, 2031].map((a, i) => `<label for="g${neto ? 'n' : ''}${i}">${a}<input type="number" step="1" inputmode="decimal" id="g${neto ? 'n' : ''}${i}" data-g="${i}" data-neto="${neto ? 1 : 0}" value="${Math.round(G[i] * 100)}">%</label>`).join('')}</div>
          <div id="projOut">${projHTML(P, G)}</div>
        </div>
    </section>`;
  }

  function vInicio() {
    const all = D.bazin;
    const top = [...all].sort((a, b) => b.mg - a.mg).slice(0, 5);
    const below = all.filter(s => s.mg >= 0).length;
    const nov = all.filter(s => parseMeses(s.meses).includes(NOW_M)).sort((a, b) => b.dy - a.dy).slice(0, 8);
    const avgDY = all.reduce((a, b) => a + b.dy, 0) / all.length;
    const sects = new Set(all.map(s => s.s)).size;
    const tool = (id, t, d) => {
      const v = VIEWS.find(x => x.id === id);
      return `<a href="#${id}"><svg viewBox="0 0 24 24">${v.ic}</svg><h2>${t}</h2><p>${d}</p><span class="go">Abrir →</span></a>`;
    };

    return `
    <section class="hero">
      <div><div class="eyebrow">Planilha de novembro · atualizada em 02/11/2026</div>
        <h1>Ações que pagam dividendos, <em>com preço teto</em> e projeção de renda.</h1>
        <p>Tudo o que está na planilha dos membros do Neto Invest, num só lugar: ranking por margem de segurança, carteira como holding, agenda de proventos e simuladores.</p>
        <div class="hero-cta"><a class="btn" href="#ranking">Ver o ranking completo</a><a class="btn sec" href="#carteira">Cadastrar minha carteira</a></div></div>
      <div class="tape"><div class="eyebrow" style="margin-bottom:6px">Maiores margens · Bazin adaptado</div>
        ${top.map(s => `<div class="row"><span class="tk">${s.t}</span><span class="co">${esc(s.e)} · DY ${pct(s.dy)}</span><span class="mg">+${pct(s.mg)}</span></div>`).join('')}</div>
    </section>
    <section class="stats">
      <div><b>${all.length}</b><span>ativos acompanhados em ${sects} setores</span></div>
      <div><b>${below}</b><span>abaixo do preço teto Bazin</span></div>
      <div><b>${pct(avgDY)}</b><span>dividend yield médio projetado</span></div>
      <div><b>${D.ibov.length} anos</b><span>de histórico do IBOV e suas quedas</span></div>
    </section>
    <section style="display:flex;flex-direction:column;gap:14px"><div class="sec-h"><div><div class="eyebrow">Ferramentas</div><h2 style="font-size:22px">O que você encontra aqui</h2></div></div>
      <div class="feat">
        ${tool('ranking', 'Ranking de ações', 'Preço teto por Bazin adaptado e por P/L justo, margem de segurança, P/L histórico, CAGR e endividamento.')}
        ${tool('carteira-neto', 'Carteira Neto Invest', 'A carteira acompanhada no canal: patrimônio, lucro, dividendos esperados e projeção até 2031.')}
        ${tool('carteira', 'Minha carteira', 'Cadastre as suas ações e quantidades e veja o lucro e a renda que a sua carteira gera.')}
        ${tool('agenda', 'Agenda de dividendos', 'Os meses em que cada empresa costuma anunciar proventos e a renda estimada mês a mês.')}
        ${tool('ibov', 'IBOV e quedas', 'Retorno anual do Ibovespa desde 1995 e a maior queda de cada ano.')}
        ${tool('calculadoras', 'Calculadoras', 'Juros compostos, primeiro milhão e patrimônio necessário para a renda passiva que você quer.')}
      </div></section>
    <section class="panel"><div class="sec-h" style="margin-bottom:14px"><div><div class="eyebrow">Este mês</div><h2>Costumam anunciar dividendos em novembro</h2></div><a href="#agenda">Ver agenda completa →</a></div>
      <div class="novs">${nov.map(s => `<button data-open="${s.t}"><span class="tk">${s.t}</span><span class="co">${esc(s.e)}</span><span class="dy">DY ${pct(s.dy)}</span></button>`).join('')}</div></section>
    <section class="panel about"><div class="avatar">M</div>
      <div><div class="eyebrow">Quem faz</div><h2>Mário, CNPI · Neto Invest</h2><p class="sub" style="margin-top:4px">Analista certificado CNPI. A planilha é atualizada após cada temporada de resultados, com novas projeções de lucro, dividendos e preço teto.</p></div>
      <div class="links"><a href="https://www.youtube.com/@NetoInvest" target="_blank" rel="noopener">YouTube</a><a href="https://www.instagram.com/neto.invest/" target="_blank" rel="noopener">Instagram</a></div></section>
    <p class="disc">Conteúdo educacional. Projeções de lucro, dividendos e preço teto são estimativas baseadas em premissas que podem não se concretizar e não constituem recomendação de compra ou venda. Rentabilidade passada não garante rentabilidade futura.</p>`;
  }

  function stockList() {
    const src = S.method === 'bazin' ? D.bazin : D.graham;
    let r = src.filter(s => (!S.sector || s.s === S.sector) && (!S.q || (s.t + ' ' + s.e).toLowerCase().includes(S.q.toLowerCase())));
    const k = S.sort.k, d = S.sort.d;
    r = r.slice().sort((a, b) => {
      const A = a[k], B = b[k];
      if (typeof A === 'string') return A.localeCompare(B, 'pt') * d;
      return ((A ?? -1e9) - (B ?? -1e9)) * d;
    });
    return r;
  }

  const mgPill = m => `<span class="pill ${m >= 0.15 ? 'good' : m >= 0 ? 'warn' : 'bad'}">${m > 0 ? '+' : ''}${pct(m)}</span>`;

  function vRanking() {
    const r = stockList();
    const cols = [['t','Ativo',0],['s','Setor',0],['p','Cotação',1],['teto','Preço teto',1],['mg','Margem',1],['dy','DY proj.',1],['pl','P/L proj.',1],['plm','P/L médio 10a',1],['cagr','CAGR lucro 5a',1],['dl','Dív.líq/EBITDA',1]];
    const all = S.method === 'bazin' ? D.bazin : D.graham;
    const pos = all.filter(s => s.mg >= 0).length;

    return `
    <header class="page"><div><div class="eyebrow">${all.length} ativos acompanhados</div><h1>Ranking de ações</h1><p class="sub">${S.method === 'bazin' ? 'Preço teto Bazin adaptado: dividendo projetado ÷ 7,75% de yield mínimo.' : 'Preço teto por P/L justo: lucro por ação projetado × um P/L considerado justo para cada empresa.'} Toque numa linha para ver os detalhes.</p></div>
    <div class="seg" role="tablist"><button data-m="bazin" class="${S.method === 'bazin' ? 'on' : ''}">Bazin adaptado</button><button data-m="pl" class="${S.method === 'pl' ? 'on' : ''}">P/L justo</button></div></header>
    <section class="kpis">
      <div class="kpi"><span class="eyebrow">Abaixo do preço teto</span><span class="v">${pos} de ${all.length}</span><span class="h">Margem de segurança ≥ 0</span></div>
      <div class="kpi"><span class="eyebrow">Maior margem</span><span class="v">${[...all].sort((a, b) => b.mg - a.mg)[0].t}</span><span class="h">${pct([...all].sort((a, b) => b.mg - a.mg)[0].mg)} abaixo do teto</span></div>
      <div class="kpi"><span class="eyebrow">Maior DY projetado</span><span class="v">${[...all].sort((a, b) => b.dy - a.dy)[0].t}</span><span class="h">${pct([...all].sort((a, b) => b.dy - a.dy)[0].dy)} ao ano</span></div>
      <div class="kpi"><span class="eyebrow">Anunciam em novembro</span><span class="v">${all.filter(s => parseMeses(s.meses).includes(NOW_M)).length}</span><span class="h">ativos pelo histórico</span></div>
    </section>
    <div class="panel">
      <div class="panel-h"><div class="tools"><input type="search" id="q" placeholder="Buscar ticker ou empresa" value="${esc(S.q)}" aria-label="Buscar">
        <select id="sector" aria-label="Setor"><option value="">Todos os setores</option>${SECT.map(s => `<option ${s === S.sector ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div class="legend"><span><i style="background:var(--good)"></i>margem ≥ 15%</span><span><i style="background:var(--warn)"></i>0 a 15%</span><span><i style="background:var(--bad)"></i>acima do teto</span></div></div>
      <div class="tbl-wrap"><table><thead><tr>${cols.map(([k, n, num]) => `<th class="sort ${num ? 'n' : ''} ${S.sort.k === k ? 'on' : ''}" data-k="${k}">${n}${S.sort.k === k ? (S.sort.d < 0 ? ' ↓' : ' ↑') : ''}</th>`).join('')}</tr></thead><tbody id="rk">
      ${r.length ? r.map(s => `<tr class="click" data-t="${s.t}" tabindex="0"><td><span class="tk">${s.t}</span><div class="co">${esc(s.e)}</div></td><td><span class="chip">${esc(s.s)}</span></td>
      <td class="n">${fD(s.p)}</td><td class="n">${fD(s.teto)}</td><td class="n">${mgPill(s.mg)}</td><td class="n">${pct(s.dy)}</td><td class="n">${fD(s.pl, 1)}</td><td class="n">${fD(s.plm, 1)}</td>
      <td class="n" style="color:${s.cagr < 0 ? 'var(--bad)' : 'inherit'}">${pct(s.cagr)}</td><td class="n">${fD(s.dl, 2)}</td></tr>`).join('') : `<tr><td colspan="10" class="empty">Nenhum ativo encontrado com esse filtro.</td></tr>`}
      </tbody></table></div></div>`;
  }

  function vAgenda() {
    const neto = S.ag === 'neto';
    const P = portfolio(neto ? D.carteira : S.carteira);
    const per = Array.from({ length: 12 }, () => ({ v: 0, t: [] }));
    const sem = [];
    P.rows.forEach(x => {
      if (!x.meses || !x.meses.length) {
        sem.push(x);
        return;
      }
      const part = x.renda / x.meses.length;
      x.meses.forEach(m => {
        per[m].v += part;
        per[m].t.push(x.t);
      });
    });
    const mx = Math.max(...per.map(p => p.v), 1);
    const nov = D.bazin.filter(s => parseMeses(s.meses).includes(NOW_M)).sort((a, b) => b.dy - a.dy);

    return `
    <header class="page"><div><div class="eyebrow">Calendário pelo histórico de anúncios</div><h1>Agenda de dividendos</h1><p class="sub">Em quais meses as empresas da carteira costumam anunciar proventos e quanto isso representa. O valor de cada mês divide o dividendo anual igualmente entre os meses habituais da empresa.</p></div>
    <div class="seg"><button data-ag="minha" class="${neto ? '' : 'on'}">Minha carteira</button><button data-ag="neto" class="${neto ? 'on' : ''}">Carteira Neto Invest</button></div></header>
    ${!neto && !P.rows.length ? `<div class="panel empty">Sua carteira ainda está vazia. <a href="#carteira" style="color:var(--accent);font-weight:600">Cadastre suas ações</a> para ver a sua agenda.</div>` : ''}
    <div class="panel"><div class="panel-h"><h2>${neto ? 'Carteira Neto Invest' : 'Minha carteira'} mês a mês</h2><span class="note">Total distribuído: ${fBRL.format(per.reduce((a, b) => a + b.v, 0))}</span></div>
      <div class="months">${per.map((p, i) => `<div class="mo ${i === NOW_M ? 'now' : ''}"><div class="mh"><span>${MES[i]}</span>${i === NOW_M ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--gold);align-self:center" title="mês atual"></span>' : ''}</div>
        <div class="bar"><span style="height:${Math.max(p.v / mx * 100, p.v ? 6 : 0)}%"></span></div><div class="mv">${p.v ? fBRL.format(p.v) : '—'}</div><div class="tks">${p.t.map(t => `<span>${t}</span>`).join('')}</div></div>`).join('')}</div>
      ${sem.length ? `<p class="note" style="margin-top:12px">Sem calendário na planilha (fora do ranking ou frequência indefinida): ${sem.map(x => `<b class="tk">${x.t}</b> (${fBRL.format(x.renda)}/ano)`).join(', ')}.</p>` : ''}
    </div>
    <div class="panel"><div class="panel-h"><h2>Costumam anunciar em novembro</h2><span class="note">${nov.length} ativos do ranking, por DY projetado</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Ativo</th><th>Frequência</th><th>Meses habituais</th><th class="n">DPA proj.</th><th class="n">DY proj.</th><th class="n">Margem (Bazin)</th></tr></thead><tbody>
      ${nov.map(s => `<tr class="click" data-t="${s.t}" tabindex="0"><td><span class="tk">${s.t}</span><div class="co">${esc(s.e)}</div></td><td>${esc(s.fq)}</td><td class="co">${esc(s.meses)}</td><td class="n">${fBRL2.format(s.dpa)}</td><td class="n">${pct(s.dy)}</td><td class="n">${mgPill(s.mg)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  function vIbov() {
    const d = D.ibov;
    const W = 960, H = 360, L = 44, R = 12, T = 16, B = 30;
    const min = -0.7, max = 1.6;
    const y = v => T + (max - v) / (max - min) * (H - T - B);
    const bw = (W - L - R) / d.length;
    let g = '';
    [-0.6, -0.4, -0.2, 0, 0.4, 0.8, 1.2, 1.6].forEach(v => {
      g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" ${v === 0 ? '' : 'stroke-dasharray="2 4"'}/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v * 100)}%</text>`;
    });
    let b = '', ln = '';
    d.forEach((p, i) => {
      const x = L + i * bw;
      const c = p.r >= 0 ? 'var(--good)' : 'var(--bad)';
      b += `<rect x="${x + bw * 0.18}" y="${Math.min(y(0), y(p.r))}" width="${bw * 0.64}" height="${Math.abs(y(p.r) - y(0))}" rx="2" fill="${c}" opacity=".85"><title>${p.a}: retorno ${pct(p.r)} · queda máx. ${pct(p.dd)}</title></rect>`;
      ln += `${i ? 'L' : 'M'}${x + bw / 2},${y(p.dd)}`;
      if (i % 2 === 0 || i === d.length - 1) b += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle">${String(p.a).replace('*', '').slice(2)}</text>`;
    });
    const dots = d.map((p, i) => `<circle cx="${L + i * bw + bw / 2}" cy="${y(p.dd)}" r="3" fill="var(--gold)"/>`).join('');
    const avgDD = d.reduce((a, b) => a + b.dd, 0) / d.length;
    const pos = d.filter(p => p.r > 0).length;
    const worst = [...d].sort((a, b) => a.dd - b.dd)[0];
    const posWithBig = d.filter(p => p.r > 0 && p.dd <= -0.15).length;

    return `
    <header class="page"><div><div class="eyebrow">1995 a 2026 (até 26/10)</div><h1>IBOV e quedas no ano</h1><p class="sub">Retorno anual do Ibovespa comparado à maior queda dentro de cada ano. Mesmo nos anos positivos, quedas fortes no meio do caminho são a regra.</p></div></header>
    <section class="kpis">
      <div class="kpi"><span class="eyebrow">Queda máxima média</span><span class="v">${pct(avgDD)}</span><span class="h">por ano, em média</span></div>
      <div class="kpi"><span class="eyebrow">Anos positivos</span><span class="v">${pos} de ${d.length}</span><span class="h">${pct(pos / d.length, 0)} dos anos</span></div>
      <div class="kpi"><span class="eyebrow">Positivos com queda ≥ 15%</span><span class="v">${posWithBig} de ${pos}</span><span class="h">a queda veio e o ano fechou no azul</span></div>
      <div class="kpi"><span class="eyebrow">Pior queda</span><span class="v">${pct(worst.dd)}</span><span class="h">em ${worst.a}, ano fechou ${pct(worst.r)}</span></div>
    </section>
    <div class="panel"><div class="panel-h"><h2>Retorno anual × queda máxima</h2><div class="legend"><span><i style="background:var(--good)"></i>Retorno positivo</span><span><i style="background:var(--bad)"></i>Retorno negativo</span><span><i style="background:var(--gold);border-radius:50%"></i>Queda máxima no ano</span></div></div>
      <div class="tbl-wrap"><svg viewBox="0 0 ${W} ${H}" style="min-width:680px;width:100%" role="img" aria-label="Gráfico do retorno anual do IBOV e da queda máxima de cada ano">${g}${b}<path d="${ln}" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity=".7"/>${dots}</svg></div>
    </div>`;
  }

  function vCalc() {
    return `
    <header class="page"><div><div class="eyebrow">Simuladores</div><h1>Calculadoras</h1><p class="sub">Juros compostos com aportes mensais e quanto tempo falta para o primeiro milhão, ou para a renda mensal que você quer viver de dividendos.</p></div></header>
    <div class="panel"><div class="panel-h"><h2>Juros compostos</h2></div><div class="calc">
      <div class="form"><label>Valor inicial (R$)<input id="c-ini" type="number" value="10000" step="1000"></label><label>Aporte mensal (R$)<input id="c-ap" type="number" value="1500" step="100"></label>
      <label>Rentabilidade anual (%)<input id="c-tx" type="number" value="10" step="0.5"></label><label>Prazo (anos)<input id="c-an" type="number" value="20" step="1" min="1" max="60"></label></div>
      <div id="c-out" style="min-width:0"></div></div></div>
    <div class="panel"><div class="panel-h"><h2>Meta: primeiro milhão ou renda passiva</h2></div><div class="calc">
      <div class="form"><label>Patrimônio atual (R$)<input id="m-ini" type="number" value="50000" step="1000"></label><label>Aporte mensal (R$)<input id="m-ap" type="number" value="2000" step="100"></label>
      <label>Rentabilidade anual (%)<input id="m-tx" type="number" value="10" step="0.5"></label><label>Meta de patrimônio (R$)<input id="m-meta" type="number" value="1000000" step="50000"></label>
      <label>Dividend yield da carteira na meta (%)<input id="m-dy" type="number" value="8" step="0.5"></label></div>
      <div id="m-out" style="min-width:0"></div></div></div>`;
  }

  function runCalc() {
    const v = id => parseFloat($('#' + id)?.value) || 0;
    if ($('#c-out')) {
      const ini = v('c-ini'), ap = v('c-ap'), tx = v('c-tx') / 100, an = Math.min(Math.max(Math.round(v('c-an')), 1), 60);
      const im = Math.pow(1 + tx, 1 / 12) - 1;
      let s = ini, inv = ini;
      const pts = [{ a: 0, s, inv }];
      for (let m = 1; m <= an * 12; m++) {
        s = s * (1 + im) + ap;
        inv += ap;
        if (m % 12 === 0) pts.push({ a: m / 12, s, inv });
      }
      const W = 560, H = 200, L = 4, B = 22;
      const mx = s || 1;
      const x = i => L + i / (an) * (W - L * 2), y = val => H - B - (val / mx) * (H - B - 10);
      const area = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.a)},${y(p.s)}`).join('') + `L${x(an)},${H - B}L${x(0)},${H - B}Z`;
      const inv2 = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.a)},${y(p.inv)}`).join('');
      $('#c-out').innerHTML = `<div class="eyebrow">Patrimônio em ${an} anos</div><div class="big">${fBRL.format(s)}</div>
      <div class="note">Você investe ${fBRL.format(inv)} e os juros somam ${fBRL.format(s - inv)} (${pct((s - inv) / s, 0)} do total). Taxa mensal equivalente: ${pct(im, 3)}.</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="margin-top:10px" role="img" aria-label="Evolução do patrimônio"><path d="${area}" fill="var(--accent)" opacity=".18"/><path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.a)},${y(p.s)}`).join('')}" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="${inv2}" fill="none" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1.5"/>
      <line x1="${L}" x2="${W - L}" y1="${H - B}" y2="${H - B}" stroke="var(--line)"/><text x="${L}" y="${H - 6}">ano 0</text><text x="${W - L}" y="${H - 6}" text-anchor="end">ano ${an}</text><circle cx="${x(an)}" cy="${y(s)}" r="4" fill="var(--accent)"/></svg>
      <div class="legend"><span><i style="background:var(--accent)"></i>Patrimônio</span><span><i style="background:var(--muted)"></i>Total investido</span></div>`;
    }
    if ($('#m-out')) {
      const ini = v('m-ini'), ap = v('m-ap'), tx = v('m-tx') / 100, meta = v('m-meta'), dy = v('m-dy') / 100;
      const im = Math.pow(1 + tx, 1 / 12) - 1;
      let s = ini, m = 0;
      while (s < meta && m < 1200) {
        s = s * (1 + im) + ap;
        m++;
      }
      const ok = s >= meta;
      const a = Math.floor(m / 12), mm = m % 12;
      const d = new Date(2026, 10 + m, 1);
      $('#m-out').innerHTML = ok ? `<div class="eyebrow">Tempo até a meta</div><div class="big">${a} ano${a === 1 ? '' : 's'}${mm ? ` e ${mm} ${mm === 1 ? 'mês' : 'meses'}` : ''}</div>
      <div class="note">Previsão para ${d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}, com ${fBRL.format(ini + ap * m)} investidos do seu bolso.</div>
      <div class="dl" style="margin-top:14px"><div><dt>Renda mensal com a meta</dt><dd>${fBRL.format(meta * dy / 12)}</dd></div><div><dt>Renda anual com a meta</dt><dd>${fBRL.format(meta * dy)}</dd></div>
      <div><dt>Patrimônio para R$ 5 mil/mês</dt><dd>${dy ? fBRL.format(5000 * 12 / dy) : '—'}</dd></div><div><dt>Patrimônio para R$ 10 mil/mês</dt><dd>${dy ? fBRL.format(10000 * 12 / dy) : '—'}</dd></div></div>`
      : `<div class="eyebrow">Tempo até a meta</div><div class="big">Mais de 100 anos</div><div class="note">Aumente o aporte ou a rentabilidade para chegar à meta.</div>`;
    }
  }

  function drawer(t) {
    const b = BY.bazin[t], p = BY.pl[t];
    if (!b) return;
    const ms = parseMeses(b.meses);
    const inC = S.carteira.find(c => c.t === t);
    $('#layer').innerHTML = `<div class="drawer-bg" data-close></div><div class="drawer" role="dialog" aria-label="${t}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div class="eyebrow">${esc(b.s)}</div><h1 style="font-size:24px">${t}</h1><div class="co" style="font-size:14px">${esc(b.e)}</div></div><button class="x" data-close aria-label="Fechar" style="font-size:18px">✕</button></div>
      <div style="display:flex;gap:16px;align-items:baseline;flex-wrap:wrap"><span class="big">${fBRL2.format(b.p)}</span><span class="note">cotação atual</span></div>
      <div class="dl">
        <div><dt>Teto Bazin adaptado</dt><dd>${fBRL2.format(b.teto)} ${mgPill(b.mg)}</dd></div>
        <div><dt>Teto P/L justo (${fD(p.teto / p.lpa, 1)}x)</dt><dd>${fBRL2.format(p.teto)} ${mgPill(p.mg)}</dd></div>
        <div><dt>Lucro líquido estimado</dt><dd>${big(b.ll)}</dd></div><div><dt>Valor de mercado</dt><dd>${big(b.mc)}</dd></div>
        <div><dt>LPA estimado</dt><dd>${fBRL2.format(b.lpa)}</dd></div><div><dt>DPA bruto projetado</dt><dd>${fBRL2.format(b.dpa)}</dd></div>
        <div><dt>P/L projetado</dt><dd>${fD(b.pl, 1)}</dd></div><div><dt>P/L médio 10 anos</dt><dd>${fD(b.plm, 1)} <span class="note">(${pct(b.dpl, 0)})</span></dd></div>
        <div><dt>Payout esperado</dt><dd>${pct(b.pay, 0)}</dd></div><div><dt>DY bruto projetado</dt><dd>${pct(b.dy)}</dd></div>
        <div><dt>CAGR lucro 5 anos</dt><dd>${pct(b.cagr)}</dd></div><div><dt>Dív. líquida/EBITDA</dt><dd>${fD(b.dl, 2)}</dd></div>
      </div>
      <div><div class="eyebrow" style="margin-bottom:6px">Anúncios de dividendos · ${esc(b.fq)}</div><div class="mbar">${MES.map((m, i) => `<span class="${ms.includes(i) ? 'on' : ''}">${m}</span>`).join('')}</div>${ms.length ? '' : '<div class="note" style="margin-top:6px">Sem padrão definido.</div>'}</div>
      <div class="panel" style="background:var(--sunk);border:0"><div class="eyebrow">Simular posição</div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><input type="number" id="simq" value="${inC ? inC.q : 1000}" step="100" min="0" style="width:120px;font-family:var(--f-mono)" aria-label="Quantidade de ações"><span class="note">ações</span></div>
        <div id="simout" class="note" style="margin-top:8px"></div>
        <button class="pri" id="addpos" style="margin-top:12px">${inC ? 'Atualizar quantidade na carteira' : 'Adicionar à carteira'}</button></div>
    </div>`;

    const sim = () => {
      const q = parseFloat($('#simq').value) || 0;
      $('#simout').innerHTML = `Investimento de <b>${fBRL.format(q * b.p)}</b> · dividendos de <b>${fBRL.format(q * b.dpa)}</b>/ano (${fBRL.format(q * b.dpa / 12)}/mês) · lucro atribuído de ${fBRL.format(q * b.lpa)}/ano.`;
    };
    sim();
    $('#simq').addEventListener('input', sim);
    $('#addpos').onclick = () => {
      const q = parseFloat($('#simq').value) || 0;
      const c = S.carteira.find(c => c.t === t);
      if (c) c.q = q;
      else S.carteira.push({ t, q, lpa: b.lpa, dpa: b.dpa, p: b.p });
      save();
      closeD();
      toast(`${t} ${c ? 'atualizada' : 'adicionada'} na carteira`);
      if (cur !== 'ranking') render();
    };
  }

  function closeD() {
    const layer = $('#layer');
    if (layer) layer.innerHTML = '';
  }

  let cur = 'inicio';

  function navHTML() {
    return VIEWS.map(v => `<a href="#${v.id}" class="${v.id === cur ? 'on' : ''}"><svg viewBox="0 0 24 24">${v.ic}</svg>${v.name}</a>`).join('');
  }

  function render(keepFocus) {
    const nav = $('#nav');
    const mobnav = $('#mobnav');
    const view = $('#view');
    if (!nav || !view) return;

    // Proteção de Acesso à Área de Membros
    const hasVip = window.AuthService && window.AuthService.hasActiveAccess();
    if (!hasVip && cur !== 'inicio') {
      // Se não é VIP e tenta navegar nas ferramentas privadas, exibe a tela elegante de membro restrito
      nav.innerHTML = navHTML();
      if (mobnav) mobnav.innerHTML = VIEWS.map(v => `<a href="#${v.id}" class="${v.id === cur ? 'on' : ''}">${v.name}</a>`).join('');
      view.innerHTML = renderLockedGate(cur);
      return;
    }

    const fid = keepFocus && document.activeElement?.id;
    const sel = fid && document.activeElement.selectionStart;

    nav.innerHTML = navHTML();
    if (mobnav) mobnav.innerHTML = VIEWS.map(v => `<a href="#${v.id}" class="${v.id === cur ? 'on' : ''}">${v.name}</a>`).join('');

    const renderMap = {
      inicio: vInicio,
      'carteira-neto': () => vCarteira(true),
      carteira: () => vCarteira(false),
      ranking: vRanking,
      agenda: vAgenda,
      ibov: vIbov,
      calculadoras: vCalc
    };

    if (renderMap[cur]) {
      view.innerHTML = renderMap[cur]();
    } else {
      view.innerHTML = vInicio();
    }

    if (cur === 'calculadoras') runCalc();

    if (fid) {
      const el = document.getElementById(fid);
      if (el) {
        el.focus();
        try {
          if (sel != null && el.setSelectionRange) el.setSelectionRange(sel, sel);
        } catch (e) {}
      }
    }
  }

  function renderLockedGate(viewId) {
    const viewItem = VIEWS.find(v => v.id === viewId);
    const viewTitle = viewItem ? viewItem.name : 'Recurso Exclusivo';

    return `
      <div class="panel locked-gate-panel" style="text-align:center;padding:56px 24px;max-width:720px;margin:30px auto;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div style="width:54px;height:54px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin-bottom:4px;">
          <svg viewBox="0 0 24 24" style="width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <div class="eyebrow" style="color:var(--accent)">Área de Membros VIP</div>
        <h1 style="font-size:26px;margin:0">${viewTitle} está bloqueado</h1>
        <p class="sub" style="margin:0;font-size:15px;line-height:1.6">
          Este módulo faz parte do acesso completo à plataforma <b>Neto Invest</b>.
          Tenha acesso ao ranking completo de ações com margem de segurança, carteira como holding, calendário anual de dividendos e simuladores.
        </p>

        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;justify-content:center;">
          <button class="pri" style="padding:11px 22px;font-size:14px;" onclick="window.Checkout && window.Checkout.openModal('anual')">
            Assinar Plano e Desbloquear Acesso
          </button>
          <button style="padding:11px 20px;font-size:14px;background:var(--sunk);" onclick="window.AuthService && window.AuthService.quickDemoLogin(true); location.reload();">
            Testar com Acesso VIP (Demo Instantâneo)
          </button>
        </div>

        <div class="note" style="margin-top:8px">
          Já é assinante? <a href="javascript:void(0)" onclick="window.AppUI && window.AppUI.openAuthModal('login')" style="color:var(--accent);font-weight:600">Faça login</a> com sua conta.
        </div>
      </div>
    `;
  }

  function route() {
    const h = location.hash.slice(1);
    // Permite navegar tanto nas rotas do terminal quanto na landing page
    if (VIEWS.some(v => v.id === h)) {
      cur = h;
      // Garante que a seção do terminal esteja visível
      const terminalSection = document.getElementById('terminal-section');
      if (terminalSection) {
        terminalSection.scrollIntoView({ behavior: 'smooth' });
      }
      render();
    }
  }

  window.addEventListener('hashchange', route);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('input.q')) {
      S.carteira = S.carteira.map(c => ({ ...c }));
      const c = S.carteira.find(c => c.t === t.dataset.t);
      if (c) {
        c.q = Math.max(0, parseFloat(t.value) || 0);
        save();
        clearTimeout(window._qt);
        window._qt = setTimeout(() => render(true), 350);
      }
    } else if (t.dataset.g != null) {
      const neto = t.dataset.neto === '1';
      const v = parseFloat(String(t.value).replace(',', '.'));
      const G = (neto ? S.gNeto : S.growth || D.growth).slice();
      G[+t.dataset.g] = isNaN(v) ? 0 : v / 100;
      if (neto) S.gNeto = G;
      else S.growth = G;
      save();
      const out = document.getElementById('projOut');
      if (out) out.innerHTML = projHTML(portfolio(neto ? D.carteira : S.carteira), G);
    } else if (t.id === 'q') {
      S.q = t.value;
      render(true);
    } else if (t.closest('.calc')) {
      runCalc();
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'sector') {
      S.sector = t.value;
      save();
      render();
    }
    if (t.id === 'addSel' && t.value) {
      drawer(t.value);
    }
  });

  document.addEventListener('click', e => {
    const t = e.target;
    const th = t.closest('th.sort');
    if (th) {
      const k = th.dataset.k;
      S.sort = S.sort.k === k ? { k, d: -S.sort.d } : { k, d: (k === 't' || k === 's' || k === 'pl' || k === 'dl') ? 1 : -1 };
      save();
      render();
      return;
    }
    const ag = t.closest('[data-ag]');
    if (ag) {
      S.ag = ag.dataset.ag;
      render();
      return;
    }
    const m = t.closest('[data-m]');
    if (m) {
      S.method = m.dataset.m;
      save();
      render();
      return;
    }
    const del = t.closest('[data-del]');
    if (del) {
      S.carteira = S.carteira.filter(c => c.t !== del.dataset.del);
      save();
      render();
      toast(`${del.dataset.del} removida da carteira`);
      return;
    }
    if (t.closest('[data-close]')) {
      closeD();
      return;
    }
    const op = t.closest('[data-open]');
    if (op) {
      drawer(op.dataset.open);
      return;
    }
    const row = t.closest('tr.click');
    if (row) {
      drawer(row.dataset.t);
      return;
    }
    if (t.id === 'loadEx') {
      S.carteira = D.carteira.map(x => ({ ...x }));
      save();
      render();
      toast('Carteira Neto Invest copiada. Ajuste para as suas quantidades.');
    }
    if (t.id === 'copyNeto') {
      if (S.carteira.length && t.dataset.confirm !== '1') {
        t.dataset.confirm = '1';
        t.textContent = 'Substituir minha carteira? Toque de novo';
        setTimeout(() => {
          t.dataset.confirm = '';
          t.textContent = 'Copiar para Minha carteira';
        }, 3000);
        return;
      }
      S.carteira = D.carteira.map(x => ({ ...x }));
      save();
      location.hash = 'carteira';
      toast('Copiada para Minha carteira. Ajuste para as suas quantidades.');
    }
    if (t.id === 'reset') {
      const resetBtn = t;
      if (resetBtn.dataset.confirm !== '1') {
        resetBtn.dataset.confirm = '1';
        resetBtn.textContent = 'Toque de novo para apagar';
        setTimeout(() => {
          resetBtn.dataset.confirm = '';
          resetBtn.textContent = 'Recomeçar carteira';
        }, 3000);
        return;
      }
      resetBtn.dataset.confirm = '';
      resetBtn.textContent = 'Recomeçar carteira';
      S.carteira = [];
      S.growth = D.growth.slice();
      save();
      render();
      toast('Minha carteira apagada');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeD();
    if (e.key === 'Enter' && e.target.matches('tr.click')) drawer(e.target.dataset.t);
  });

  window.NetoPlatform = {
    init: function() {
      const hash = location.hash.slice(1);
      cur = VIEWS.some(v => v.id === hash) ? hash : 'inicio';
      render();
    },
    render: render,
    navigateTo: function(viewId) {
      if (VIEWS.some(v => v.id === viewId)) {
        cur = viewId;
        location.hash = viewId;
        render();
      }
    }
  };

})(window);
