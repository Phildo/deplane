class SimEl
{
  constructor(_title, _id)
  {
    var c = document.getElementById('simulations');
    var div = document.createElement('div');
    div.class = "simulation";
    div.innerHTML = 
        '<h2>'+_title+'</h2>\
        <canvas id="canvas'+_id+'" width="200" height="400"></canvas>\
        <div>Status: <span id="status'+_id+'">Ready</span></div>\
        <div>Iterations: <span id="iterations'+_id+'">0</span></div>\
        <div>Time: <span id="time'+_id+'">0</span> ms</div>';
    c.appendChild(div);
    this.title = _title;
    this.id = _id;
    this.canvas = document.getElementById('canvas'+_id);
    this.ctx = this.canvas.getContext('2d');
    this.status = document.getElementById('status'+_id);
    this.iterations = document.getElementById('iterations'+_id);
    this.time = document.getElementById('time'+_id);
  }
}

class DOM
{
  init = function()
  {
    this.startBtn = document.getElementById('startBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.speedInput = document.getElementById('speed');
    this.speedValue = document.getElementById('speedValue');
    this.rowsInput = document.getElementById('rows');
    this.rowsValue = document.getElementById('rowsValue');
    this.colsInput = document.getElementById('cols');
    this.colsValue = document.getElementById('colsValue');
    this.baggetInput = document.getElementById('bagget');
    this.baggetValue = document.getElementById('baggetValue');
    this.rowwalkInput = document.getElementById('rowwalk');
    this.rowwalkValue = document.getElementById('rowwalkValue');
    this.aislewalkInput = document.getElementById('aislewalk');
    this.aislewalkValue = document.getElementById('aislewalkValue');
    this.results = document.getElementById('results');

    this.speedInput.addEventListener('input', () => { this.speedValue.textContent = this.speedInput.value; });
    this.rowsInput.addEventListener('input', () => { this.rowsValue.textContent = this.rowsInput.value; });
    this.colsInput.addEventListener('input', () => { this.colsValue.textContent = this.colsInput.value; });
    this.baggetInput.addEventListener('input', () => { this.baggetValue.textContent = this.baggetInput.value; });
    this.rowwalkInput.addEventListener('input', () => { this.rowwalkValue.textContent = this.rowwalkInput.value; });
    this.aislewalkInput.addEventListener('input', () => { this.aislewalkValue.textContent = this.aislewalkInput.value; });
    this.resetBtn.addEventListener('click', resetSimulations);
    this.startBtn.addEventListener('click', startSimulations);
    
    this.speedValue.textContent = this.speedInput.value;
    this.rowsValue.textContent = this.rowsInput.value;
    this.colsValue.textContent = this.colsInput.value;
    this.baggetValue.textContent = this.baggetInput.value;
    this.rowwalkValue.textContent = this.rowwalkInput.value;
    this.aislewalkValue.textContent = this.aislewalkInput.value;
  }

  speed() { return parseInt(dom.speedInput.value); }
  rows() { return parseInt(dom.rowsInput.value); }
  cols() { return parseInt(dom.colsInput.value); }
  bagget() { return (5-parseInt(dom.baggetInput.value))*100; }
  rowwalk() { return (parseInt(dom.rowwalkInput.value)-1)/4 * 5; }
  aislewalk() { return (parseInt(dom.aislewalkInput.value)-1)/4 * 5; }
};
