// public/js/modal.js
import { $, el, toast as toastFromUtils } from './utils.js';

export const toast = toastFromUtils;

const modal = $('#modal');
const content = $('#modal-content');
const panel = modal?.querySelector('.modal__panel');

function escHtml(s=''){ return s.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }

export function openModal({ title='', html='' } = {}){
  if (!modal) return;
  content.innerHTML = (title ? `<h3 class="modal__title">${escHtml(title)}</h3>` : '') + html;
  modal.dataset.open = '1';
  modal.setAttribute('aria-hidden','false');
  panel?.focus();
}
export function closeModal(){
  if (!modal) return;
  delete modal.dataset.open;
  modal.setAttribute('aria-hidden','true');
  content.innerHTML = '';
}
document.addEventListener('click', (e)=>{
  if (e.target?.classList?.contains('modal__close')){ closeModal(); }
  if (e.target?.closest('#modal') && e.target?.matches('.backdrop')){ closeModal(); }
});

// Build a form for a given item: desc + prompt + optional textarea/file + submit + result box
export function modalHtmlForForm(item){
  const desc = item?.desc ? `<div class="small">${escHtml(item.desc)}</div>` : '';
  const ptxt = item?.prompt ? `<p class="prompt-text">${escHtml(item.prompt)}</p>` : '';

  // Detect if input is needed
  const needsInput = /\[[^\]]+\]|:\s*$/.test(item?.prompt || '');
  let fieldName = 'input';
  let inputHTML = '';
  if (needsInput){
    const m = (item.prompt||'').match(/\[([^\]]+)\]/) || (item.prompt||'').match(/(\w+):\s*$/);
    if (m) fieldName = m[1];
    if (item?.file){
      inputHTML = `<input type="file" name="${escHtml(fieldName)}" />`;
    } else {
      inputHTML = `<textarea name="${escHtml(fieldName)}" rows="3" aria-label="Eingabe"></textarea>`;
    }
  }

  const html = `
    <form data-form="${escHtml(String(item.id))}">
      ${desc}
      ${ptxt}
      ${needsInput ? `<div class="form-row">${inputHTML}</div>` : ''}
      <div class="form-row"><button class="ui btn" type="submit">Absenden</button></div>
      <div class="result"></div>
    </form>`;
  return html;
}
