import NAME from '../common/common';
import { FingerTab }  from '../common/FingerTab';

export function init() {
  document.write(`<h1>The name is ${NAME}</h1>`);
  document.write('<canvas id="myCanvas" width="200" height="100"></canvas>');
  
  document.addEventListener('click', function() {
    const ft = new FingerTab(700, 200, 5);
    ft.draw();
  });
}

$(document).ready(() => {
  console.log('page is loaded and ready');
  init();
});
