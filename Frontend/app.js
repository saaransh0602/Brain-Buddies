// ========= Helpers =========
const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));

const toastEl = $('#bbToast');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;
function notify(msg){ if($('#bbToastBody')) $('#bbToastBody').textContent = msg; if(toast) toast.show(); }

const load = k => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const getUser = () => JSON.parse(localStorage.getItem('currentUser') || 'null');
const setUser = (u) => localStorage.setItem('currentUser', JSON.stringify(u));
const removeUser = () => localStorage.removeItem('currentUser');

// Simple id
const nid = () => Date.now() + Math.floor(Math.random()*1000);

// ========= State =========
let currentUser = null;

// ========= Seed demo data (only once) =========
(function seed(){
  if(load('seeded').length) return;
  const demoCourses = [
    { id:nid(), title:'Modern JavaScript', category:'Web Dev', description:'From basics to ES2023, async, and tooling.', price:0, instructorId:-1, instructorName:'Priya Sharma', instructorVerified:true, thumb:'' },
    { id:nid(), title:'Intro to Machine Learning', category:'ML/AI', description:'Core ML concepts with practical demos.', price:499, instructorId:-2, instructorName:'Rahul Menon', instructorVerified:true, thumb:'' },
    { id:nid(), title:'UI/UX Fundamentals', category:'Design', description:'Design thinking, wireframes, and usability.', price:299, instructorId:-3, instructorName:'Aisha Khan', instructorVerified:false, thumb:'' },
  ];
  save('courses', demoCourses);
  save('reviews', [
    { id:nid(), courseId: demoCourses[0].id, studentId:-101, rating:5, comment:'Clear and up-to-date!' },
    { id:nid(), courseId: demoCourses[1].id, studentId:-102, rating:4, comment:'Loved the intuition-first approach.' }
  ]);
  save('enrollments', []);
  save('users', load('users')); // keep if any
  save('seeded', [true]);
})();

// ========= Auth =========
$('#signupForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('#signupName').value.trim();
  const email = $('#signupEmail').value.trim().toLowerCase();
  const password = $('#signupPassword').value;
  const role = $('#roleInstructor').checked ? 'instructor' : 'student';

  const users = load('users');
  if(users.find(u=>u.email===email)) return notify('User already exists');

  // simple auto-verify rule for demo
  const autoVerified = role==='instructor' && (email.endsWith('.edu') || email.endsWith('.ac.in'));
  const u = { id:nid(), name, email, password, role, isVerified:autoVerified };
  users.push(u); save('users', users);
  notify('Signup successful. Please login.');
  e.target.reset();
  $('#login-tab').click();
});

$('#loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const password = $('#loginPassword').value;
  const u = load('users').find(u=>u.email===email && u.password===password);
  if(!u) return notify('Invalid credentials');

  currentUser = u; setUser(u);
  enterApp();
});

$('#logoutBtn').addEventListener('click', ()=>{
  removeUser(); currentUser = null;
  $('#mainApp').classList.add('d-none');
  $('#authSection').classList.remove('d-none');
  notify('Logged out');
});

// Restore session
window.addEventListener('DOMContentLoaded', ()=>{
  const u = getUser();
  if(u){ currentUser = u; enterApp(); }
});

// ========= App shell =========
function enterApp(){
  // toggle views
  $('#authSection').classList.add('d-none');
  $('#mainApp').classList.remove('d-none');

  // header
  $('#userName').textContent = currentUser.name;
  $('#topRoleBadge').textContent = currentUser.role==='instructor' ? 'Instructor' : 'Student';

  // sidebar items
  $$('.student-only').forEach(el => el.classList.toggle('d-none', currentUser.role!=='student'));
  $$('.instructor-only').forEach(el => el.classList.toggle('d-none', currentUser.role!=='instructor'));

  // default page
  if(currentUser.role==='student') showPage('catalog'); else showPage('instructorOverview');

  // profile
  $('#profileName').textContent = currentUser.name;
  $('#profileEmail').textContent = currentUser.email;
  $('#profileRole').textContent = currentUser.role;
  $('#profileVerified').innerHTML = currentUser.role==='instructor' && currentUser.isVerified
    ? `<span class="bb-badge-verified"><i class="bi bi-patch-check-fill"></i> Verified</span>`
    : '';

  // renders
  renderCatalog();
  renderMyLearning();
  renderInstructor();
}

// sidebar navigation
$('#sidebarNav').addEventListener('click', (e)=>{
  const link = e.target.closest('[data-page]');
  if(!link) return;
  e.preventDefault();
  $$('#sidebarNav .nav-link').forEach(a=>a.classList.remove('active'));
  link.classList.add('active');
  showPage(link.dataset.page);
});

function showPage(name){
  $$('.bb-page').forEach(p => p.classList.add('d-none'));
  const map = {
    catalog:'#page-catalog',
    mylearning:'#page-mylearning',
    instructorOverview:'#page-instructorOverview',
    instructorCourses:'#page-instructorCourses',
    createCourse:'#page-createCourse',
    profile:'#page-profile'
  };
  const target = $(map[name]);
  if(target) target.classList.remove('d-none');
  // refresh relevant views
  if(name==='catalog') renderCatalog();
  if(name==='mylearning') renderMyLearning();
  if(name==='instructorOverview' || name==='instructorCourses') renderInstructor();
}

// ========= Data helpers =========
function avgRating(courseId){
  const rs = load('reviews').filter(r=>r.courseId===courseId);
  if(!rs.length) return 0;
  return +(rs.reduce((a,c)=>a+c.rating,0)/rs.length).toFixed(1);
}
function stars(n){
  if(!n) return `<span class="text-muted">No ratings yet</span>`;
  const full = Math.floor(n);
  const half = n - full >= .5 ? 1 : 0;
  const empty = 5 - full - half;
  return `<span class="bb-stars">${'★'.repeat(full)}${half?'☆':''}${'☆'.repeat(empty)}</span> <span class="text-muted">(${n})</span>`;
}

// ========= Catalog (Student) =========
$('#searchInput').addEventListener('input', renderCatalog);

function renderCatalog(){
  if(!currentUser) return;
  const q = $('#searchInput').value?.toLowerCase() || '';
  const wrap = $('#courseGrid');
  const courses = load('courses').filter(c =>
    c.title.toLowerCase().includes(q) ||
    (c.category||'').toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  );

  wrap.innerHTML = '';
  $('#catalogEmpty').classList.toggle('d-none', !!courses.length);

  courses.forEach(c=>{
    const col = document.createElement('div'); col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${c.thumb||'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop'}" class="card-img-top" style="height:160px; object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between">
            <span class="badge text-bg-secondary">${c.category||'General'}</span>
            <span class="small text-muted">${c.price>0?`₹${c.price}`:'Free'}</span>
          </div>
          <h5 class="card-title mt-2">${c.title}</h5>
          <div class="small text-muted mb-2">By ${c.instructorName} ${c.instructorVerified?'<span class="bb-badge-verified ms-1"><i class="bi bi-patch-check-fill"></i> Verified</span>':''}</div>
          <div class="mb-2">${stars(avgRating(c.id))}</div>
          <p class="card-text flex-grow-1">${c.description.slice(0,120)}...</p>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary w-50" data-action="view" data-id="${c.id}"><i class="bi bi-eye me-1"></i>Details</button>
            ${currentUser.role==='student' ? `<button class="btn btn-primary w-50" data-action="enroll" data-id="${c.id}"><i class="bi bi-bag-plus me-1"></i>Enroll</button>`:''}
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });

  // actions
  wrap.onclick = (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const id = +btn.dataset.id;
    if(btn.dataset.action==='view') openCourseModal(id);
    if(btn.dataset.action==='enroll') enrollCourse(id);
  };
}

// Course Modal
const courseModal = new bootstrap.Modal('#courseModal');
const reviewModal = new bootstrap.Modal('#reviewModal');
let modalCourseId = null;

function openCourseModal(id){
  modalCourseId = id;
  const c = load('courses').find(x=>x.id===id);
  if(!c) return;

  $('#courseModalTitle').textContent = c.title;
  $('#courseModalCategory').textContent = c.category||'General';
  $('#courseModalInstructor').innerHTML = `${c.instructorName} ${c.instructorVerified?'<span class="bb-badge-verified ms-1"><i class="bi bi-patch-check-fill"></i> Verified</span>':''}`;
  $('#courseModalDesc').textContent = c.description;
  $('#courseModalPrice').textContent = c.price>0 ? `₹${c.price}` : 'Free';
  $('#courseModalThumb').src = c.thumb || 'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop';
  $('#courseModalRating').innerHTML = stars(avgRating(c.id));

  // reviews
  const list = $('#courseModalReviews'); list.innerHTML='';
  const rs = load('reviews').filter(r=>r.courseId===c.id);
  $('#noReviews').classList.toggle('d-none', !!rs.length);
  rs.forEach(r=>{
    const li = document.createElement('div');
    li.className = 'p-2 border rounded';
    const user = load('users').find(u=>u.id===r.studentId);
    li.innerHTML = `<div class="d-flex justify-content-between"><b>${user?user.name:'Learner'}</b><span>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div><div class="text-muted">${r.comment||''}</div>`;
    list.appendChild(li);
  });

  // footer buttons
  const already = load('enrollments').some(e=>e.courseId===id && e.studentId===currentUser?.id);
  $('#enrollBtn').disabled = currentUser?.role!=='student' || already;
  $('#enrollBtn').textContent = already ? 'Enrolled' : 'Enroll';
  $('#reviewBtn').disabled = currentUser?.role!=='student' || !already;

  courseModal.show();
}

$('#enrollBtn').addEventListener('click', ()=>{ if(modalCourseId) enrollCourse(modalCourseId, true); });
$('#reviewBtn').addEventListener('click', ()=>{
  if(!modalCourseId) return;
  $('#reviewRating').value = '5';
  $('#reviewComment').value = '';
  reviewModal.show();
});
$('#reviewForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const rating = +$('#reviewRating').value;
  const comment = $('#reviewComment').value.trim();
  const reviews = load('reviews');
  reviews.push({ id:nid(), courseId:modalCourseId, studentId:currentUser.id, rating, comment });
  save('reviews', reviews);
  reviewModal.hide();
  notify('Review submitted');
  renderCatalog();
  openCourseModal(modalCourseId);
});

// enroll
function enrollCourse(courseId, fromModal=false){
  if(currentUser?.role!=='student'){ notify('Only students can enroll'); return; }
  const enrollments = load('enrollments');
  if(enrollments.some(e=>e.courseId===courseId && e.studentId===currentUser.id)){
    notify('Already enrolled'); return;
  }
  enrollments.push({ courseId, studentId:currentUser.id, at:new Date().toISOString() });
  save('enrollments', enrollments);
  notify('Enrolled successfully');
  renderMyLearning();
  renderCatalog();
  if(fromModal){ openCourseModal(courseId); }
}

// ========= My Learning (Student) =========
function renderMyLearning(){
  if(!currentUser) return;
  const wrap = $('#myLearningGrid');
  wrap.innerHTML='';
  const enrollments = load('enrollments').filter(e=>e.studentId===currentUser.id);
  const courses = load('courses');
  $('#myLearningEmpty').classList.toggle('d-none', !!enrollments.length);
  enrollments.forEach(e=>{
    const c = courses.find(x=>x.id===e.courseId);
    if(!c) return;
    const col = document.createElement('div'); col.className='col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${c.thumb||'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop'}" class="card-img-top" style="height:160px; object-fit:cover;">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title">${c.title}</h5>
            <span class="badge text-bg-success">Enrolled</span>
          </div>
          <div class="small text-muted mb-2">By ${c.instructorName}</div>
          <div class="progress" role="progressbar" aria-label="Progress">
            <div class="progress-bar" style="width:${Math.floor(Math.random()*60+30)}%"></div>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-outline-secondary" onclick="openCourseModal(${c.id})"><i class="bi bi-eye me-1"></i>View details</button>
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

// ========= Instructor Views =========
function renderInstructor(){
  if(!currentUser || currentUser.role!=='instructor') return;
  const all = load('courses').filter(c=>c.instructorId===currentUser.id);
  const enrollments = load('enrollments').filter(e=>all.some(c=>c.id===e.courseId));
  const ratings = all.flatMap(c=>load('reviews').filter(r=>r.courseId===c.id).map(r=>r.rating));
  const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2) : '—';

  // metrics
  $('#metricTotalCourses').textContent = all.length;
  $('#metricEnrollments').textContent = enrollments.length;
  $('#metricAvgRating').textContent = avg;

  // list
  const list = $('#instructorCourseList'); list.innerHTML='';
  $('#instructorCoursesEmpty').classList.toggle('d-none', !!all.length);
  all.forEach(c=>{
    const nEnroll = enrollments.filter(e=>e.courseId===c.id).length;
    const col = document.createElement('div'); col.className='col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${c.thumb||'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop'}" class="card-img-top" style="height:160px; object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <span class="badge text-bg-secondary align-self-start">${c.category||'General'}</span>
          <h5 class="card-title mt-2">${c.title}</h5>
          <div class="small text-muted mb-2">${stars(avgRating(c.id))}</div>
          <div class="small text-muted mb-3">${nEnroll} enrollment(s)</div>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-outline-secondary w-50" data-iedit="${c.id}"><i class="bi bi-pencil-square me-1"></i>Edit</button>
            <button class="btn btn-outline-danger w-50" data-idel="${c.id}"><i class="bi bi-trash me-1"></i>Delete</button>
          </div>
        </div>
      </div>`;
    list.appendChild(col);
  });

  // edit/delete actions
  list.onclick = (e)=>{
    const editBtn = e.target.closest('[data-iedit]');
    const delBtn = e.target.closest('[data-idel]');
    if(editBtn){
      const id = +editBtn.dataset.iedit;
      const c = load('courses').find(x=>x.id===id);
      if(!c) return;
      $('#editCourseId').value = c.id;
      $('#editCourseTitle').value = c.title;
      $('#editCourseCategory').value = c.category || '';
      $('#editCourseDesc').value = c.description;
      $('#editCoursePrice').value = c.price || 0;
      $('#editCourseThumb').value = c.thumb || '';
      new bootstrap.Modal('#editCourseModal').show();
    }
    if(delBtn){
      const id = +delBtn.dataset.idel;
      if(confirm('Delete this course?')){
        const courses = load('courses').filter(x=>x.id!==id);
        save('courses', courses);
        notify('Course deleted');
        renderInstructor();
        renderCatalog();
      }
    }
  };
}

// Create course
$('#createCourseForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  if(currentUser?.role!=='instructor') return notify('Only instructors can create courses');
  const title = $('#courseTitle').value.trim();
  const category = $('#courseCategory').value.trim();
  const description = $('#courseDesc').value.trim();
  const price = +($('#coursePrice').value || 0);
  const thumb = $('#courseThumb').value.trim();

  const courses = load('courses');
  courses.push({
    id:nid(), title, category, description, price,
    instructorId: currentUser.id, instructorName: currentUser.name,
    instructorVerified: !!currentUser.isVerified,
    thumb
  });
  save('courses', courses);
  e.target.reset();
  notify('Course published');
  showPage('instructorCourses');
  renderInstructor(); renderCatalog();
});

// Edit course
$('#editCourseForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = +$('#editCourseId').value;
  const courses = load('courses');
  const idx = courses.findIndex(c=>c.id===id);
  if(idx<0) return;
  courses[idx].title = $('#editCourseTitle').value.trim();
  courses[idx].category = $('#editCourseCategory').value.trim();
  courses[idx].description = $('#editCourseDesc').value.trim();
  courses[idx].price = +($('#editCoursePrice').value || 0);
  courses[idx].thumb = $('#editCourseThumb').value.trim();
  save('courses', courses);
  notify('Course updated');
  bootstrap.Modal.getInstance($('#editCourseModal')).hide();
  renderInstructor(); renderCatalog();
});

