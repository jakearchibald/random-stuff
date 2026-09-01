const entries = JSON.parse(document.getElementById('entry-data').textContent);
const input = document.querySelector('#search');
const tree = document.querySelector('#tree');
const results = document.querySelector('#results');
const status = document.querySelector('#status');

const SEPARATORS = '/-_. ';
const GAP_PENALTY = 4;
const CONSECUTIVE_BONUS = 30;
const START_BONUS = 45;
const SEPARATOR_BONUS = 35;
const CAMEL_BONUS = 25;
const CASE_BONUS = 4;
const NEG = -1e9;

/**
 * How valuable it is to match at this position, ignoring what came before.
 * Matches at word starts are what make fuzzy search feel like it's reading
 * initials rather than random letters.
 */
function positionBonus(target, index) {
  if (index === 0) return START_BONUS;
  const prev = target[index - 1];
  if (SEPARATORS.includes(prev)) return SEPARATOR_BONUS;
  const isUpper = (c) => c !== c.toLowerCase() && c === c.toUpperCase();
  if (isUpper(target[index]) && !isUpper(prev)) return CAMEL_BONUS;
  return 0;
}

/**
 * Best-scoring subsequence match of `query` within `target`, or null if
 * `target` doesn't contain `query` as a subsequence. Strings here are tiny, so
 * this walks the full DP table rather than doing anything clever.
 */
function fuzzyMatch(query, target) {
  const n = query.length;
  const m = target.length;
  if (n === 0 || n > m) return null;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let matched = 0;
  for (let j = 0; j < m && matched < n; j++) {
    if (t[j] === q[matched]) matched++;
  }
  if (matched < n) return null;

  const rows = [];
  const backs = [];
  let prevRow = null;

  for (let i = 0; i < n; i++) {
    const row = new Float64Array(m).fill(NEG);
    const back = new Int32Array(m).fill(-1);

    for (let j = i; j < m; j++) {
      if (t[j] !== q[i]) continue;

      let base;
      let from = -1;

      if (i === 0) {
        // Penalise starting deep into the string, but don't let long paths
        // dominate the score.
        base = -Math.min(j, 12) * GAP_PENALTY;
      } else {
        base = NEG;
        for (let k = i - 1; k < j; k++) {
          if (prevRow[k] === NEG) continue;
          const gap = j - k - 1;
          const candidate =
            prevRow[k] -
            gap * GAP_PENALTY +
            (gap === 0 ? CONSECUTIVE_BONUS : 0);
          if (candidate > base) {
            base = candidate;
            from = k;
          }
        }
        if (base === NEG) continue;
      }

      row[j] =
        base +
        positionBonus(target, j) +
        (target[j] === query[i] ? CASE_BONUS : 0);
      back[j] = from;
    }

    rows.push(row);
    backs.push(back);
    prevRow = row;
  }

  let best = NEG;
  let bestIndex = -1;
  for (let j = 0; j < m; j++) {
    if (prevRow[j] > best) {
      best = prevRow[j];
      bestIndex = j;
    }
  }
  if (bestIndex === -1) return null;

  const positions = new Array(n);
  let j = bestIndex;
  for (let i = n - 1; i >= 0; i--) {
    positions[i] = j;
    j = backs[i][j];
  }

  // All else being equal, prefer the shorter target.
  return { score: best - m * 0.4, positions };
}

function scoreEntry(query, entry) {
  const path = fuzzyMatch(query, entry.path);
  const title = entry.title ? fuzzyMatch(query, entry.title) : null;
  if (!path && !title) return null;

  // Paths win ties: they're what you'd type from memory.
  const score = Math.max(
    path ? path.score : NEG,
    title ? title.score - 8 : NEG,
  );
  return { entry, score: path && title ? score + 10 : score, path, title };
}

function highlight(text, positions) {
  const fragment = document.createDocumentFragment();
  const set = new Set(positions);
  let run = '';
  let runIsMatch = false;

  const flush = () => {
    if (!run) return;
    if (runIsMatch) {
      const mark = document.createElement('mark');
      mark.textContent = run;
      fragment.append(mark);
    } else {
      fragment.append(run);
    }
    run = '';
  };

  for (let i = 0; i < text.length; i++) {
    const isMatch = set.has(i);
    if (isMatch !== runIsMatch) {
      flush();
      runIsMatch = isMatch;
    }
    run += text[i];
  }
  flush();

  return fragment;
}

function renderResult(match) {
  const { entry } = match;

  const pathText = match.path
    ? highlight(entry.path, match.path.positions)
    : entry.path;

  const name = document.createElement('span');
  name.className = 'name';
  const path = document.createElement('span');
  path.className = 'path';

  if (entry.title) {
    name.append(
      match.title ? highlight(entry.title, match.title.positions) : entry.title,
    );
    path.append(pathText);
  } else {
    name.append(pathText);
  }

  const link = document.createElement('a');
  link.href = '/' + entry.path + '/';
  link.append(name, path);

  const item = document.createElement('li');
  item.className = 'item';
  item.append(link);
  return item;
}

let selected = -1;

function setSelected(index) {
  const items = [...results.children];
  if (!items.length) {
    selected = -1;
    return;
  }
  selected = (index + items.length) % items.length;
  for (const [i, item] of items.entries()) {
    item.ariaSelected = i === selected ? 'true' : 'false';
  }
  items[selected].scrollIntoView({ block: 'nearest' });
}

function search(query) {
  const compact = query.replace(/\s+/g, '');

  if (!compact) {
    tree.hidden = false;
    results.hidden = true;
    results.replaceChildren();
    status.textContent = '';
    selected = -1;
    return;
  }

  const matches = entries
    .map((entry) => scoreEntry(compact, entry))
    .filter(Boolean)
    .sort(
      (a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path),
    );

  tree.hidden = true;
  results.hidden = false;
  results.replaceChildren(...matches.map(renderResult));
  status.textContent = matches.length
    ? `${matches.length} match${matches.length === 1 ? '' : 'es'}`
    : `Nothing matches “${query}”`;
  setSelected(0);
}

input.addEventListener('input', () => search(input.value));

input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (results.hidden) return;
    event.preventDefault();
    setSelected(selected + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Enter') {
    const link = results.children[selected]?.querySelector('a');
    if (link) link.click();
  } else if (event.key === 'Escape' && input.value) {
    event.preventDefault();
    input.value = '';
    search('');
  }
});

// Typing anywhere on the page should reach the search box.
addEventListener('keydown', (event) => {
  if (
    event.target === input ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return;
  }
  if (event.key.length === 1 || event.key === 'Backspace') input.focus();
});

search(input.value);
