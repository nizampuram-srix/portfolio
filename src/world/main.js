import '../shared/fonts.js';
import '../shared/tokens.css';
import './world.css';
import { saveChoice } from '../shared/qualityTier.js';
import { startWorld } from './engine/world.js';

saveChoice('world');

const stage = document.getElementById('stage');
const ok = startWorld(stage);

if (!ok) {
  document.getElementById('fallback').hidden = false;
}