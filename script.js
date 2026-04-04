const views = document.querySelectorAll('.view');
const commands = document.querySelectorAll('.cmd');
const chips = document.querySelectorAll('.chip');
const chipOutput = document.getElementById('chipOutput');
const typeTarget = document.getElementById('typeTarget');
const repoGrid = document.getElementById('repoGrid');

commands.forEach((btn) => {
  btn.addEventListener('click', () => {
    commands.forEach((c) => c.classList.remove('active'));
    views.forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    const selected = document.getElementById(btn.dataset.view);
    if (selected) selected.classList.add('active');
  });
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    chipOutput.textContent = `Loaded: ${chip.dataset.tag} -> actively used in my current workflow.`;
  });
});

const statuses = [
  'Applying for Master/PhD programs',
  'Building robust ML experiments',
  'Open to research collaboration'
];
let statusIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const current = statuses[statusIndex];
  if (!deleting) {
    charIndex += 1;
    typeTarget.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    charIndex -= 1;
    typeTarget.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      statusIndex = (statusIndex + 1) % statuses.length;
    }
  }
  setTimeout(typeLoop, deleting ? 35 : 60);
}

typeLoop();

async function loadRepos() {
  if (!repoGrid) return;
  repoGrid.innerHTML = '<p class="muted">Loading repositories...</p>';
  try {
    const response = await fetch('https://api.github.com/users/wcx12/repos?sort=updated&per_page=100');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const repos = await response.json();
    const featured = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)))
      .slice(0, 6);

    if (!featured.length) {
      repoGrid.innerHTML = '<p class="muted">No public repositories found yet.</p>';
      return;
    }

    repoGrid.innerHTML = featured.map((repo) => `
      <article class="repo-card">
        <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
        <p class="muted">${repo.description || 'No description yet.'}</p>
        <div class="repo-meta">
          <span>Stars ${repo.stargazers_count}</span>
          <span>${repo.language || 'Mixed'}</span>
        </div>
      </article>
    `).join('');
  } catch (error) {
    repoGrid.innerHTML = '<p class="muted">Unable to load repositories right now.</p>';
  }
}

loadRepos();

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: Math.min(140, Math.floor(window.innerWidth / 10)) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 1.5 + 0.4,
    r: Math.random() * 1.4 + 0.2
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    s.y += s.z;
    if (s.y > canvas.height) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.z > 1.3 ? 'rgba(0, 245, 255, 0.95)' : 'rgba(155, 92, 255, 0.7)';
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawStars();
