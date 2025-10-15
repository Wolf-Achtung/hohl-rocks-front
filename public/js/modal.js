// js/modal.js
import { $, el } from './utils.js';

const modal = $('#modal');
const panel = $('.modal__panel', modal);
const body = $('#modal-content');
const title = $('#modal-title');
const toastEl = $('#toast');

export function toast(text){
  toastEl.textContent = text;
  toastEl.setAttribute('data-show','1');
  setTimeout(()=> toastEl.removeAttribute('data-show'), 1800);
}

export function openModal({title: t='Aktion', html=''}){
  title && (document.getElementById('modal-title').textContent = t);
  body.innerHTML = html || '';
  modal.setAttribute('aria-hidden','false');
  setTimeout(()=> panel?.focus(), 0);
}
export function closeModal(){ modal.setAttribute('aria-hidden','true'); body.innerHTML=''; }

document.addEventListener('click', (e)=>{
  if(e.target.matches('#modal-close')) closeModal();
  if(e.target.matches('[data-copy="modal"]')){
    const txt = body.innerText || body.textContent || '';
    navigator.clipboard.writeText(txt);
    toast('Kopiert ✓');
  }
});

export function modalHtmlForForm(item){
  const fields = (item.fields||[]).map(f=>{
    if(f.type==='textarea') return `<div class="form-row"><label for="${f.name}">${f.label||f.name}</label><textarea id="${f.name}" name="${f.name}" rows="${f.rows||4}" placeholder="${f.placeholder||''}"></textarea></div>`;
    if(f.type==='file') return `<div class="form-row"><label for="${f.name}">${f.label||f.name}</label><input id="${f.name}" name="${f.name}" type="file" accept="${f.accept||'*/*'}" /></div>`;
    return `<div class="form-row"><label for="${f.name}">${f.label||f.name}</label><input id="${f.name}" name="${f.name}" type="${f.type||'text'}" placeholder="${f.placeholder||''}" /></div>`;
  }).join('');
  return `<form class="ui form" data-form="${item.id}">${fields}<div class="form-row"><button class="ui btn" type="submit">Start</button></div></form><div class="result"></div>`;
}
