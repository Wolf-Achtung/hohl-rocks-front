// public/js/bubbleEngine.js
import { $, el, clamp, storage } from './utils.js';
import { openModal, modalHtmlForForm, toast } from './modal.js';
import { runBubble } from './api.js';

const container = $('#bubbles');

// Motion (angepasst: weniger/sanfter)
const MAX_SPEED = 12, MIN_SPEED = 4, BREATHE = 0.18;
const MAX_ACTIVE = 6, TTL_MIN = 18000, TTL_MAX = 32000;
const SIZE_MAP = { s:110, m:160, l:210, xl:260 };

let layout = (storage('prefs').get() || {}).layout || 'drift';

const bubbles = [];
let itemsQueue = [], queueIdx = 0;

/* … Rest deiner bestehenden Datei unverändert … */
